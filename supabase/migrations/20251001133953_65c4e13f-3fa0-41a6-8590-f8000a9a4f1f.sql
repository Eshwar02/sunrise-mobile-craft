-- Create achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT NOT NULL,
  requirement_type TEXT NOT NULL,
  requirement_value INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for achievements
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read achievements
CREATE POLICY "Achievements are viewable by everyone" 
ON achievements 
FOR SELECT 
USING (true);

-- Create user achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Enable RLS for user achievements
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Create policies for user achievements
CREATE POLICY "Users can view their own achievements" 
ON user_achievements 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can earn achievements" 
ON user_achievements 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Add reading streak tracking to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_read_date DATE;

-- Create quotes table for inspirational quotes
CREATE TABLE IF NOT EXISTS inspirational_quotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quote TEXT NOT NULL,
  author TEXT NOT NULL,
  category TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for quotes
ALTER TABLE inspirational_quotes ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read active quotes
CREATE POLICY "Active quotes are viewable by everyone" 
ON inspirational_quotes 
FOR SELECT 
USING (is_active = true);

-- Insert default achievements
INSERT INTO achievements (name, description, icon, category, requirement_type, requirement_value) VALUES
  ('First Steps', 'Complete your first book', '📖', 'reading', 'books_completed', 1),
  ('Bookworm', 'Complete 5 books', '🐛', 'reading', 'books_completed', 5),
  ('Scholar', 'Complete 10 books', '🎓', 'reading', 'books_completed', 10),
  ('Library Master', 'Complete 25 books', '👑', 'reading', 'books_completed', 25),
  ('Speed Reader', 'Read 100 pages in one day', '⚡', 'daily', 'pages_read', 100),
  ('Dedicated', 'Maintain a 7-day reading streak', '🔥', 'streak', 'current_streak', 7),
  ('Committed', 'Maintain a 30-day reading streak', '💪', 'streak', 'current_streak', 30),
  ('Marathon', 'Read for 60 minutes in one day', '⏱️', 'daily', 'minutes_read', 60),
  ('Explorer', 'Add 10 books to your library', '🗺️', 'collection', 'books_in_library', 10),
  ('Early Bird', 'Complete a book in the first week of adding it', '🐦', 'speed', 'quick_completion', 1),
  ('Consistent', 'Read every day for a week', '📅', 'habit', 'daily_reading', 7),
  ('Genre Explorer', 'Read books from 5 different genres', '🌈', 'variety', 'genres_read', 5)
ON CONFLICT (name) DO NOTHING;

-- Insert inspirational quotes
INSERT INTO inspirational_quotes (quote, author, category) VALUES
  ('A reader lives a thousand lives before he dies. The man who never reads lives only one.', 'George R.R. Martin', 'reading'),
  ('The more that you read, the more things you will know. The more that you learn, the more places you''ll go.', 'Dr. Seuss', 'learning'),
  ('Reading is to the mind what exercise is to the body.', 'Joseph Addison', 'growth'),
  ('Books are a uniquely portable magic.', 'Stephen King', 'books'),
  ('There is no friend as loyal as a book.', 'Ernest Hemingway', 'friendship'),
  ('Today a reader, tomorrow a leader.', 'Margaret Fuller', 'leadership'),
  ('Reading is essential for those who seek to rise above the ordinary.', 'Jim Rohn', 'aspiration'),
  ('A book is a dream that you hold in your hand.', 'Neil Gaiman', 'imagination'),
  ('One glance at a book and you hear the voice of another person, perhaps someone dead for 1,000 years.', 'Carl Sagan', 'connection'),
  ('Reading is an exercise in empathy; an exercise in walking in someone else''s shoes for a while.', 'Malorie Blackman', 'empathy'),
  ('Books are mirrors: you only see in them what you already have inside you.', 'Carlos Ruiz Zafón', 'reflection'),
  ('The reading of all good books is like a conversation with the finest minds of past centuries.', 'René Descartes', 'wisdom'),
  ('I have always imagined that Paradise will be a kind of library.', 'Jorge Luis Borges', 'paradise'),
  ('Reading is a conversation. All books talk. But a good book listens as well.', 'Mark Haddon', 'dialogue'),
  ('A room without books is like a body without a soul.', 'Marcus Tullius Cicero', 'essence')
ON CONFLICT DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_achievements_user 
ON user_achievements(user_id, earned_at DESC);

CREATE INDEX IF NOT EXISTS idx_achievements_category 
ON achievements(category);

CREATE INDEX IF NOT EXISTS idx_quotes_active 
ON inspirational_quotes(is_active, category);