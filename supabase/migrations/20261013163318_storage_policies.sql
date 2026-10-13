/*
# Storage bucket policies for card images and audio

1. Security
- Both buckets are public (created as public buckets).
- Allow anon + authenticated to upload, read, and delete files.
- These are intentionally shared/public for the single-tenant app.
*/

-- card-images bucket policies
DROP POLICY IF EXISTS "anon_read_card_images" ON storage.objects;
CREATE POLICY "anon_read_card_images" ON storage.objects FOR SELECT
  TO anon, authenticated USING (bucket_id = 'card-images');

DROP POLICY IF EXISTS "anon_insert_card_images" ON storage.objects;
CREATE POLICY "anon_insert_card_images" ON storage.objects FOR INSERT
  TO anon, authenticated WITH CHECK (bucket_id = 'card-images');

DROP POLICY IF EXISTS "anon_delete_card_images" ON storage.objects;
CREATE POLICY "anon_delete_card_images" ON storage.objects FOR DELETE
  TO anon, authenticated USING (bucket_id = 'card-images');

-- card-audio bucket policies
DROP POLICY IF EXISTS "anon_read_card_audio" ON storage.objects;
CREATE POLICY "anon_read_card_audio" ON storage.objects FOR SELECT
  TO anon, authenticated USING (bucket_id = 'card-audio');

DROP POLICY IF EXISTS "anon_insert_card_audio" ON storage.objects;
CREATE POLICY "anon_insert_card_audio" ON storage.objects FOR INSERT
  TO anon, authenticated WITH CHECK (bucket_id = 'card-audio');

DROP POLICY IF EXISTS "anon_delete_card_audio" ON storage.objects;
CREATE POLICY "anon_delete_card_audio" ON storage.objects FOR DELETE
  TO anon, authenticated USING (bucket_id = 'card-audio');
