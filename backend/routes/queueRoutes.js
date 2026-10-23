const express = require("express");

const {
    getQueue,
    callNext,
    completeAppointment,
    skipAppointment,
    getDashboard
} = require("../controllers/queueController");

const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");

const router = express.Router();

// Admin can view today's queue
router.get("/", protect, adminOnly, getQueue);
router.post("/next", protect, adminOnly, callNext);
router.post("/complete", protect, adminOnly, completeAppointment);
router.post("/skip", protect, adminOnly, skipAppointment);
router.get("/dashboard", protect, adminOnly, getDashboard);

module.exports = router;