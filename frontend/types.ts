
// these are the types that match what my backend api returns so the frontend knows what to expect

export type View = 'surveys' | 'feed' | 'profile' | 'builder' | 'responder' | 'analytics';

export type ProfileTab = 'account' | 'security' | 'billing' | 'api';

export type HomeFeedTab = 'featured' | 'trending' | 'quickPolls';

export type SurveyCategory = 'survey' | 'form' | 'poll';

// this matches my main survey database table structure
export type Survey = {
    id: string;
    title: string;
    responses: number;
    status?: 'Published' | 'Draft';
    author?: string;
    category?: SurveyCategory;
};

export type QuestionType = 'shortText' | 'longText' | 'multipleChoice' | 'rating' | 'date' | 'email' | 'phoneNumber' | 'yesNo';

// structure for a single question, likely stored as json within the survey
export interface Question {
    id: string;
    type: QuestionType;
    title: string; // Or "Field Label" for forms
    helpText?: string;
    required: boolean;
    options?: string[]; // For multiple choice questions
}

// used this specifically when I'm creating a brand new survey draft
export interface SurveyDraft {
    id: string;
    category: SurveyCategory;
    title: string;
    description: string;
    questions: Question[];
}

// simplified structure for my notification system
export interface Notification {
    id: string;
    title: string;
    message: string;
    time: string;
    read: boolean;
    type: 'info' | 'success' | 'warning';
}
