/*
# Storage policy for feedback-photos bucket

## Changes
- Create public storage bucket 'feedback-photos' (if not exists)
- Allow anon + authenticated to upload, read, and delete files in this bucket
*/

INSERT INTO storage.buckets (id, name, public) VALUES ('feedback-photos', 'feedback-photos', true) ON CONFLICT DO NOTHING;

DROP POLICY IF EXISTS "anon_upload_feedback_photos" ON storage.objects;
CREATE POLICY "anon_upload_feedback_photos" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'feedback-photos');

DROP POLICY IF EXISTS "anon_read_feedback_photos" ON storage.objects;
CREATE POLICY "anon_read_feedback_photos" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'feedback-photos');

DROP POLICY IF EXISTS "anon_delete_feedback_photos" ON storage.objects;
CREATE POLICY "anon_delete_feedback_photos" ON storage.objects FOR DELETE TO anon, authenticated USING (bucket_id = 'feedback-photos');
