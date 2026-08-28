const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

function makeToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

router.post("/register", async (req, res) => {
  try {
    const username = String(req.body.username || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    if (!username) {
      return res.status(400).json({ message: "יש להזין שם משתמש" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "הסיסמה חייבת להכיל לפחות 6 תווים" });
    }

    const exists = await User.findOne({ username });
    if (exists) {
      return res.status(409).json({ message: "שם המשתמש כבר קיים" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      password: hashedPassword
    });

    res.status(201).json({
      token: makeToken(user),
      username: user.username
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const username = String(req.body.username || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    const user = await User.findOne({ username });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "שם משתמש או סיסמה לא נכונים" });
    }

    res.json({
      token: makeToken(user),
      username: user.username
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
