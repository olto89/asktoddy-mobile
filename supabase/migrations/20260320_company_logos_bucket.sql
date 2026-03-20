-- Create company-logos storage bucket for user company branding
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-logos', 'company-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload company logos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'company-logos');

-- Allow anyone to view company logos (public bucket)
CREATE POLICY "Company logos are publicly accessible"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'company-logos');

-- Allow authenticated users to update/replace their uploads
CREATE POLICY "Users can update company logos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'company-logos');

-- Allow authenticated users to delete their uploads
CREATE POLICY "Users can delete company logos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'company-logos');
