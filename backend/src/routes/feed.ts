// backend/src/routes/feed.ts
import { Router } from "express";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const router = Router();

router.get("/", async (req, res) => {
  try {
    const items = await prisma.survey.findMany({
    where: { status: "Published" },
    orderBy: { createdAt: "desc" },
    include: {
        _count: { select: { responses: true } },
        author: { select: { username: true } }
    },
    take: 30
    });

    const formatted = items.map(item => ({
    id: item.id,
    title: item.title,
    responses: item._count.responses,
    author: item.author?.username ?? item.authorId,
    category: item.category
    }));

    return res.json({
      featured: formatted.slice(0, 6),
      trending: formatted.slice(6, 12),
      quickPolls: formatted.slice(12, 18)
    });
  } catch (err) {
    console.error("feed error", err);
    res.status(500).json({ message: "Server error" });
  }
});


export default router;
