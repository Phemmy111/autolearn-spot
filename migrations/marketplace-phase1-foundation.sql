-- Phase 1 Marketplace Data Foundation

CREATE TABLE IF NOT EXISTS public.categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.skills (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    category_id UUID REFERENCES public.categories(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.learning_products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    skill_id UUID REFERENCES public.skills(id) ON DELETE RESTRICT,
    author_id TEXT NOT NULL,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    thumbnail TEXT,
    product_type TEXT NOT NULL DEFAULT 'COURSE' CHECK (product_type IN ('COURSE', 'MASTERCLASS')),
    price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    currency TEXT NOT NULL DEFAULT 'NGN',
    access_duration_days INTEGER DEFAULT 30,
    status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'UNPUBLISHED')),
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

ALTER TABLE public.cohorts ADD COLUMN IF NOT EXISTS learning_product_id UUID REFERENCES public.learning_products(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_skills_category_id ON public.skills(category_id);
CREATE INDEX IF NOT EXISTS idx_skills_slug ON public.skills(slug);
CREATE INDEX IF NOT EXISTS idx_learning_products_skill_id ON public.learning_products(skill_id);
CREATE INDEX IF NOT EXISTS idx_learning_products_author_id ON public.learning_products(author_id);
CREATE INDEX IF NOT EXISTS idx_learning_products_slug ON public.learning_products(slug);
CREATE INDEX IF NOT EXISTS idx_cohorts_learning_product_id ON public.cohorts(learning_product_id);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories are viewable by everyone" ON public.categories FOR SELECT USING (status = 'active');
CREATE POLICY "Categories are manageable by admins" ON public.categories FOR ALL USING (auth.jwt() ->> 'role' = 'super_admin' OR auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Skills are viewable by everyone" ON public.skills FOR SELECT USING (status = 'active');
CREATE POLICY "Skills are manageable by admins" ON public.skills FOR ALL USING (auth.jwt() ->> 'role' = 'super_admin' OR auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Published products are viewable by everyone" ON public.learning_products FOR SELECT USING (status = 'PUBLISHED');
CREATE POLICY "Authors can view all their own products" ON public.learning_products FOR SELECT USING (auth.jwt() ->> 'sub' = author_id);
CREATE POLICY "Authors can update their own products" ON public.learning_products FOR UPDATE USING (auth.jwt() ->> 'sub' = author_id);
CREATE POLICY "Authors can insert their own products" ON public.learning_products FOR INSERT WITH CHECK (auth.jwt() ->> 'sub' = author_id);
CREATE POLICY "Products are manageable by admins" ON public.learning_products FOR ALL USING (auth.jwt() ->> 'role' = 'super_admin' OR auth.jwt() ->> 'role' = 'admin');
