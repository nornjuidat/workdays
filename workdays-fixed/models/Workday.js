const mongoose = require("mongoose");

const workdaySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    date: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

workdaySchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("Workday", workdaySchema);
