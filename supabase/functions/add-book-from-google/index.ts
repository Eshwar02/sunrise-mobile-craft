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
    const { googleBookData } = await req.json();
    
    if (!googleBookData) {
      throw new Error('Google book data is required');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if book already exists by title and author
    const { data: existingBooks, error: checkError } = await supabase
      .from('books')
      .select('id')
      .eq('title', googleBookData.title)
      .eq('author', googleBookData.author)
      .limit(1);

    if (checkError) {
      throw checkError;
    }

    if (existingBooks && existingBooks.length > 0) {
      return new Response(
        JSON.stringify({ 
          bookId: existingBooks[0].id,
          message: 'Book already exists in database' 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Insert new book into database
    const { data: newBook, error: insertError } = await supabase
      .from('books')
      .insert({
        title: googleBookData.title,
        author: googleBookData.author,
        description: googleBookData.description,
        cover_url: googleBookData.cover_url,
        page_count: googleBookData.page_count,
        genre: googleBookData.genre,
        isbn: googleBookData.isbn,
        rating: googleBookData.rating,
        language: googleBookData.language
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    return new Response(
      JSON.stringify({ 
        bookId: newBook.id,
        message: 'Book successfully added to database' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error adding book from Google Books:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});