import { Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../middleware/auth.js";

const prisma = new PrismaClient();

// Helper to map DB question to Frontend question
const mapQuestionToFrontend = (q: any) => ({
  id: q.id,
  type: q.type,
  title: q.text,
  helpText: q.helpText,
  required: q.required,
  options: q.options?.map((o: any) => o.text) || [],
});

export const createSurvey = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, category, questions } = req.body;
    const userId = req.userId;

    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const survey = await prisma.survey.create({
      data: {
        title,
        description,
        category: category || "survey",
        authorId: userId,
        questions: {
          create: questions.map((q: any, index: number) => ({
            text: q.title,
            type: q.type,
            helpText: q.helpText,
            required: q.required,
            order: index,
            options: {
              create: q.options?.map((opt: string) => ({ text: opt })) || [],
            },
          })),
        },
      },
      include: {
        questions: {
          include: { options: true },
        },
      },
    });

    res.status(201).json({ id: survey.id });
  } catch (error: any) {
    console.error("createSurvey error:", error);
    res.status(500).json({ message: "Failed to create survey" });
  }
};

export const listSurveys = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const surveys = await prisma.survey.findMany({
      where: { authorId: userId },
      orderBy: { updatedAt: "desc" },
      include: {
        _count: {
          select: { responses: true },
        },
      },
    });

    const formatted = surveys.map((s) => ({
      id: s.id,
      title: s.title,
      responses: s._count.responses,
      status: s.status,
      category: s.category,
      author: "Me", // Since it's my list
    }));

    res.json(formatted);
  } catch (error: any) {
    console.error("listSurveys error:", error);
    res.status(500).json({ message: "Failed to fetch surveys" });
  }
};

export const getSurvey = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const survey = await prisma.survey.findUnique({
      where: { id },
      include: {
        questions: {
          orderBy: { order: "asc" },
          include: { options: true },
        },
      },
    });

    if (!survey) return res.status(404).json({ message: "Survey not found" });

    const formatted = {
      id: survey.id,
      title: survey.title,
      description: survey.description,
      category: survey.category,
      status: survey.status,
      questions: survey.questions.map(mapQuestionToFrontend),
    };

    res.json(formatted);
  } catch (error: any) {
    console.error("getSurvey error:", error);
    res.status(500).json({ message: "Failed to fetch survey" });
  }
};

export const updateSurvey = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, questions } = req.body;
    const userId = req.userId;

    // check if i own this
    const existing = await prisma.survey.findUnique({ where: { id } });
    if (!existing || existing.authorId !== userId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    // update details and swap questions
    // destructive update, but simpler for now
    await prisma.$transaction([
      prisma.questionOption.deleteMany({ where: { question: { surveyId: id } } }),
      prisma.question.deleteMany({ where: { surveyId: id } }),
      prisma.survey.update({
        where: { id },
        data: {
          title,
          description,
          questions: {
            create: questions.map((q: any, index: number) => ({
              text: q.title,
              type: q.type,
              helpText: q.helpText,
              required: q.required,
              order: index,
              options: {
                create: q.options?.map((opt: string) => ({ text: opt })) || [],
              },
            })),
          },
        },
      }),
    ]);

    res.json({ message: "Survey updated" });
  } catch (error: any) {
    console.error("updateSurvey error:", error);
    res.status(500).json({ message: "Failed to update survey" });
  }
};

export const deleteSurvey = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const existing = await prisma.survey.findUnique({ where: { id } });
    if (!existing || existing.authorId !== userId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    await prisma.survey.delete({ where: { id } });
    res.json({ message: "Survey deleted" });
  } catch (error: any) {
    console.error("deleteSurvey error:", error);
    res.status(500).json({ message: "Failed to delete survey" });
  }
};

export const publishSurvey = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const existing = await prisma.survey.findUnique({ where: { id } });
    if (!existing || existing.authorId !== userId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    await prisma.survey.update({
      where: { id },
      data: { status: "Published" },
    });

    res.json({ message: "Survey published" });
  } catch (error: any) {
    console.error("publishSurvey error:", error);
    res.status(500).json({ message: "Failed to publish survey" });
  }
};

export const submitResponse = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const payload = req.body; // The answers

    // 1. Verify survey exists
    const survey = await prisma.survey.findUnique({ where: { id } });
    if (!survey) return res.status(404).json({ message: "Survey not found" });

    // 2. Save response
    await prisma.surveyResponse.create({
      data: {
        surveyId: id,
        payload,
      },
    });

    // 3. Increment count (Atomic)
    await prisma.survey.update({
      where: { id },
      data: { responseCount: { increment: 1 } },
    });

    res.status(201).json({ message: "Response submitted" });
  } catch (error: any) {
    console.error("submitResponse error:", error);
    res.status(500).json({ message: "Failed to submit response" });
  }
};
