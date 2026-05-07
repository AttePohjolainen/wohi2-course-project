console.log("OIKEA POSTS.JS KÄYTÖSSÄ");

const express = require("express");
const router = express.Router();

const prisma = require("../lib/prisma");
const authenticate = require("../middleware/auth");

const multer = require("multer");
const path = require("path");


router.use(authenticate);

const storage = multer.diskStorage({
  destination: path.join(__dirname, "..", "..", "public", "uploads"),

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);

    cb(
      null,
      `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}${ext}`
    );
  },
});

const upload = multer({
  storage,

  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },

  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

function parseKeywords(keywords) {
  if (Array.isArray(keywords)) {
    return keywords;
  }

  if (typeof keywords === "string") {
    return keywords
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);
  }

  return [];
}

function formatPost(post) {
  return {
    ...post,

    date: post.date.toISOString().split("T")[0],

    keywords: post.keywords.map((k) => k.name),

    userName: post.user?.name || null,

    likeCount: post._count?.likes ?? 0,

    liked: post.likes ? post.likes.length > 0 : false,

    user: undefined,
    likes: undefined,
    _count: undefined,
  };
}

// GET ALL
router.get("/", async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page) || 1);

  const limit = Math.max(
    1,
    Math.min(100, parseInt(req.query.limit) || 5)
  );

  const skip = (page - 1) * limit;
  
  const { keyword } = req.query;

  const where = keyword
    ? { keywords: { some: { name: keyword } } }
    : {};

 const [filteredPosts, total] = await Promise.all([
  prisma.post.findMany({
    where,
    include: {
  keywords: true,
  user: true,

  likes: {
    where: { userId: (req.user.userId || req.user.id) },
    take: 1,
  },

  _count: {
    select: { likes: true },
  },
},
    orderBy: { id: "asc" },
    skip,
    take: limit,
  }),

  prisma.post.count({ where }),
]);

  res.json({
  data: filteredPosts.map(formatPost),

  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit),
});
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
router.post("/", upload.single("image"), async (req, res) => {
  const { title, content, date, keywords } = req.body;
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

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
      imageUrl,
      userId: (req.user.userId || req.user.id),
      keywords: {
  connectOrCreate: parseKeywords(keywords).map((kw) => ({
    where: { name: kw },
    create: { name: kw },
  })),
},

    },
    include: {
  keywords: true,
  user: true,
},
  });

  res.status(201).json(formatPost(newPost));
});

// PUT
router.put("/:id", upload.single("image"), async (req, res) => {
  const id = Number(req.params.id);
  const { title, content, date, keywords } = req.body;

  const existingPost = await prisma.post.findUnique({
    where: { id },
  });

  if (!existingPost) {
    return res.status(404).json({
      message: "Post not found",
    });
  }

  if (!title || !content) {
    return res.status(400).json({
      message: "title and content are required",
    });
  }

  const updatedPost = await prisma.post.update({
    where: { id },
    data: {
      title,
      content,
      date: date ? new Date(date) : existingPost.date,

      ...(req.file
        ? { imageUrl: `/uploads/${req.file.filename}` }
        : {}),

      keywords: {
  set: [],
  connectOrCreate: parseKeywords(keywords).map((kw) => ({
    where: { name: kw },
    create: { name: kw },
  })),
},

    },
    include: {
      keywords: true,
      user: true,
      likes: {
        where: { userId: (req.user.userId || req.user.id) },
        take: 1,
      },
      _count: {
        select: { likes: true },
      },
    },
  });

  res.json(formatPost(updatedPost));
});

// DELETE
router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);

  await prisma.post.delete({
    where: { id },
  });

  res.json({ message: "Deleted successfully" });
});

// LIKE POST
router.post("/:postId/like", async (req, res) => {

  const postId = Number(req.params.postId);

  const post = await prisma.post.findUnique({
    where: { id: postId },
  });

  if (!post) {
    return res.status(404).json({
      message: "Post not found",
    });
  }

  const like = await prisma.like.upsert({
    where: {
      userId_postId: {
        userId: (req.user.userId || req.user.id),
        postId,
      },
    },

    update: {},

    create: {
      userId: (req.user.userId || req.user.id),
      postId,
    },
  });

  const likeCount = await prisma.like.count({
    where: { postId },
  });

  res.status(201).json({
    id: like.id,
    postId,

    liked: true,

    likeCount,

    createdAt: like.createdAt,
  });
});

// UNLIKE POST
router.delete("/:postId/like", async (req, res) => {
  const postId = Number(req.params.postId);

  const post = await prisma.post.findUnique({
    where: { id: postId },
  });

  if (!post) {
    return res.status(404).json({
      message: "Post not found",
    });
  }

  await prisma.like.deleteMany({
    where: {
      userId: (req.user.userId || req.user.id),
      postId,
    },
  });

  const likeCount = await prisma.like.count({
    where: { postId },
  });

  res.json({
    postId,
    liked: false,
    likeCount,
  });
});

// MULTER ERROR HANDLER
router.use((err, req, res, next) => {
  if (
    err instanceof multer.MulterError ||
    err?.message === "Only image files are allowed"
  ) {
    return res.status(400).json({
      msg: err.message,
    });
  }

  next(err);
});

module.exports = router;
