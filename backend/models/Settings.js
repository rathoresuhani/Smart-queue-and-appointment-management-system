const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
    {
        openingTime: {
            type: String,
            required: true,
            default: "10:00"
        },

        closingTime: {
            type: String,
            required: true,
            default: "16:00"
        },

        maxAppointmentsPerDay: {
            type: Number,
            required: true,
            default: 50
        }
    },
    {
        timestamps: true
    }
);

const Settings = mongoose.model("Settings", settingsSchema);

module.exports = Settings;