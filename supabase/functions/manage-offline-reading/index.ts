import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { bookId, userId, action, data } = await req.json();
    
    if (!bookId || !userId) {
      throw new Error('Book ID and User ID are required');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let result;

    switch (action) {
      case 'download':
        // In a real app, this would handle downloading book content for offline reading
        // For now, we'll simulate marking a book as downloaded
        const { data: libraryItem, error: libraryError } = await supabase
          .from('user_library')
          .update({ 
            status: 'downloaded',
            downloaded_at: new Date().toISOString() 
          })
          .eq('user_id', userId)
          .eq('book_id', bookId)
          .select()
          .single();

        if (libraryError) throw libraryError;

        result = { 
          success: true, 
          message: 'Book downloaded for offline reading',
          libraryItem 
        };
        break;

      case 'sync_progress':
        // Sync reading progress when coming back online
        const { currentPage, progress, readingTime } = data;
        
        const { error: syncError } = await supabase
          .from('user_library')
          .update({
            current_page: currentPage,
            progress: progress,
            last_read_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .eq('book_id', bookId);

        if (syncError) throw syncError;

        // Update reading statistics
        const today = new Date().toISOString().split('T')[0];
        
        const { data: existingStats } = await supabase
          .from('reading_statistics')
          .select('*')
          .eq('user_id', userId)
          .eq('date', today)
          .single();

        if (existingStats) {
          await supabase
            .from('reading_statistics')
            .update({
              pages_read: (existingStats.pages_read || 0) + (data.pagesRead || 0),
              minutes_read: (existingStats.minutes_read || 0) + (readingTime || 0)
            })
            .eq('id', existingStats.id);
        } else {
          await supabase
            .from('reading_statistics')
            .insert({
              user_id: userId,
              date: today,
              pages_read: data.pagesRead || 0,
              minutes_read: readingTime || 0
            });
        }

        result = { 
          success: true, 
          message: 'Reading progress synced successfully' 
        };
        break;

      case 'get_offline_data':
        // Get all necessary data for offline reading
        const { data: bookData, error: bookError } = await supabase
          .from('books')
          .select('*')
          .eq('id', bookId)
          .single();

        if (bookError) throw bookError;

        const { data: bookmarks, error: bookmarksError } = await supabase
          .from('bookmarks')
          .select('*')
          .eq('user_id', userId)
          .eq('book_id', bookId)
          .order('page_number');

        if (bookmarksError) throw bookmarksError;

        const { data: library, error: libraryErr } = await supabase
          .from('user_library')
          .select('*')
          .eq('user_id', userId)
          .eq('book_id', bookId)
          .single();

        if (libraryErr) throw libraryErr;

        result = {
          success: true,
          data: {
            book: bookData,
            bookmarks: bookmarks || [],
            libraryItem: library,
            downloadedAt: new Date().toISOString()
          }
        };
        break;

      default:
        throw new Error('Invalid action specified');
    }

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in offline reading management:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});