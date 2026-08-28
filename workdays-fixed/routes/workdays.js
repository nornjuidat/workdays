const express = require("express");
const mongoose = require("mongoose");
const Workday = require("../models/Workday");
const User = require("../models/User");
const auth = require("../middleware/auth");

const router = express.Router();
router.use(auth);

router.get("/me", async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("username dailySalary");

    if (!user) {
      return res.status(404).json({ message: "המשתמש לא נמצא" });
    }

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/", async (req, res) => {
  try {
    const year = Number(req.query.year);
    const month = Number(req.query.month);

    if (!year || month < 1 || month > 12) {
      return res.status(400).json({ message: "חודש או שנה לא תקינים" });
    }

    const prefix = `${year}-${String(month).padStart(2, "0")}`;

    const days = await Workday.find({
      user: req.userId,
      date: { $regex: `^${prefix}-` }
    }).sort({ date: 1 });

    res.json(days);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const date = String(req.body.date || "").trim();

    // Nothing is added unless the user explicitly selected a date.
    if (!date) {
      return res.status(400).json({ message: "בחר תאריך לפני הוספת יום" });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ message: "תאריך לא תקין" });
    }

    const exists = await Workday.findOne({ user: req.userId, date });
    if (exists) {
      return res.status(409).json({ message: "היום הזה כבר נוסף" });
    }

    const day = await Workday.create({
      user: req.userId,
      date
    });

    res.status(201).json(day);
  } catch (err) {
    if (err && err.code === 11000) {
      return res.status(409).json({ message: "היום הזה כבר נוסף" });
    }

    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "מזהה לא תקין" });
    }

    const deleted = await Workday.findOneAndDelete({
      _id: req.params.id,
      user: req.userId
    });

    if (!deleted) {
      return res.status(404).json({ message: "יום העבודה לא נמצא" });
    }

    res.json({ message: "נמחק" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/salary", async (req, res) => {
  try {
    const dailySalary = Number(req.body.dailySalary);

    if (!Number.isFinite(dailySalary) || dailySalary < 0) {
      return res.status(400).json({ message: "שכר לא תקין" });
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      { dailySalary },
      { new: true }
    ).select("username dailySalary");

    if (!user) {
      return res.status(404).json({ message: "המשתמש לא נמצא" });
    }

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
