-- StatWoX Initial Schema for Supabase PostgreSQL
-- Migration Version: 001

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE survey_category AS ENUM ('survey', 'form', 'poll');
CREATE TYPE survey_status AS ENUM ('draft', 'published', 'closed', 'archived');
CREATE TYPE question_type AS ENUM ('shortText', 'longText', 'multipleChoice', 'rating', 'date', 'email', 'phoneNumber', 'yesNo', 'number', 'file');
CREATE TYPE response_status AS ENUM ('partial', 'completed');
CREATE TYPE notification_type AS ENUM ('info', 'success', 'warning', 'error', 'new_response', 'survey_closed', 'milestone');
CREATE TYPE friendship_status AS ENUM ('pending', 'accepted', 'rejected', 'blocked');

-- ============================================
-- PROFILES TABLE (extends Supabase auth.users)
-- ============================================

CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE,
    email_verified TIMESTAMPTZ,
    username TEXT UNIQUE,
    phone TEXT UNIQUE,
    phone_verified TIMESTAMPTZ,
    name TEXT,
    avatar_url TEXT,
    bio TEXT,
    website TEXT,
    company TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Public profiles are viewable by everyone"
    ON public.profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Trigger to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- SURVEYS TABLE
-- ============================================

CREATE TABLE public.surveys (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category survey_category DEFAULT 'survey',
    status survey_status DEFAULT 'draft',
    
    -- Visibility
    is_public BOOLEAN DEFAULT false,
    allow_anon BOOLEAN DEFAULT true,
    
    -- Settings
    max_responses INTEGER,
    closes_at TIMESTAMPTZ,
    
    -- Stats (denormalized for performance)
    response_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    published_at TIMESTAMPTZ,
    
    -- Relations
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.surveys ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Surveys are viewable by everyone if public"
    ON public.surveys FOR SELECT
    USING (is_public = true OR auth.uid() = author_id);

CREATE POLICY "Users can create surveys"
    ON public.surveys FOR INSERT
    WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update own surveys"
    ON public.surveys FOR UPDATE
    USING (auth.uid() = author_id);

CREATE POLICY "Users can delete own surveys"
    ON public.surveys FOR DELETE
    USING (auth.uid() = author_id);

-- Indexes
CREATE INDEX idx_surveys_author ON public.surveys(author_id);
CREATE INDEX idx_surveys_status_public ON public.surveys(status, is_public);
CREATE INDEX idx_surveys_created ON public.surveys(created_at DESC);

-- ============================================
-- QUESTIONS TABLE
-- ============================================

CREATE TABLE public.questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    survey_id UUID NOT NULL REFERENCES public.surveys(id) ON DELETE CASCADE,
    type question_type DEFAULT 'shortText',
    title TEXT NOT NULL,
    help_text TEXT,
    required BOOLEAN DEFAULT false,
    "order" INTEGER DEFAULT 0,
    
    -- For multiple choice, rating scales, etc. (JSONB)
    options JSONB,
    
    -- Validation rules (JSONB)
    validation JSONB,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- RLS Policies (inherit from surveys)
CREATE POLICY "Questions viewable via survey access"
    ON public.questions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.surveys 
            WHERE surveys.id = questions.survey_id 
            AND (surveys.is_public = true OR surveys.author_id = auth.uid())
        )
    );

CREATE POLICY "Survey authors can manage questions"
    ON public.questions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.surveys 
            WHERE surveys.id = questions.survey_id 
            AND surveys.author_id = auth.uid()
        )
    );

-- Indexes
CREATE INDEX idx_questions_survey ON public.questions(survey_id);
CREATE UNIQUE INDEX idx_questions_survey_order ON public.questions(survey_id, "order");

-- ============================================
-- RESPONSES TABLE
-- ============================================

CREATE TABLE public.responses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    survey_id UUID NOT NULL REFERENCES public.surveys(id) ON DELETE CASCADE,
    respondent_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    
    -- Metadata
    ip_address TEXT,
    user_agent TEXT,
    country TEXT,
    city TEXT,
    
    -- Timing
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    duration INTEGER, -- seconds
    
    -- Status
    status response_status DEFAULT 'partial',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Responses viewable by survey author and respondent"
    ON public.responses FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.surveys 
            WHERE surveys.id = responses.survey_id 
            AND surveys.author_id = auth.uid()
        )
        OR auth.uid() = respondent_id
    );

CREATE POLICY "Anyone can create responses to public surveys"
    ON public.responses FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.surveys 
            WHERE surveys.id = responses.survey_id 
            AND surveys.is_public = true
        )
    );

CREATE POLICY "Respondents can update own responses"
    ON public.responses FOR UPDATE
    USING (auth.uid() = respondent_id);

-- Indexes
CREATE INDEX idx_responses_survey ON public.responses(survey_id);
CREATE INDEX idx_responses_respondent ON public.responses(respondent_id);
CREATE INDEX idx_responses_status ON public.responses(status);

-- ============================================
-- ANSWERS TABLE
-- ============================================

CREATE TABLE public.answers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    response_id UUID NOT NULL REFERENCES public.responses(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    
    -- The actual answer
    value TEXT,
    value_json JSONB, -- For structured answers (multiple choice, etc.)
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Unique constraint
    UNIQUE(response_id, question_id)
);

-- Enable RLS
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;

-- RLS Policies (inherit from responses)
CREATE POLICY "Answers viewable via response access"
    ON public.answers FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.responses r
            JOIN public.surveys s ON s.id = r.survey_id
            WHERE r.id = answers.response_id 
            AND (s.author_id = auth.uid() OR r.respondent_id = auth.uid())
        )
    );

CREATE POLICY "Can create answers for own responses"
    ON public.answers FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.responses 
            WHERE responses.id = answers.response_id 
            AND (responses.respondent_id = auth.uid() OR responses.respondent_id IS NULL)
        )
    );

-- Indexes
CREATE INDEX idx_answers_response ON public.answers(response_id);
CREATE INDEX idx_answers_question ON public.answers(question_id);

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================

CREATE TABLE public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    
    -- Related entity
    entity_type TEXT,
    entity_id UUID,
    
    -- Status
    read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own notifications"
    ON public.notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
    ON public.notifications FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can update own notifications"
    ON public.notifications FOR UPDATE
    USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_notifications_user_read ON public.notifications(user_id, read);
CREATE INDEX idx_notifications_created ON public.notifications(created_at DESC);

-- ============================================
-- FRIENDSHIPS TABLE
-- ============================================

CREATE TABLE public.friendships (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    addressee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status friendship_status DEFAULT 'pending',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(requester_id, addressee_id),
    CHECK (requester_id != addressee_id)
);

-- Enable RLS
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Friendships viewable by participants"
    ON public.friendships FOR SELECT
    USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

CREATE POLICY "Users can create friend requests"
    ON public.friendships FOR INSERT
    WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update own friendships"
    ON public.friendships FOR UPDATE
    USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- Indexes
CREATE INDEX idx_friendships_requester ON public.friendships(requester_id);
CREATE INDEX idx_friendships_addressee ON public.friendships(addressee_id);
CREATE INDEX idx_friendships_status ON public.friendships(status);

-- ============================================
-- MESSAGES TABLE
-- ============================================

CREATE TABLE public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    
    -- Status
    read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Messages viewable by sender and recipient"
    ON public.messages FOR SELECT
    USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can send messages"
    ON public.messages FOR INSERT
    WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Recipients can mark messages read"
    ON public.messages FOR UPDATE
    USING (auth.uid() = recipient_id);

-- Indexes
CREATE INDEX idx_messages_sender ON public.messages(sender_id);
CREATE INDEX idx_messages_recipient ON public.messages(recipient_id);
CREATE INDEX idx_messages_created ON public.messages(created_at DESC);

-- ============================================
-- OTP CODES TABLE
-- ============================================

CREATE TABLE public.otp_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    phone TEXT NOT NULL,
    code TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_otp_phone_code ON public.otp_codes(phone, code);

-- ============================================
-- FUNCTIONS AND TRIGGERS
-- ============================================

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_surveys_updated_at
    BEFORE UPDATE ON public.surveys
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_questions_updated_at
    BEFORE UPDATE ON public.questions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_friendships_updated_at
    BEFORE UPDATE ON public.friendships
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Increment survey response count
CREATE OR REPLACE FUNCTION public.increment_response_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.surveys
    SET response_count = response_count + 1
    WHERE id = NEW.survey_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_response_created
    AFTER INSERT ON public.responses
    FOR EACH ROW EXECUTE FUNCTION public.increment_response_count();

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Grant permissions to anon users (for public surveys)
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON public.surveys TO anon;
GRANT SELECT ON public.questions TO anon;
GRANT INSERT ON public.responses TO anon;
GRANT SELECT ON public.responses TO anon;
GRANT INSERT ON public.answers TO anon;
GRANT SELECT ON public.answers TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- ============================================
-- REALTIME SUBSCRIPTIONS
-- ============================================

-- Enable realtime for relevant tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.surveys;
ALTER PUBLICATION supabase_realtime ADD TABLE public.responses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.friendships;

-- ============================================
-- STORAGE POLICIES
-- ============================================

-- Avatars bucket policies
CREATE POLICY "Anyone can view avatars"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatar"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own avatar"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own avatar"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
