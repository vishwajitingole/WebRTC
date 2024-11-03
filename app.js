const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const axios = require("axios");

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

// Store user data
const userData = [];

// Endpoint to track user
app.post('/track-user', async(req, res) => {
    const ip = req.ip; // Get the user's IP address
    const userAgent = req.headers['user-agent']; // Get the user's device information
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone; // Get the user's time zone

    try {
        // Fetch geolocation and ISP info using an external API
        const response = await axios.get(`http://ip-api.com/json/${ip}`);
        const geolocationData = response.data;

        const userInfo = {
            ip,
            userAgent,
            timeZone,
            geolocation: {
                country: geolocationData.country,
                region: geolocationData.regionName,
                city: geolocationData.city,
                zip: geolocationData.zip,
                lat: geolocationData.lat,
                lon: geolocationData.lon,
                isp: geolocationData.isp,
            },
        };

        // Store user data
        userData.push(userInfo);
        res.status(200).send({ message: 'User tracked successfully', userInfo });
    } catch (error) {
        console.error("Error fetching geolocation data:", error);
        res.status(500).send({ message: 'Failed to track user' });
    }
});

// Endpoint to retrieve all user data
app.get('/user-data', (req, res) => {
    res.status(200).send(userData);
});

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
    res.render("end"); // Render the end.ejs view
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running at PORT ${PORT}`);
});