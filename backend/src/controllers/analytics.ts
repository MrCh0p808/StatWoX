// backend/src/controllers/analytics.ts
import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
const prisma = new PrismaClient();

export const getAnalytics = async (req: Request, res: Response) => {
  try {
    const surveyId = req.params.id;

    // total responses
    const totalResponses = await prisma.surveyResponse.count({ where: { surveyId } });

    // basic per-question aggregation (for multipleChoice)
    const questions = await prisma.question.findMany({
      where: { surveyId },
      include: { options: true }
    });

    // load all responses payloads for simple aggregation (ok for small volumes)
    const responses = await prisma.surveyResponse.findMany({
      where: { surveyId },
      select: { payload: true }
    });

    const questionStats = questions.map(q => {
      if (q.type === "multipleChoice") {
        const counts: Record<string, number> = {};
        q.options.forEach((o: any) => (counts[o.text] = 0));
        responses.forEach(r => {
          const ans = r.payload?.answers?.[q.id];
          if (ans) {
            if (Array.isArray(ans)) {
              ans.forEach((a: string) => counts[a] = (counts[a]||0) + 1);
            } else {
              counts[ans] = (counts[ans] || 0) + 1;
            }
          }
        });
        return { questionId: q.id, type: q.type, stats: counts };
      } else {
        return { questionId: q.id, type: q.type };
      }
    });

    return res.json({ surveyId, totalResponses, questionStats });
  } catch (err: any) {
    console.error("getAnalytics:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
