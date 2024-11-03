const express = require("express");
const app = express();

// WebRTC setup
const http = require("http");
const socketIO = require("socket.io");
const server = http.createServer(app);
const io = socketIO(server, {
    cors: {
        origin: "*", // Allow all origins (change as needed for security)
        methods: ["GET", "POST"],
    },
});

const path = require("path");
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

// Handle Socket.IO connections
io.on("connection", (socket) => {
    console.log("Client connected");

    // Relay signaling messages to other clients
    socket.on("signalingMessage", (message) => {
        socket.broadcast.emit("signalingMessage", message);
    });

    // Log when a client disconnects
    socket.on("disconnect", () => {
        console.log("Client disconnected");
    });
});

app.get("/", (req, res) => {
    res.render("index"); // Render the index.ejs view
});
app.get("/end", (req, res) => {
    res.render("end"); // Render the index.ejs view
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running at PORT ${PORT}`);
});