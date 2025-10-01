-- Add columns for offline reading capabilities
ALTER TABLE user_library 
ADD COLUMN IF NOT EXISTS downloaded_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_read_at TIMESTAMP WITH TIME ZONE;

-- Create index for offline reading queries
CREATE INDEX IF NOT EXISTS idx_user_library_downloaded 
ON user_library(user_id, downloaded_at) 
WHERE downloaded_at IS NOT NULL;

-- Create index for reading progress
CREATE INDEX IF NOT EXISTS idx_user_library_reading_progress 
ON user_library(user_id, status, last_read_at);

-- Add reading session tracking for better statistics
CREATE TABLE IF NOT EXISTS reading_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  book_id UUID NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  pages_read INTEGER DEFAULT 0,
  minutes_spent INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for reading sessions
ALTER TABLE reading_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for reading sessions
CREATE POLICY "Users can view their own reading sessions" 
ON reading_sessions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own reading sessions" 
ON reading_sessions 
FOR ALL 
USING (auth.uid() = user_id);

-- Add offline content storage capability (for future use)
CREATE TABLE IF NOT EXISTS offline_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  book_id UUID NOT NULL,
  content_data JSONB,
  downloaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_accessed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, book_id)
);

-- Enable RLS for offline content
ALTER TABLE offline_content ENABLE ROW LEVEL SECURITY;

-- Create policies for offline content
CREATE POLICY "Users can view their own offline content" 
ON offline_content 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own offline content" 
ON offline_content 
FOR ALL 
USING (auth.uid() = user_id);

-- Create trigger to automatically update last_accessed_at
CREATE OR REPLACE FUNCTION update_last_accessed_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_accessed_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_offline_content_last_accessed
  BEFORE UPDATE ON offline_content
  FOR EACH ROW
  EXECUTE FUNCTION update_last_accessed_at();

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_reading_sessions_user_book 
ON reading_sessions(user_id, book_id, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_offline_content_user_access 
ON offline_content(user_id, last_accessed_at DESC);