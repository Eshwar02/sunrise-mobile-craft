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
    const { query, maxResults = 10 } = await req.json();
    
    if (!query) {
      throw new Error('Search query is required');
    }

    // Use Google Books API (no API key required for basic searches)
    const googleBooksUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=${maxResults}&printType=books`;
    
    const response = await fetch(googleBooksUrl);
    
    if (!response.ok) {
      throw new Error(`Google Books API error: ${response.status}`);
    }

    const data = await response.json();

    // Process and format the results
    const books = data.items?.map((item: any) => {
      const volumeInfo = item.volumeInfo || {};
      const imageLinks = volumeInfo.imageLinks || {};
      
      return {
        googleId: item.id,
        title: volumeInfo.title || 'Unknown Title',
        author: volumeInfo.authors?.join(', ') || 'Unknown Author',
        description: volumeInfo.description || '',
        cover_url: imageLinks.thumbnail?.replace('http:', 'https:') || imageLinks.smallThumbnail?.replace('http:', 'https:') || null,
        page_count: volumeInfo.pageCount || null,
        genre: volumeInfo.categories?.join(', ') || null,
        isbn: volumeInfo.industryIdentifiers?.find((id: any) => 
          id.type === 'ISBN_13' || id.type === 'ISBN_10'
        )?.identifier || null,
        rating: volumeInfo.averageRating || 0,
        language: volumeInfo.language || 'en'
      };
    }) || [];

    return new Response(
      JSON.stringify({ books }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error searching Google Books:', error);
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