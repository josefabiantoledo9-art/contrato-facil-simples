
-- Drop existing policies on contratos and recreate with authenticated role
DROP POLICY IF EXISTS "Users can view their own contracts" ON public.contratos;
DROP POLICY IF EXISTS "Users can create their own contracts" ON public.contratos;
DROP POLICY IF EXISTS "Users can update their own contracts" ON public.contratos;
DROP POLICY IF EXISTS "Users can delete their own contracts" ON public.contratos;

CREATE POLICY "Users can view their own contracts" ON public.contratos FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own contracts" ON public.contratos FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own contracts" ON public.contratos FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own contracts" ON public.contratos FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Drop existing policies on profiles and recreate with authenticated role
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
