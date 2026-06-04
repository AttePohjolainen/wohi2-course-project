const express = require("express");
const router = express.Router();

const prisma = require("../lib/prisma");
const authenticate = require("../middleware/auth");

router.use(authenticate);

// LEADERBOARD
// Improvement: returns top 5 users with most correct attempts
router.get("/", async (req, res) => {
  const correctAttempts = await prisma.attempt.groupBy({
    by: ["userId"],
    where: {
      correct: true,
    },
    _count: {
      id: true,
    },
    orderBy: {
      _count: {
        id: "desc",
      },
    },
    take: 5,
  });

  const leaderboard = await Promise.all(
    correctAttempts.map(async (entry) => {
      const user = await prisma.user.findUnique({
        where: {
          id: entry.userId,
        },
        select: {
          id: true,
          name: true,
          email: true,
        },
      });

      return {
        userId: entry.userId,
        name: user?.name || "Unknown user",
        email: user?.email || null,
        correctAnswers: entry._count.id,
      };
    })
  );

  res.json(leaderboard);
});

module.exports = router;