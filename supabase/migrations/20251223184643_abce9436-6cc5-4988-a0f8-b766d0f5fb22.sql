-- Subscrição de empresa a um plano
CREATE TABLE public.company_subscriptions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
    status TEXT NOT NULL DEFAULT 'active', -- active, cancelled, expired, pending
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Banners/Anúncios globais do admin
CREATE TABLE public.admin_banners (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    image_url TEXT,
    link_url TEXT,
    link_text TEXT,
    target_audience TEXT NOT NULL DEFAULT 'all', -- all, companies, students
    is_active BOOLEAN DEFAULT true,
    starts_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    ends_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Sugestões/Feedback das empresas
CREATE TABLE public.feature_suggestions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    submitted_by UUID REFERENCES auth.users(id),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT DEFAULT 'feature', -- feature, bug, improvement
    status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected, in_progress, completed
    admin_notes TEXT,
    is_public BOOLEAN DEFAULT false, -- visível para votação
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Votos nas sugestões
CREATE TABLE public.suggestion_votes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    suggestion_id UUID NOT NULL REFERENCES public.feature_suggestions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    vote_type TEXT NOT NULL DEFAULT 'up', -- up, down
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(suggestion_id, user_id)
);

-- Enable RLS
ALTER TABLE public.company_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suggestion_votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies para company_subscriptions
CREATE POLICY "Admin can view all subscriptions" ON public.company_subscriptions
    FOR SELECT USING (is_admin());

CREATE POLICY "Admin can manage all subscriptions" ON public.company_subscriptions
    FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Companies can view their own subscription" ON public.company_subscriptions
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM profiles WHERE user_id = auth.uid()
        )
    );

-- RLS Policies para admin_banners
CREATE POLICY "Admin can manage all banners" ON public.admin_banners
    FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Users can view active banners for their audience" ON public.admin_banners
    FOR SELECT USING (
        is_active = true 
        AND (starts_at IS NULL OR starts_at <= now())
        AND (ends_at IS NULL OR ends_at > now())
    );

-- RLS Policies para feature_suggestions
CREATE POLICY "Admin can manage all suggestions" ON public.feature_suggestions
    FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Companies can create suggestions" ON public.feature_suggestions
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT company_id FROM profiles WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Companies can view their own suggestions" ON public.feature_suggestions
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM profiles WHERE user_id = auth.uid()
        )
        OR is_public = true
    );

-- RLS Policies para suggestion_votes
CREATE POLICY "Admin can view all votes" ON public.suggestion_votes
    FOR SELECT USING (is_admin());

CREATE POLICY "Users can vote on public suggestions" ON public.suggestion_votes
    FOR INSERT WITH CHECK (
        suggestion_id IN (
            SELECT id FROM feature_suggestions WHERE is_public = true
        )
        AND user_id = auth.uid()
    );

CREATE POLICY "Users can view votes on public suggestions" ON public.suggestion_votes
    FOR SELECT USING (
        suggestion_id IN (
            SELECT id FROM feature_suggestions WHERE is_public = true
        )
    );

CREATE POLICY "Users can delete their own votes" ON public.suggestion_votes
    FOR DELETE USING (user_id = auth.uid());

-- Triggers para updated_at
CREATE TRIGGER update_company_subscriptions_updated_at
    BEFORE UPDATE ON public.company_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_banners_updated_at
    BEFORE UPDATE ON public.admin_banners
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feature_suggestions_updated_at
    BEFORE UPDATE ON public.feature_suggestions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();