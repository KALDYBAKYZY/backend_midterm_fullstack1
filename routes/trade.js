const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const Stock = require("../models/Stock");
const User = require("../models/User");
const Holding = require("../models/Holding");

router.post("/buy", authMiddleware, async (req, res) => {
  const { stockId, shares } = req.body;

  if (!stockId || !shares || shares <= 0) {
    return res.status(400).json({ message: "stockId and shares are required" });
  }

  try {
    const stock = await Stock.findById(stockId);
    if (!stock) {
      return res.status(404).json({ message: "Stock not found" });
    }

    if (stock.owner.toString() === req.user) {
      return res.status(400).json({ message: "Cannot buy your own stock" });
    }

    const total = stock.price * shares;

    const user = await User.findById(req.user);
    if (user.wallet < total) {
      return res
        .status(400)
        .json({ message: "Insufficient funds", required: total, wallet: user.wallet });
    }

    user.wallet -= total;
    await user.save();

    let holding = await Holding.findOne({ user: req.user, stock: stockId });
    if (holding) {
      holding.shares += shares;
      await holding.save();
    } else {
      holding = await Holding.create({
        user: req.user,
        stock: stockId,
        shares,
      });
    }

    res.json({
      message: "Purchase successful",
      wallet: user.wallet,
      holding: { stockId, shares: holding.shares },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

router.post("/sell", authMiddleware, async (req, res) => {
  const { stockId, shares } = req.body;

  if (!stockId || !shares || shares <= 0) {
    return res.status(400).json({ message: "stockId and shares are required" });
  }

  try {
    const stock = await Stock.findById(stockId);
    if (!stock) {
      return res.status(404).json({ message: "Stock not found" });
    }

    const holding = await Holding.findOne({ user: req.user, stock: stockId });
    if (!holding || holding.shares < shares) {
      return res.status(400).json({ message: "Insufficient shares to sell" });
    }

    const total = stock.price * shares;

    const user = await User.findById(req.user);

    user.wallet += total;
    await user.save();

    holding.shares -= shares;
    await holding.save();

    res.json({
      message: "Sale successful",
      wallet: user.wallet,
      holding: { stockId, shares: holding.shares },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

router.get("/portfolio", authMiddleware, async (req, res) => {
  try {
    const holdings = await Holding.find({ user: req.user })
      .populate("stock")
      .where("shares")
      .gt(0);

    res.json(holdings);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;