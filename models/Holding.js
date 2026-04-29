const mongoose = require("mongoose");

const holdingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  stock: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Stock",
    required: true,
  },
  shares: {
    type: Number,
    default: 0,
  },
});

module.exports = mongoose.model("Holding", holdingSchema);
