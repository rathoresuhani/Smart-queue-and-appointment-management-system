const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        date: {
            type: Date,
            required: true
        },

        time: {
            type: String,
            required: true
        },

        tokenNumber: {
            type: Number,
            required: true
        },

        status: {
            type: String,
            enum: ["WAITING", "SERVING", "COMPLETED", "SKIPPED"],
            default: "WAITING"
        }
    },
    {
        timestamps: true
    }
);

const Appointment = mongoose.model("Appointment", appointmentSchema);

module.exports = Appointment;