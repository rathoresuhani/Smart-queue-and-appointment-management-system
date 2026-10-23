const Appointment = require("../models/Appointment");
const Queue = require("../models/Queue");

// Get today's queue
const getQueue = async (req, res) => {
  try {
    const today = new Date();

    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const appointments = await Appointment.find({
      date: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    })
      .sort({ tokenNumber: 1 })
      .populate("user", "name email");

    res.status(200).json({
      appointments,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to get queue",
      error: error.message,
    });
  }
};

// Call next waiting appointment
const callNext = async (req, res) => {
  try {
    // Check if an appointment is already being served
    const currentServing = await Appointment.findOne({
      status: "SERVING",
    });

    if (currentServing) {
      return res.status(400).json({
        message: `Token ${currentServing.tokenNumber} is already being served`,
      });
    }
    const today = new Date();

    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    // Find next waiting appointment
    const nextAppointment = await Appointment.findOne({
      date: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
      status: "WAITING",
    }).sort({ tokenNumber: 1 });

    if (!nextAppointment) {
      return res.status(404).json({
        message: "No waiting appointments",
      });
    }

    // Mark appointment as serving
    nextAppointment.status = "SERVING";
    await nextAppointment.save();

    // Update today's queue
    let queue = await Queue.findOne({
      date: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    });

    if (!queue) {
      queue = await Queue.create({
        date: startOfDay,
        currentToken: nextAppointment.tokenNumber,
        currentAppointment: nextAppointment._id,
        status: "ACTIVE",
      });
    } else {
      queue.currentToken = nextAppointment.tokenNumber;
      queue.currentAppointment = nextAppointment._id;
      queue.status = "ACTIVE";

      await queue.save();
    }

    res.status(200).json({
      message: "Next appointment called",
      appointment: nextAppointment,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to call next appointment",
      error: error.message,
    });
  }
};
const completeAppointment = async (req, res) => {
  try {
    const today = new Date();

    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    // Find the appointment currently being served
    const appointment = await Appointment.findOne({
      date: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
      status: "SERVING",
    });

    if (!appointment) {
      return res.status(404).json({
        message: "No appointment is currently being served",
      });
    }

    // Mark appointment as completed
    appointment.status = "COMPLETED";
    await appointment.save();

    // Update today's queue
    const queue = await Queue.findOne({
      date: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    });

    if (queue) {
      queue.currentAppointment = null;
      await queue.save();
    }

    res.status(200).json({
      message: "Appointment completed successfully",
      appointment,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to complete appointment",
      error: error.message,
    });
  }
};
const skipAppointment = async (req, res) => {
  try {
    const today = new Date();

    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    // Find the appointment currently being served
    const appointment = await Appointment.findOne({
      date: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
      status: "SERVING",
    });

    if (!appointment) {
      return res.status(404).json({
        message: "No appointment is currently being served",
      });
    }

    // Mark appointment as skipped
    appointment.status = "SKIPPED";
    await appointment.save();

    // Update today's queue
    const queue = await Queue.findOne({
      date: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    });

    if (queue) {
      queue.currentAppointment = null;
      await queue.save();
    }

    res.status(200).json({
      message: "Appointment skipped successfully",
      appointment,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to skip appointment",
      error: error.message,
    });
  }
};
const getDashboard = async (req, res) => {
  try {
    const today = new Date();

    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    // Get today's queue
    const queue = await Queue.findOne({
      date: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    });

    // Get all today's appointments
    const appointments = await Appointment.find({
      date: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    })
      .sort({ tokenNumber: 1 })
      .populate("user", "name email");

    // Calculate statistics
    const totalAppointments = appointments.length;

    const waitingCount = appointments.filter(
      (appointment) => appointment.status === "WAITING",
    ).length;

    const skippedCount = appointments.filter(
      (appointment) => appointment.status === "SKIPPED",
    ).length;

    const completedCount = appointments.filter(
      (appointment) => appointment.status === "COMPLETED",
    ).length;

    const servingAppointment = appointments.find(
      (appointment) => appointment.status === "SERVING",
    );

    res.status(200).json({
      currentToken: queue ? queue.currentToken : null,

      currentAppointment: servingAppointment || null,

      totalAppointments,

      waitingCount,

      skippedCount,

      completedCount,

      appointments,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to get dashboard data",
      error: error.message,
    });
  }
};
module.exports = {
  getQueue,
  callNext,
  completeAppointment,
  skipAppointment,
  getDashboard,
};
