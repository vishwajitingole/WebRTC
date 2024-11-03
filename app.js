const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const http = require("http");
const socketIO = require("socket.io");
const axios = require("axios");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});

// MongoDB URI (ensure to replace <password> and <dbname> with your actual credentials and database name)
const mongoURI = "mongodb+srv://invishwn:Xli9Yqb2v98zxGmh@cluster0.jvwnduc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Improved MongoDB connection with enhanced error handling
mongoose.connect(mongoURI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => console.log('MongoDB connected'))
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1); // Exits the process if MongoDB connection fails
    });

// Define the User model with Mongoose
const userSchema = new mongoose.Schema({
    ip: { type: String, required: true, unique: true },
    userAgent: String,
    timeZone: String,
    geolocation: {
        country: String,
        region: String,
        city: String,
        zip: String,
        lat: Number,
        lon: Number,
        isp: String,
    },
});

const User = mongoose.model('User', userSchema);

app.use(bodyParser.json());
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.render("index");
});

app.get("/end", (req, res) => {
    res.render("end");
});

// Endpoint to track user
app.post('/track-user', async(req, res) => {
    let ip;
    if (req.headers['x-forwarded-for']) {
        ip = req.headers['x-forwarded-for'].split(',')[0];
    } else {
        ip = req.connection.remoteAddress;
    }

    // Default IP for local development
    if (ip === '::1') {
        ip = '8.8.8.8';
    }

    const userAgent = req.headers['user-agent'];
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    try {
        const response = await axios.get(`http://ip-api.com/json/${ip}`);
        const geolocationData = response.data;

        if (geolocationData.status !== 'success') {
            console.error("Geolocation API failed:", geolocationData.message);
            return res.status(400).send({ message: 'Failed to retrieve geolocation data' });
        }

        const existingUser = await User.findOne({ ip });
        if (existingUser) {
            return res.status(200).send({ message: 'User already tracked', userInfo: existingUser });
        }

        const userInfo = new User({
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
        });

        await userInfo.save();
        res.status(200).send({ message: 'User tracked successfully', userInfo });
    } catch (error) {
        console.error("Error fetching geolocation data:", error);
        res.status(500).send({ message: 'Failed to track user' });
    }
});

// Endpoint to retrieve all user data
app.get('/user-data', async(req, res) => {
    try {
        const users = await User.find();
        res.status(200).send(users);
    } catch (error) {
        console.error("Error fetching user data:", error);
        res.status(500).send({ message: 'Failed to retrieve user data' });
    }
});

// WebSocket setup
io.on("connection", (socket) => {
    console.log("Client connected");
    socket.on("signalingMessage", (message) => {
        socket.broadcast.emit("signalingMessage", message);
    });
    socket.on("disconnect", () => {
        console.log("Client disconnected");
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running at PORT ${PORT}`);
});