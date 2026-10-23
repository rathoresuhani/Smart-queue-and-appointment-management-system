const Appointment = require("../models/Appointment");
const Settings = require("../models/Settings");

const createAppointment = async (req, res) => {
  try {
    const { date, time } = req.body;

    // 1. Check required fields
    if (!date || !time) {
      return res.status(400).json({
        message: "Please provide date and time",
      });
    }

    // 2. Get current admin settings
    let settings = await Settings.findOne();

    if (!settings) {
      settings = await Settings.create({});
    }

    // 3. Check appointment time
    if (time < settings.openingTime || time > settings.closingTime) {
      return res.status(400).json({
        message: `Appointments are allowed between ${settings.openingTime} and ${settings.closingTime}`,
      });
    }

    // 4. Create start and end of selected day
    const selectedDate = new Date(date);

    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    // 5. Count appointments for that day
    const appointmentCount = await Appointment.countDocuments({
      date: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    });

    // 6. Check daily appointment limit
    if (appointmentCount >= settings.maxAppointmentsPerDay) {
      return res.status(400).json({
        message: "Maximum appointments for this day have been reached",
      });
    }

    // 7. Find last token for that day
    const lastAppointment = await Appointment.findOne({
      date: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    }).sort({ tokenNumber: -1 });

    // 8. Generate next token
    const nextToken = lastAppointment ? lastAppointment.tokenNumber + 1 : 1;

    // 9. Create appointment
    const appointment = await Appointment.create({
      user: req.user.userId,
      date: selectedDate,
      time,
      tokenNumber: nextToken,
      status: "WAITING",
    });

    // 10. Send response
    res.status(201).json({
      message: "Appointment created successfully",
      appointment,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create appointment",
      error: error.message,
    });
  }
};
const rejoinQueue = async (req, res) => {
  try {
    const today = new Date();

    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    // Find user's skipped appointment for today
    const skippedAppointment = await Appointment.findOne({
      user: req.user.userId,
      date: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
      status: "SKIPPED",
    }).sort({ createdAt: -1 });
    // Check if user already has an active appointment
    const activeAppointment = await Appointment.findOne({
      user: req.user.userId,
      date: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
      status: {
        $in: ["WAITING", "SERVING"],
      },
    });

    if (activeAppointment) {
      return res.status(400).json({
        message: "You are already in the queue",
      });
    }

    if (!skippedAppointment) {
      return res.status(404).json({
        message: "No skipped appointment found for today",
      });
    }
    // Check daily appointment limit
    let settings = await Settings.findOne();

    if (!settings) {
      settings = await Settings.create({});
    }

    const appointmentCount = await Appointment.countDocuments({
      date: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    });

    if (appointmentCount >= settings.maxAppointmentsPerDay) {
      return res.status(400).json({
        message: "Maximum appointments for today have been reached",
      });
    }

    // Find the latest token for today
    const lastAppointment = await Appointment.findOne({
      date: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    }).sort({ tokenNumber: -1 });

    const nextToken = lastAppointment ? lastAppointment.tokenNumber + 1 : 1;

    // Create a new appointment
    const newAppointment = await Appointment.create({
      user: req.user.userId,
      date: today,
      time: skippedAppointment.time,
      tokenNumber: nextToken,
      status: "WAITING",
    });

    res.status(201).json({
      message: "Successfully rejoined the queue",
      appointment: newAppointment,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to rejoin queue",
      error: error.message,
    });
  }
};
const getMyAppointment = async (req, res) => {
  try {
    const today = new Date();

    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    // Find user's latest appointment for today
    const appointment = await Appointment.findOne({
      user: req.user.userId,
      date: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    }).sort({ createdAt: -1 });

    if (!appointment) {
      return res.status(404).json({
        message: "No appointment found for today",
      });
    }

    // Count waiting appointments before this token
    const peopleAhead = await Appointment.countDocuments({
      date: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
      tokenNumber: {
        $lt: appointment.tokenNumber,
      },
      status: "WAITING",
    });

    res.status(200).json({
      appointment: {
        id: appointment._id,
        tokenNumber: appointment.tokenNumber,
        time: appointment.time,
        status: appointment.status,
        peopleAhead,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to get appointment status",
      error: error.message,
    });
  }
};
const cancelAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;

    // Find appointment belonging to the logged-in user
    const appointment = await Appointment.findOne({
      _id: appointmentId,
      user: req.user.userId,
    });

    if (!appointment) {
      return res.status(404).json({
        message: "Appointment not found",
      });
    }

    // Prevent cancelling completed or skipped appointments
    if (
      appointment.status === "COMPLETED" ||
      appointment.status === "SKIPPED"
    ) {
      return res.status(400).json({
        message: "This appointment cannot be cancelled",
      });
    }

    // Remove the appointment
    await Appointment.deleteOne({
      _id: appointmentId,
    });

    res.status(200).json({
      message: "Appointment cancelled successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to cancel appointment",
      error: error.message,
    });
  }
};
module.exports = {
  createAppointment,
  rejoinQueue,
  getMyAppointment,
  cancelAppointment,
};
