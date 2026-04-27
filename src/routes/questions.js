const express = require("express");
const router = express.Router();
router.use(authenticate);
const prisma = require("../lib/prisma");
const authenticate = require("../middleware/auth");

function formatPost(post) {
  return {
    ...post,
    date: post.date.toISOString().split("T")[0],
    keywords: post.keywords.map((k) => k.name),
  };
}

// GET ALL
router.get("/", async (req, res) => {
  const { keyword } = req.query;

  const where = keyword
    ? { keywords: { some: { name: keyword } } }
    : {};

  const posts = await prisma.post.findMany({
    where,
    include: { keywords: true },
    orderBy: { id: "asc" },
  });

  res.json(posts.map(formatPost));
});

// GET ONE
router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);

  const post = await prisma.post.findUnique({
    where: { id },
    include: { keywords: true },
  });

  if (!post) {
    return res.status(404).json({ message: "Not found" });
  }

  res.json(formatPost(post));
});

// POST
router.post("/", async (req, res) => {
  const { title, content, date, keywords } = req.body;

  if (!title || !content) {
    return res.status(400).json({
      message: "title and content are required",
    });
  }

  const newPost = await prisma.post.create({
    data: {
      title,
      content,
      date: date ? new Date(date) : new Date(),
      keywords: {
        connectOrCreate: (keywords || []).map((kw) => ({
          where: { name: kw },
          create: { name: kw },
        })),
      },
    },
    include: { keywords: true },
  });

  res.status(201).json(formatPost(newPost));
});

// DELETE
router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);

  await prisma.post.delete({
    where: { id },
  });

  res.json({ message: "Deleted successfully" });
});

module.exports = router;
