const express = require("express");
const adminOnly = require("../middleware/adminMiddleware");
const {
    getSettings,
    updateSettings
} = require("../controllers/settingsController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getSettings);

router.put("/", protect, adminOnly, updateSettings);

module.exports = router;