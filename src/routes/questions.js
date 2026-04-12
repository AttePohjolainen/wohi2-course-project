const express = require("express");
const router = express.Router();

const questions = require("../data/questions");

router.get("/", (req, res) => {
  const { keyword } = req.query;

  if (!keyword) {
    return res.json(questions);
  }

  const filtered = questions.filter(q =>
    q.keywords.includes(keyword.toLowerCase())
  );

  res.json(filtered);
});

// GET /questions/:id
router.get("/:id", (req, res) => {
  const id = Number(req.params.id);

  const question = questions.find(q => q.id === id);

  if (!question) {
    return res.status(404).json({ message: "Question not found" });
  }

  res.json(question);
});

// POST /questions
router.post("/", (req, res) => {
  const { question, answer, keywords } = req.body;

  if (!question || !answer) {
    return res.status(400).json({
      message: "question and answer are required"
    });
  }

  const maxId = Math.max(...questions.map(q => q.id), 0);

  const newQuestion = {
    id: questions.length ? maxId + 1 : 1,
    question,
    answer,
    keywords: Array.isArray(keywords) ? keywords : []
  };

  questions.push(newQuestion);

  res.status(201).json(newQuestion);
});

// PUT /questions/:id
router.put("/:id", (req, res) => {
  const id = Number(req.params.id);
  const { question, answer, keywords } = req.body;

  const existing = questions.find(q => q.id === id);

  if (!existing) {
    return res.status(404).json({ message: "Question not found" });
  }

  if (!question || !answer) {
    return res.status(400).json({
      message: "question and answer are required"
    });
  }

  existing.question = question;
  existing.answer = answer;
  existing.keywords = Array.isArray(keywords) ? keywords : [];

  res.json(existing);
});

// DELETE /questions/:id
router.delete("/:id", (req, res) => {
  const id = Number(req.params.id);

  const index = questions.findIndex(q => q.id === id);

  if (index === -1) {
    return res.status(404).json({ message: "Question not found" });
  }

  const deleted = questions.splice(index, 1);

  res.json({
    message: "Deleted successfully",
    question: deleted[0]
  });
});

module.exports = router;

