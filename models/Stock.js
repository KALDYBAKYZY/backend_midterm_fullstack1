const mongoose = require("mongoose");

const stockSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  ticker: {
    type: String,
    unique: true,
    uppercase: true,
    trim: true,
    required: true,
  },
  price: {
    type: Number,
    default: 100,
  },
  totalShares: {
    type: Number,
    default: 1000,
  },
});

module.exports = mongoose.model("Stock", stockSchema);
