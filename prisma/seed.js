const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function main() {
  // Luo käyttäjä
  const hashedPassword = await bcrypt.hash("1234", 10);

  const user = await prisma.user.create({
    data: {
      email: "admin@example.com",
      password: hashedPassword,
      name: "Admin User",
    },
  });

  console.log("Created user:", user.email);

  // Esimerkkipostit
  const posts = [
    {
      title: "First post",
      date: new Date(),
      content: "Hello world",
      keywords: ["test", "hello"],
    },
    {
      title: "Second post",
      date: new Date(),
      content: "Another post",
      keywords: ["example"],
    },
  ];

  // Luo postit käyttäjälle
  for (const post of posts) {
    await prisma.post.create({
      data: {
        title: post.title,
        date: post.date,
        content: post.content,
        userId: user.id,
        keywords: {
          connectOrCreate: post.keywords.map((kw) => ({
            where: { name: kw },
            create: { name: kw },
          })),
        },
      },
    });
  }

  console.log("Seed valmis");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
  