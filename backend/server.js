const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const protect = require("./middleware/authMiddleware");
const appointmentRoutes = require("./routes/appointmentRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const queueRoutes = require("./routes/queueRoutes");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/queue", queueRoutes);
app.get("/", (req, res) => {
    res.json({
        message: "Appointment Management API is running!"
    });
});
app.get("/api/test-protected", protect, (req, res) => {
    res.json({
        message: "You are authenticated!",
        user: req.user
    });
});

connectDB();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});


