/**
 * Global Types Dictionary (TQ-001)
 * Locking down interfaces for the Phase 2 expansion. No implicit 'any' allowed here.
 */

// ─── Navigation ───────────────────────────────────────────
export type AppView = 'home' | 'builder' | 'responder' | 'analytics' | 'community' | 'settings' | 'surveys' | 'feed' | 'profile' | 'messages' | 'templates' | 'workspace';
export type View = AppView;
export type NavigationFn = (view: AppView, param?: string | SurveyCategory) => void;

export type SurveyCategory = 'survey' | 'form' | 'poll' | 'quiz';
export type SurveyStatus = 'draft' | 'published' | 'closed';
export type ShareType = 'public' | 'private' | 'community' | 'link';
export type WorkspaceRole = 'owner' | 'editor' | 'viewer';

// ─── User ─────────────────────────────────────────────────
export interface UserProfile {
  id: string;
  email: string;
  username?: string | null;
  name?: string | null;
  image?: string | null;
  bio?: string | null;
  website?: string | null;
  company?: string | null;
  coverImage?: string | null;
  isOnline?: boolean;
  lastSeenAt?: Date | string | null;
  createdAt?: Date | string;
}

export type User = UserProfile;

export interface Notification {
  id: string;
  type: 'system' | 'survey_response' | 'like' | 'comment';
  title: string;
  message: string;
  read: boolean;
  userId: string;
  createdAt: string | Date;
  data?: Record<string, any>;
}

// ─── Skip Logic & Validation ──────────────────────────────
export interface SkipLogicRule {
  condition: 'equals' | 'notEquals' | 'contains' | 'gt' | 'lt' | 'isEmpty' | 'isNotEmpty';
  value: string;
  targetQuestionId: string;
  operator?: 'and' | 'or';
}

export interface ValidationRule {
  type: 'regex' | 'minLength' | 'maxLength' | 'email' | 'phone' | 'url' | 'minWords' | 'maxWords';
  value: string;
  message: string;
}

// ─── Survey ───────────────────────────────────────────────
export interface SurveyFilter {
  authorId?: string;
  status?: SurveyStatus;
  category?: SurveyCategory;
  isPublic?: boolean;
  shareType?: ShareType;
}

export interface SurveyUpdateData {
  title?: string;
  description?: string | null;
  category?: SurveyCategory;
  status?: SurveyStatus;
  isPublic?: boolean;
  shareType?: ShareType;
  allowAnon?: boolean;
  mediaType?: string | null;
  mediaUrl?: string | null;
  caption?: string | null;
  password?: string | null;
  maxResponses?: number | null;
  closesAt?: Date | string | null;
  thankYouMessage?: string | null;
  thankYouLogic?: ThankYouRule[] | null;
  redirectUrl?: string | null;
  showProgress?: boolean;
  showQuestionNumbers?: boolean;
  shuffleQuestions?: boolean;
  conversational?: boolean;
  theme?: SurveyTheme | null;
  locale?: string | null;
  translations?: Record<string, any> | null;
  webhookUrl?: string | null;
  webhookSecret?: string | null;
  ipAllowlist?: string[] | null;
  paymentRequired?: boolean;
}

export interface UserUpdateData {
  name?: string;
  username?: string;
  bio?: string | null;
  website?: string | null;
  company?: string | null;
  image?: string | null;
  coverImage?: string | null;
}

// ─── Question ─────────────────────────────────────────────
export interface Question {
  id: string;
  type: string;
  title: string;
  description?: string;
  required: boolean;
  options?: any;
  order: number;
  page: number;
  min?: number;
  max?: number;
  validation?: Record<string, any>;
  logic?: SkipLogicRule[];
  fileUpload?: boolean;
  fileTypes?: string;
  maxFileSize?: number;
}

export interface Survey {
  id: string;
  title: string;
  description?: string | null;
  category: SurveyCategory;
  status: SurveyStatus;
  isPublic: boolean;
  shareType: ShareType;
  allowAnon: boolean;
  conversational: boolean;
  mediaType?: 'image' | 'video' | null;
  mediaUrl?: string | null;
  caption?: string | null;
  responseCount: number;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
  authorId: string;
  closesAt?: string | null;
  theme?: SurveyTheme | null;
  thankYouMessage?: string | null;
  thankYouLogic?: ThankYouRule[] | null;
  redirectUrl?: string | null;
  showProgress: boolean;
  showQuestionNumbers: boolean;
  shuffleQuestions: boolean;
  locale?: string | null;
  translations?: Record<string, any> | null;
  webhookUrl?: string | null;
  qrCodeUrl?: string | null;
  author?: {
    name?: string | null;
    username?: string | null;
    image?: string | null;
  };
  questions?: Question[];
}

// ─── Questions & Answers ──────────────────────────────────
export interface QuestionInput {
  title: string;
  description?: string;
  type: string;
  options?: any;
  required?: boolean;
  order?: number;
  page?: number;
  placeholder?: string;
  validation?: string;
  min?: number;
  max?: number;
  logic?: SkipLogicRule[];
  fileUpload?: boolean;
  fileTypes?: string;
  maxFileSize?: number;
}

export interface AnswerInput {
  questionId: string;
  value: string;
  fileUrl?: string;
  signatureUrl?: string;
}

// ─── Analytics ────────────────────────────────────────────
export interface AnalyticsResult {
  surveyId: string;
  totalResponses: number;
  completionRate: number;
  averageTime: number | null;
  questionBreakdown: QuestionAnalytics[];
  nps?: NPSResult | null;
  funnel?: FunnelStep[];
}

export interface QuestionAnalytics {
  questionId: string;
  title: string;
  type: string;
  totalAnswers: number;
  answerDistribution: Record<string, number>;
  sentiment?: SentimentResult;
}

export interface NPSResult {
  score: number;
  promoters: number;
  passives: number;
  detractors: number;
  totalResponses: number;
}

export interface FunnelStep {
  page: number;
  started: number;
  completed: number;
  dropOffRate: number;
}

export interface SentimentResult {
  positive: number;
  negative: number;
  neutral: number;
  averageScore: number;
}

export interface CrossTabResult {
  questionA: string;
  questionB: string;
  matrix: Record<string, Record<string, number>>;
}

// ─── Feed / Query ─────────────────────────────────────────
export interface FeedQueryFilter {
  status?: string;
  category?: string;
  isPublic?: boolean;
  authorId?: string;
  title?: { contains: string; mode: 'insensitive' };
}

export type FeedOrderBy = {
  publishedAt?: 'asc' | 'desc';
  responseCount?: 'asc' | 'desc';
  createdAt?: 'asc' | 'desc';
};

// ─── Builder Props ────────────────────────────────────────
export interface BuilderProps {
  initialData?: {
    id: string;
    title: string;
    description?: string;
    questions: QuestionInput[];
    [key: string]: unknown;
  };
  category?: SurveyCategory;
  onNavigate?: NavigationFn;
}

// ─── Survey Settings ──────────────────────────────────────
export interface SurveySettingsData {
  isPublic: boolean;
  shareType: ShareType;
  allowAnon: boolean;
  password: string;
  maxResponses: string;
  closesAt: string;
  thankYouMessage: string;
  redirectUrl: string;
  showProgress: boolean;
  showQuestionNumbers: boolean;
  shuffleQuestions: boolean;
  conversational: boolean;
}

export type SurveySettingValue = string | boolean | number;

// ─── Theming ──────────────────────────────────────────────
export interface SurveyTheme {
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  backgroundImage?: string;
  logoUrl?: string;
  borderRadius?: string;
}

// ─── Conditional Thank You ────────────────────────────────
export interface ThankYouRule {
  condition: 'score_gte' | 'score_lte' | 'answer_equals' | 'always';
  questionId?: string;
  value?: string;
  message: string;
  redirectUrl?: string;
}

// ─── Workspace ────────────────────────────────────────────
export interface WorkspaceData {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  members: WorkspaceMemberData[];
  createdAt: string;
}

export interface WorkspaceMemberData {
  id: string;
  role: WorkspaceRole;
  userId: string;
  user?: UserProfile;
}

// ─── Templates ────────────────────────────────────────────
export interface TemplateData {
  id: string;
  name: string;
  description?: string;
  category: string;
  snapshot: any;
  isPublic: boolean;
  usageCount: number;
  tags: string[];
}

// ─── Audit Log ────────────────────────────────────────────
export interface AuditLogEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  userId: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

// ─── AI ───────────────────────────────────────────────────
export interface AIQuestionGenerateRequest {
  topic: string;
  targetAudience?: string;
  questionCount?: number;
  questionTypes?: string[];
}

export interface AISummaryResult {
  summary: string;
  keyFindings: string[];
  recommendations: string[];
}
