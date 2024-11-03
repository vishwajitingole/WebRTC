const express = require("express");
const app = express();

// WebRTC setup
const http = require("http");
const socketIO = require("socket.io");
const server = http.createServer(app);
const io = socketIO(server);

const path = require("path");
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

io.on("connection", (socket) => {
    console.log("Client connected");

    socket.on("signalingMessage", (message) => {
        socket.broadcast.emit("signalingMessage", message); // Broadcast message to all other clients
    });

    socket.on("disconnect", () => {
        console.log("Client disconnected");
    });
});

app.get("/", (req, res) => {
    res.render("index"); // Render the index.ejs view
});

server.listen(3000, () => {
    console.log("Server running at PORT 3000");
});