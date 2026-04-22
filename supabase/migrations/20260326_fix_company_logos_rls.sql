-- Fix company-logos RLS: scope write policies to user's own folder ({userId}/*)
-- The SELECT policy stays public (logos are viewable on shared quotes).

-- Drop old broad policies
DROP POLICY IF EXISTS "Users can upload company logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update company logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete company logos" ON storage.objects;

-- Scoped policies: users can only manage files in their own folder
CREATE POLICY "Users can upload own company logos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'company-logos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update own company logos"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'company-logos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own company logos"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'company-logos' AND (storage.foldername(name))[1] = auth.uid()::text);
