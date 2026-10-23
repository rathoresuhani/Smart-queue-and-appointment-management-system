const Settings = require("../models/Settings");

// Get current settings
const getSettings = async (req, res) => {
    try {
        let settings = await Settings.findOne();

        // Create default settings if none exist
        if (!settings) {
            settings = await Settings.create({});
        }

        res.status(200).json({
            settings
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to get settings",
            error: error.message
        });
    }
};


// Update settings
const updateSettings = async (req, res) => {
    try {
        const {
            openingTime,
            closingTime,
            maxAppointmentsPerDay
        } = req.body;

        let settings = await Settings.findOne();

        // Create settings if they don't exist
        if (!settings) {
            settings = await Settings.create({});
        }

        // Update only provided values
        if (openingTime) {
            settings.openingTime = openingTime;
        }

        if (closingTime) {
            settings.closingTime = closingTime;
        }

        if (maxAppointmentsPerDay) {
            settings.maxAppointmentsPerDay = maxAppointmentsPerDay;
        }

        await settings.save();

        res.status(200).json({
            message: "Settings updated successfully",
            settings
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to update settings",
            error: error.message
        });
    }
};


module.exports = {
    getSettings,
    updateSettings
};