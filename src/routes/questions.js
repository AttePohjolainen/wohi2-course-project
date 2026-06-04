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

function formatQuestion(question) {
  return {
    ...question,

    date: question.date.toISOString().split("T")[0],

    keywords: question.keywords.map((k) => k.name),

    userName: question.user?.name || null,

    solved:
      question.attempts?.some((a) => a.correct) || false,

    user: undefined,
    attempts: undefined,
  };
}

// GET ALL QUESTIONS
// Improvement: questions can now be filtered by difficulty:
// /api/questions?difficulty=easy
router.get("/", async (req, res) => {
  const { difficulty } = req.query;

  const where = difficulty
    ? { difficulty: String(difficulty) }
    : {};

  const questions = await prisma.question.findMany({
    where,
    include: {
      keywords: true,
      user: true,
      attempts: {
        where: {
          userId: req.user.userId || req.user.id,
        },
      },
    },
    orderBy: {
      id: "asc",
    },
  });

  res.json(questions.map(formatQuestion));
});

// RANDOM QUIZ
// Improvement: returns up to 10 random questions from the database
router.get("/quiz/random", async (req, res) => {
  const allQuestions = await prisma.question.findMany({
    include: {
      keywords: true,
      user: true,
      attempts: {
        where: {
          userId: req.user.userId || req.user.id,
        },
      },
    },
  });

  const shuffled = allQuestions.sort(() => 0.5 - Math.random());

  res.json(shuffled.slice(0, 10).map(formatQuestion));
});

// CREATE QUESTION
router.post("/", upload.single("image"), async (req, res) => {
  const { question, answer, date, keywords, difficulty } = req.body;

  const imageUrl = req.file
    ? `/uploads/${req.file.filename}`
    : null;

  const newQuestion = await prisma.question.create({
    data: {
      question,
      answer,
      date: date ? new Date(date) : new Date(),
      imageUrl,
      difficulty: difficulty || "easy",

      userId: req.user.userId || req.user.id,

      keywords: {
        connectOrCreate: parseKeywords(keywords).map(
          (kw) => ({
            where: { name: kw },
            create: { name: kw },
          })
        ),
      },
    },

    include: {
      keywords: true,
      user: true,
      attempts: true,
    },
  });

  res.status(201).json(formatQuestion(newQuestion));
});

// PLAY QUESTION
router.post("/:qId/play", async (req, res) => {
  const qId = Number(req.params.qId);

  const { submittedAnswer } = req.body;

  const question = await prisma.question.findUnique({
    where: { id: qId },
  });

  if (!question) {
    return res.status(404).json({
      message: "Question not found",
    });
  }

  const correct =
    submittedAnswer.trim().toLowerCase() ===
    question.answer.trim().toLowerCase();

  const attempt = await prisma.attempt.create({
    data: {
      submittedAnswer,
      correct,
      correctAnswer: question.answer,

      userId: req.user.userId || req.user.id,

      questionId: qId,
    },
  });

  res.status(201).json({
    id: attempt.id,
    correct: attempt.correct,
    submittedAnswer: attempt.submittedAnswer,
    correctAnswer: attempt.correctAnswer,
  });
});

module.exports = router;