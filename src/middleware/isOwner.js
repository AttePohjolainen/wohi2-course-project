const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const isOwner = async (req, res, next) => {
  const postId = parseInt(req.params.id);

  const post = await prisma.post.findUnique({
    where: { id: postId },
  });

  if (!post || post.userId !== req.user.id) {
    return res.status(403).json({ error: "Forbidden" });
  }

  next();
};

module.exports = isOwner;
