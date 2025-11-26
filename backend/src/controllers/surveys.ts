// backend/src/controllers/surveys.ts
import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();

/**
 * POST /api/surveys
 * This is where I create a new survey.
 * It expects a JSON body with the survey title, questions, etc.
 */
export const createSurvey = async (req: Request, res: Response) => {
  try {
    // Getting the user ID from the token (set by my auth middleware)
    const userId = (req as any).userId || null;
    const draft = req.body;

    // Basic validation to make sure I'm not saving junk data
    if (!draft || !draft.title || !Array.isArray(draft.questions)) {
      return res.status(400).json({ message: "Invalid survey draft" });
    }

    // Creating the survey and all its questions in one go using Prisma's nested writes.
    // This is super cool because it ensures everything is saved or nothing is.
    const survey = await prisma.survey.create({
      data: {
        id: draft.id || uuidv4(),
        title: draft.title,
        description: draft.description ?? "",
        category: draft.category ?? "survey",
        status: draft?.status ?? "Draft",
        authorId: userId,
        questions: {
          create: draft.questions.map((q: any, idx: number) => ({
            id: q.id || uuidv4(),
            text: q.title,
            type: q.type,
            helpText: q.helpText ?? null,
            required: !!q.required,
            order: idx,
            // If the question has options (like multiple choice), I map them here too
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
 * This lists all the surveys created by the currently logged-in user.
 */
export const listSurveys = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    // Fetching surveys from the DB, ordered by newest first
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
 * This fetches a single survey so someone can take it (Responder view).
 */
export const getSurveyById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    // I need to include questions and their options so the frontend can render the form
    const survey = await prisma.survey.findUnique({
      where: { id },
      include: {
        questions: { include: { options: true }, orderBy: { order: "asc" } }
      }
    });

    if (!survey) return res.status(404).json({ message: "Survey not found" });

    // Transforming the DB data into the shape my frontend expects (SurveyDraft interface)
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
 * This saves the answers when someone submits a survey.
 */
export const submitResponse = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const { answers, meta } = req.body;

    if (!answers || typeof answers !== "object") {
      return res.status(400).json({ message: "Invalid answers payload" });
    }

    // Saving the response as a JSON blob for flexibility
    const response = await prisma.surveyResponse.create({
      data: {
        id: uuidv4(),
        surveyId: id,
        payload: { answers, meta: meta ?? {} }
      }
    });

    // Incrementing the response counter on the survey itself
    // This makes it fast to show "10 responses" on the dashboard without counting rows every time
    await prisma.survey.update({
      where: { id },
      data: { responseCount: { increment: 1 } }
    });

    return res.status(201).json({ ok: true, id: response.id });
  } catch (err: any) {
    console.error("submitResponse:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
