const express = require("express");

const {
    createAppointment,
    rejoinQueue,
    getMyAppointment,
    cancelAppointment
} = require("../controllers/appointmentController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, createAppointment);
router.post("/rejoin", protect, rejoinQueue);
router.get("/my", protect, getMyAppointment);
router.delete("/:appointmentId", protect, cancelAppointment);

module.exports = router;