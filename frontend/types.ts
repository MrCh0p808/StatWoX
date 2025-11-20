
// BACKEND NOTE: These types define the shape of the data your frontend expects.
// When you build your database, your API responses should match these structures.

export type View = 'surveys' | 'feed' | 'profile' | 'builder' | 'responder' | 'analytics';

export type ProfileTab = 'account' | 'security' | 'billing' | 'api';

export type HomeFeedTab = 'featured' | 'trending' | 'quickPolls';

export type SurveyCategory = 'survey' | 'form' | 'poll';

// This is the main Survey object.
// In your database, this will likely be a 'Surveys' table.
export type Survey = {
    id: string;
    title: string;
    responses: number;
    status?: 'Published' | 'Draft';
    author?: string;
    category?: SurveyCategory;
};

export type QuestionType = 'shortText' | 'longText' | 'multipleChoice' | 'rating' | 'date' | 'email' | 'phoneNumber' | 'yesNo';

// This defines a single question structure.
// You might store this as a JSON blob inside the Survey table, or a separate 'Questions' table.
export interface Question {
    id: string;
    type: QuestionType;
    title: string; // Or "Field Label" for forms
    helpText?: string;
    required: boolean;
    options?: string[]; // For multiple choice questions
}

// This is the object used when creating a NEW survey.
export interface SurveyDraft {
    id: string;
    category: SurveyCategory;
    title: string;
    description: string;
    questions: Question[];
}

// Notification system structure.
export interface Notification {
    id: string;
    title: string;
    message: string;
    time: string;
    read: boolean;
    type: 'info' | 'success' | 'warning';
}
