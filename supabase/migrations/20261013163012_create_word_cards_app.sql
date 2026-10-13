/*
# Word Cards App — Schema

1. New Tables
- `decks`: groups of word cards (id, name, description, created_at)
- `word_cards`: individual flash cards (id, deck_id FK, word, definition, phonetic, example, root, phrases, image_url, audio_url, custom_fields JSONB, created_at, updated_at)

2. Relationships
- word_cards.deck_id → decks.id (CASCADE on delete)

3. Security
- Single-tenant app (no auth). RLS enabled on both tables.
- anon + authenticated have full CRUD (data is intentionally shared/public).

4. Notes
- custom_fields stores an array of {label, value} pairs for user-defined fields.
- Index on deck_id for efficient card lookups by deck.
*/

CREATE TABLE IF NOT EXISTS decks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE decks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_decks" ON decks;
CREATE POLICY "anon_select_decks" ON decks FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_decks" ON decks;
CREATE POLICY "anon_insert_decks" ON decks FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_decks" ON decks;
CREATE POLICY "anon_update_decks" ON decks FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_decks" ON decks;
CREATE POLICY "anon_delete_decks" ON decks FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS word_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id uuid NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
  word text NOT NULL,
  definition text DEFAULT '',
  phonetic text DEFAULT '',
  example text DEFAULT '',
  root text DEFAULT '',
  phrases text DEFAULT '',
  image_url text DEFAULT '',
  audio_url text DEFAULT '',
  custom_fields jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE word_cards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_cards" ON word_cards;
CREATE POLICY "anon_select_cards" ON word_cards FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_cards" ON word_cards;
CREATE POLICY "anon_insert_cards" ON word_cards FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_cards" ON word_cards;
CREATE POLICY "anon_update_cards" ON word_cards FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_cards" ON word_cards;
CREATE POLICY "anon_delete_cards" ON word_cards FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_word_cards_deck_id ON word_cards(deck_id);
