const express = require("express");
const app = express();
const bodyParser = require("body-parser");

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
app.use(bodyParser.json());

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
app.post('/track-user', (req, res) => {
    const { ip, device } = req.body;
    const userIdentifier = `${ip}-${device}`;

    // Add user only if it's unique
    if (!uniqueUsers.has(userIdentifier)) {
        uniqueUsers.add(userIdentifier);
        userData.push({ ip, device });
    }
    res.status(200).send({ uniqueUsersCount: uniqueUsers.size });
});
// Store user data
const userData = [];

// Endpoint to track user
app.post('/track-user', (req, res) => {
    const ip = req.ip; // Get the user's IP address
    const userAgent = req.headers['user-agent']; // Get the user's device information

    // Store user data
    userData.push({ ip, userAgent });

    res.status(200).send({ message: 'User tracked successfully' });
});

// Endpoint to retrieve all user data
app.get('/user-data', (req, res) => {
    res.status(200).send(userData);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running at PORT ${PORT}`);
});