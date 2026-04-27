const express = require("express");
const app = express();
const postsRouter = require("./routes/posts");
const prisma = require("./lib/prisma");
const authRouter = require("./routes/auth");

const PORT = process.env.PORT || 3000;

app.use(express.json());

// ROUTES
app.use("/api/posts", postsRouter);
app.use("/api/auth", authRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ msg: "Not found" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
