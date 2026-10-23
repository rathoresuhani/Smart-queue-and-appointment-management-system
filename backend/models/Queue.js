const mongoose = require("mongoose");

const queueSchema = new mongoose.Schema(
    {
        date: {
            type: Date,
            required: true
        },

        currentToken: {
            type: Number,
            default: 0
        },

        currentAppointment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Appointment",
            default: null
        },

        status: {
            type: String,
            enum: ["ACTIVE", "COMPLETED"],
            default: "ACTIVE"
        }
    },
    {
        timestamps: true
    }
);

const Queue = mongoose.model("Queue", queueSchema);

module.exports = Queue;