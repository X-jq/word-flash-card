export interface CustomField {
  label: string;
  value: string;
}

export interface WordCard {
  id: string;
  deck_id: string;
  word: string;
  definition: string;
  phonetic: string;
  example: string;
  root: string;
  phrases: string;
  image_url: string;
  audio_url: string;
  custom_fields: CustomField[];
  created_at: string;
  updated_at: string;
}

export interface Deck {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

export type WordCardInput = Omit<WordCard, 'id' | 'created_at' | 'updated_at'>;
