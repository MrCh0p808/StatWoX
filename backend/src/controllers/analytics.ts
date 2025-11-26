// backend/src/controllers/analytics.ts
import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
const prisma = new PrismaClient();

export const getAnalytics = async (req: Request, res: Response) => {
  try {
    const surveyId = req.params.id;

    // Fetch survey with questions
    const survey = await prisma.survey.findUnique({
      where: { id: surveyId },
      include: { questions: { include: { options: true }, orderBy: { order: 'asc' } } }
    });

    if (!survey) return res.status(404).json({ message: "Survey not found" });

    // Fetch all responses
    const responses = await prisma.surveyResponse.findMany({
      where: { surveyId },
      orderBy: { submittedAt: 'desc' }
    });

    const totalResponses = responses.length;

    // Process questions
    const questions = survey.questions.map(q => {
      const qStats: any = {
        id: q.id,
        type: q.type,
        title: q.text,
        required: q.required,
      };

      if (q.type === 'multipleChoice' || q.type === 'rating' || q.type === 'yesNo') {
        const counts: Record<string, number> = {};
        // Initialize counts for options if available
        q.options.forEach(o => counts[o.text] = 0);

        responses.forEach(r => {
          const ans = (r.payload as any)?.answers?.[q.id];
          if (ans) {
            if (Array.isArray(ans)) {
              ans.forEach((a: string) => counts[a] = (counts[a] || 0) + 1);
            } else {
              counts[ans] = (counts[ans] || 0) + 1;
            }
          }
        });

        qStats.stats = Object.entries(counts).map(([label, count]) => ({
          label,
          count,
          percentage: totalResponses > 0 ? Math.round((count / totalResponses) * 100) : 0
        }));
      } else {
        // Text questions - collect recent answers
        qStats.recentAnswers = responses
          .map(r => (r.payload as any)?.answers?.[q.id])
          .filter(a => a)
          .slice(0, 5);
      }

      return qStats;
    });

    // Format individual responses for the table
    const individualResponses = responses.map((r, i) => {
      const flat: any = {
        id: r.id.slice(0, 8), // Short ID
        date: new Date(r.submittedAt).toLocaleDateString(),
        status: 'Completed', // Mock status
      };
      // Add first few answers for the table columns
      survey.questions.slice(0, 3).forEach((q, idx) => {
        const val = (r.payload as any)?.answers?.[q.id];
        flat[`q${idx + 1}`] = Array.isArray(val) ? val.join(', ') : (val || '-');
      });
      return flat;
    });

    const analyticsData = {
      id: survey.id,
      title: survey.title,
      totalResponses,
      completionRate: 100, // Mock for now
      avgTime: '1m 30s', // Mock for now
      questions,
      individualResponses
    };

    return res.json(analyticsData);
  } catch (err: any) {
    console.error("getAnalytics:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
