// backend/src/routes/feed.ts
import { Router } from "express";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const router = Router();

router.get("/", async (req, res) => {
  try {
    // 1. Featured: Random or recent published surveys (excluding polls for variety)
    const featured = await prisma.survey.findMany({
      where: { status: "Published", category: "survey" },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        _count: { select: { responses: true } },
        author: { select: { username: true } }
      }
    });

    // 2. Trending: Most responses
    const trending = await prisma.survey.findMany({
      where: { status: "Published" },
      orderBy: { responseCount: "desc" },
      take: 5,
      include: {
        _count: { select: { responses: true } },
        author: { select: { username: true } }
      }
    });

    // 3. Quick Polls: Category = poll
    const quickPolls = await prisma.survey.findMany({
      where: { status: "Published", category: "poll" },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        _count: { select: { responses: true } },
        author: { select: { username: true } }
      }
    });

    const format = (items: any[]) => items.map(item => ({
      id: item.id,
      title: item.title,
      responses: item.responseCount,
      author: item.author?.username ?? "Unknown",
      category: item.category
    }));

    return res.json({
      featured: format(featured),
      trending: format(trending),
      quickPolls: format(quickPolls)
    });
  } catch (err) {
    console.error("feed error", err);
    res.status(500).json({ message: "Server error" });
  }
});


export default router;
