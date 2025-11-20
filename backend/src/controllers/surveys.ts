// backend/src/controllers/surveys.ts
import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();

/**
 * POST /api/surveys
 * Body: SurveyDraft (see frontend/types.ts)
 */
export const createSurvey = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId || null; // set by auth middleware
    const draft = req.body;

    if (!draft || !draft.title || !Array.isArray(draft.questions)) {
      return res.status(400).json({ message: "Invalid survey draft" });
    }

    // create survey and nested questions/options using prisma
    const survey = await prisma.survey.create({
      data: {
        id: draft.id || uuidv4(),
        title: draft.title,
        description: draft.description ?? "",
        category: draft.category ?? "survey",
        status: draft?.status ?? "Published",
        authorId: userId,
        questions: {
          create: draft.questions.map((q: any, idx: number) => ({
            id: q.id || uuidv4(),
            text: q.title,
            type: q.type,
            helpText: q.helpText ?? null,
            required: !!q.required,
            order: idx,
            options: q.options?.map((o: string) => ({ text: o })) ?? undefined
          }))
        }
      },
      include: { questions: true }
    });

    return res.status(201).json(survey);
  } catch (err: any) {
    console.error("createSurvey:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

/**
 * GET /api/surveys
 * Returns surveys for current user
 */
export const listSurveys = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const surveys = await prisma.survey.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: "desc" },
      include: { questions: true }
    });

    return res.json(surveys);
  } catch (err: any) {
    console.error("listSurveys:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET /api/surveys/:id
 * Returns full survey for responder
 */
export const getSurveyById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const survey = await prisma.survey.findUnique({
      where: { id },
      include: {
        questions: { include: { options: true }, orderBy: { order: "asc" } }
      }
    });

    if (!survey) return res.status(404).json({ message: "Survey not found" });

    // shape to frontend SurveyDraft
    const draft = {
      id: survey.id,
      category: survey.category,
      title: survey.title,
      description: survey.description,
      questions: survey.questions.map((q: any) => ({
        id: q.id,
        type: q.type,
        title: q.text,
        helpText: q.helpText,
        required: q.required,
        options: q.options?.map((o: any) => o.text) ?? []
      }))
    };

    return res.json(draft);
  } catch (err: any) {
    console.error("getSurveyById:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * POST /api/surveys/:id/responses
 * Body: { answers: { questionId: value, ... }, meta?: {...} }
 */
export const submitResponse = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const { answers, meta } = req.body;
    if (!answers || typeof answers !== "object") {
      return res.status(400).json({ message: "Invalid answers payload" });
    }

    // create response entry
    const response = await prisma.surveyResponse.create({
      data: {
        id: uuidv4(),
        surveyId: id,
        payload: { answers, meta: meta ?? {} }
      }
    });

    // increment cached counter on Survey (optional)
    await prisma.survey.update({
      where: { id },
      data: { responses: { increment: 1 } }
    });

    return res.status(201).json({ ok: true, id: response.id });
  } catch (err: any) {
    console.error("submitResponse:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
