const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const http = require("http");
const socketIO = require("socket.io");
const axios = require("axios");
const path = require("path");

const server = http.createServer(app);
const io = socketIO(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});

app.use(bodyParser.json());
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.render("index");
})

app.get("/end", (req, res) => {
    res.render("end");
})

const userData = [];
const uniqueIPs = new Set();

// Endpoint to track user
app.post('/track-user', async(req, res) => {
    // Get the user's public IP address
    let ip;
    if (req.headers['x-forwarded-for']) {
        ip = req.headers['x-forwarded-for'].split(',')[0];
    } else {
        ip = req.connection.remoteAddress;
    }

    // Convert IPv6 localhost (::1) to a public IP for local testing
    if (ip === '::1') {
        ip = '8.8.8.8'; // Placeholder for testing (use a real public IP when not testing locally)
    }

    const userAgent = req.headers['user-agent'];
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    try {
        // Fetch geolocation data
        const response = await axios.get(`http://ip-api.com/json/${ip}`);
        const geolocationData = response.data;
        if (uniqueIPs.has(ip)) {
            return res.status(200).send({ message: 'User already tracked', userInfo: userData.find(user => user.ip === ip) });
        }

        // Check if geolocation API request was successful
        if (geolocationData.status !== 'success') {
            console.error("Geolocation API failed:", geolocationData.message);
            return res.status(400).send({ message: 'Failed to retrieve geolocation data' });
        }

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
        uniqueIPs.add(ip); // Add the IP to the set
        res.status(200).send({ message: 'User tracked successfully', userInfo });
    } catch (error) {
        console.error("Error fetching geolocation data:", error);
        res.status(500).send({ message: 'Failed to track user' });
    }
});


app.get('/user-data', (req, res) => {
    res.status(200).send(userData);
});


io.on("connection", (socket) => {
    console.log("Client connected");
    socket.on("signalingMessage", (message) => {
        socket.broadcast.emit("signalingMessage", message);
    });
    socket.on("disconnect", () => {
        console.log("Client disconnected");
    });
});


const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running at PORT ${PORT}`);
});