-- =============================================
-- 短信验证码表
-- 用于存储注册时的短信验证码
-- =============================================

CREATE TABLE IF NOT EXISTS public.verify_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    phone TEXT NOT NULL,
    code TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 索引优化
CREATE INDEX IF NOT EXISTS idx_verify_codes_phone ON public.verify_codes(phone);
CREATE INDEX IF NOT EXISTS idx_verify_codes_created_at ON public.verify_codes(created_at DESC);

-- RLS 策略：允许匿名用户操作验证码
ALTER TABLE public.verify_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon insert verify_codes"
    ON public.verify_codes
    FOR INSERT
    TO anon
    WITH CHECK (true);

CREATE POLICY "Allow anon select verify_codes"
    ON public.verify_codes
    FOR SELECT
    TO anon
    USING (true);

CREATE POLICY "Allow anon delete verify_codes"
    ON public.verify_codes
    FOR DELETE
    TO anon
    USING (true);

COMMENT ON TABLE public.verify_codes IS '短信验证码临时存储表';
