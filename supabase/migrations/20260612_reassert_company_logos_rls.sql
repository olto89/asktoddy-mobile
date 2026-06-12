-- Re-assert company-logos storage bucket + RLS, fully idempotent.
--
-- Why: staging's supabase_migrations history is incomplete (20260320/20260326
-- were applied out-of-band via the dashboard), so we can't be certain the
-- live policies exactly match the intended scoped-to-own-folder rules. This
-- migration is safe to run any number of times and brings the policies to a
-- known-good state. Folder scoping = uploads/updates/deletes only within the
-- user's own {uid}/* prefix; SELECT stays public (logos render on shared quotes).

-- 1. Ensure the bucket exists and is public.
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-logos', 'company-logos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Drop every known policy name variant (broad originals + scoped) so we can
--    recreate from scratch without "already exists" errors.
DROP POLICY IF EXISTS "Users can upload company logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update company logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete company logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own company logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own company logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own company logos" ON storage.objects;
DROP POLICY IF EXISTS "Company logos are publicly accessible" ON storage.objects;

-- 3. Recreate the canonical policies.

-- Public read (logos are shown on shared quotes).
CREATE POLICY "Company logos are publicly accessible"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'company-logos');

-- Authenticated users may write only within their own folder ({uid}/*).
CREATE POLICY "Users can upload own company logos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'company-logos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update own company logos"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'company-logos' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'company-logos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own company logos"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'company-logos' AND (storage.foldername(name))[1] = auth.uid()::text);
