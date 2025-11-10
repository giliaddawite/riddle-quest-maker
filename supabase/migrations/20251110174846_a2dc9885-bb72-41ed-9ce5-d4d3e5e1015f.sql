-- Create profiles table for user data
CREATE TABLE public.profiles (
  id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email text NOT NULL,
  name text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create scenes table
CREATE TABLE public.scenes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  creator_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  background_url text NOT NULL,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.scenes ENABLE ROW LEVEL SECURITY;

-- Scenes policies
CREATE POLICY "Anyone can view scenes"
  ON public.scenes FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own scenes"
  ON public.scenes FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can update their own scenes"
  ON public.scenes FOR UPDATE
  USING (auth.uid() = creator_id);

CREATE POLICY "Users can delete their own scenes"
  ON public.scenes FOR DELETE
  USING (auth.uid() = creator_id);

-- Create storage bucket for scene images
INSERT INTO storage.buckets (id, name, public)
VALUES ('scene-images', 'scene-images', true);

-- Storage policies for scene images
CREATE POLICY "Anyone can view scene images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'scene-images');

CREATE POLICY "Authenticated users can upload scene images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'scene-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own scene images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'scene-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create function to handle new user profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  RETURN new;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();