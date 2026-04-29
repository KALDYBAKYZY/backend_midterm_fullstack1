const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const Stock = require("../models/Stock");

// GET /api/stocks - All stocks (public)
router.get("/", async (req, res) => {
  try {
    const stocks = await Stock.find().populate("owner", "email");
    res.json(stocks);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/stocks/mine - Current user's stock
router.get("/mine", authMiddleware, async (req, res) => {
  try {
    const stock = await Stock.findOne({ owner: req.user });
    res.json(stock || null);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/stocks/create - Create a stock (one per user)
router.post("/create", authMiddleware, async (req, res) => {
  const { ticker, price } = req.body;

  if (!ticker) {
    return res.status(400).json({ message: "Ticker is required" });
  }

  try {
    // Check if user already has a stock
    const existing = await Stock.findOne({ owner: req.user });
    if (existing) {
      return res
        .status(400)
        .json({ message: "You already have a stock listed" });
    }

    // Check if ticker is taken
    const takenTicker = await Stock.findOne({
      ticker: ticker.toUpperCase(),
    });
    if (takenTicker) {
      return res.status(400).json({ message: "Ticker already taken" });
    }

    const stock = await Stock.create({
      owner: req.user,
      ticker: ticker.toUpperCase(),
      price: price || 100,
    });

    res.status(201).json(stock);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// PUT /api/stocks/:id/price - Update price (owner only)
router.put("/:id/price", authMiddleware, async (req, res) => {
  const { price } = req.body;

  if (!price || price <= 0) {
    return res.status(400).json({ message: "Valid price is required" });
  }

  try {
    const stock = await Stock.findById(req.params.id);
    if (!stock) {
      return res.status(404).json({ message: "Stock not found" });
    }

    // Only the owner can change the price
    if (stock.owner.toString() !== req.user) {
      return res
        .status(403)
        .json({ message: "Forbidden: You do not own this stock" });
    }

    stock.price = price;
    await stock.save();

    // Broadcast is handled in server.js via the broadcast function injected into req
    if (req.broadcast) {
      req.broadcast({
        type: "TICKER_UPDATE",
        payload: { ticker: stock.ticker, price: stock.price, id: stock._id },
      });
    }

    res.json(stock);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
