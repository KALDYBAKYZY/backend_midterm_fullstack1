const express = require("express");
const http = require("http");
const cors = require("cors");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const { WebSocketServer } = require("ws");
const connectDB = require("./config/db");

dotenv.config();
connectDB();
const app = express();

app.use(cors({
  origin: "https://frontend-midterm-fullstack1.vercel.app",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
}));

app.options("*", cors({
  origin: "https://frontend-midterm-fullstack1.vercel.app",
  credentials: true,
}));

app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const broadcast = (data) => {
  const message = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(message);
    }
  });
};

app.use((req, res, next) => {
  req.broadcast = broadcast;
  next();
});

wss.on("connection", (ws, req) => {
  const token = req.headers["sec-websocket-protocol"];
  if (!token) {
    ws.close(1008, "No token");
    return;
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    ws.userId = decoded.id;
    console.log(`WS connected: user ${ws.userId}`);
  } catch (err) {
    ws.close(1008, "Invalid token");
    return;
  }

  ws.on("close", () => console.log(`WS disconnected: user ${ws.userId}`));
  ws.on("error", (err) => console.error("WS error:", err.message));

  ws.send(JSON.stringify({ type: "CONNECTED", message: "WebSocket connected" }));
});

app.use("/api/auth", require("./routes/auth"));
app.use("/api/stocks", require("./routes/stocks"));
app.use("/api/trade", require("./routes/trade"));

app.get("/", (req, res) => res.json({ status: "PEX API running" }));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket ready`);
});