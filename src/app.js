const express = require("express");
const path = require("path");

const postsRouter = require("./routes/posts");
const questionsRouter = require("./routes/questions");
const authRouter = require("./routes/auth");
const leaderboardRouter = require("./routes/leaderboard");

const errorHandler = require("./middleware/errorHandler");

const pinoHttp = require("pino-http");
const logger = require("./lib/logger");

const app = express();

app.use(express.json());

app.use(
  pinoHttp({
    logger,
  })
);

app.use(express.static(path.join(__dirname, "..", "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

// ROUTES
app.use("/api/posts", postsRouter);
app.use("/api/questions", questionsRouter);
app.use("/api/auth", authRouter);
app.use("/api/leaderboard", leaderboardRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ msg: "Not found" });
});

app.use(errorHandler);

module.exports = app;
