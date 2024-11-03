const socket = io();
let local;
let remote = new MediaStream();
let peerConnection;

socket.on("connect", () => {
    console.log("Socket connected:", socket.id);
});

async function initialise() {
    socket.on("signalingMessage", handleSignalingMessage);

    local = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
    document.querySelector("#localVideo").srcObject = local;

    initiateOffer();
}
initialise();

async function initiateOffer() {
    await createPeerConnection();

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.emit("signalingMessage", JSON.stringify({ type: "offer", offer }));
}

const rtcSetting = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};

async function createPeerConnection() {
    peerConnection = new RTCPeerConnection(rtcSetting);

    document.querySelector("#remoteVideo").srcObject = remote;
    document.querySelector("#remoteVideo").style.display = "block";
    document.querySelector("#localVideo").classList.add("smallFrame");

    local.getTracks().forEach(track => {
        peerConnection.addTrack(track, local);
    });

    peerConnection.ontrack = (e) => {
        e.streams[0].getTracks().forEach((track) => {
            remote.addTrack(track);
        });
        document.querySelector("#remoteVideo").srcObject = remote;
    };

    peerConnection.onicecandidate = (e) => {
        if (e.candidate) {
            socket.emit("signalingMessage", JSON.stringify({ type: "candidate", candidate: e.candidate }));
        }
    };
}

async function handleSignalingMessage(message) {
    const { type, offer, answer, candidate } = JSON.parse(message);
    if (type === "offer") {
        handleOffer(offer);
    }
    if (type === "answer") {
        handleAnswer(answer);
    }
    if (type === "candidate" && peerConnection) {
        peerConnection.addIceCandidate(candidate);
    }
}

const handleOffer = async(offer) => {
    await createPeerConnection();
    await peerConnection.setRemoteDescription(offer);

    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    socket.emit("signalingMessage", JSON.stringify({ type: "answer", answer }));
};

const handleAnswer = async(answer) => {
    if (!peerConnection.currentRemoteDescription) {
        peerConnection.setRemoteDescription(answer);
    }
};

window.addEventListener("beforeunload", () => socket.disconnect());