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
    const { userId, readingHistory, preferences } = await req.json();
    
    if (!userId) {
      throw new Error('User ID is required');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Get user's reading history if not provided
    let userHistory = readingHistory;
    if (!userHistory) {
      const { data: libraryData } = await supabase
        .from('user_library')
        .select(`
          *,
          books (
            title,
            author,
            genre,
            description
          )
        `)
        .eq('user_id', userId)
        .limit(10);

      userHistory = libraryData || [];
    }

    // Get user preferences if not provided
    let userPrefs = preferences;
    if (!userPrefs) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('reading_preferences')
        .eq('user_id', userId)
        .single();

      userPrefs = profileData?.reading_preferences || {};
    }

    // Build context from reading history
    const historyContext = userHistory.map((item: any) => {
      const book = item.books;
      return `- ${book.title} by ${book.author} (Genre: ${book.genre || 'Unknown'}, Status: ${item.status})`;
    }).join('\n');

    // Create recommendation prompt
    const prompt = `Based on the following user's reading history and preferences, recommend 5 books that they would enjoy. For each book, provide:
1. Title
2. Author
3. Genre
4. A brief reason why this book would be a good match

User's Reading History:
${historyContext || 'No reading history yet'}

User Preferences:
${JSON.stringify(userPrefs, null, 2)}

Please provide diverse recommendations across different genres while considering the user's past reading patterns. Format your response as a JSON array with the following structure:
[
  {
    "title": "Book Title",
    "author": "Author Name",
    "genre": "Genre",
    "reason": "Why this book is recommended"
  }
]`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are a knowledgeable librarian and book recommendation expert. Provide thoughtful, personalized book recommendations based on user reading history and preferences.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limits exceeded, please try again later.' }),
          {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required, please add funds to your Lovable AI workspace.' }),
          {
            status: 402,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const recommendationsText = data.choices?.[0]?.message?.content;

    if (!recommendationsText) {
      throw new Error('No recommendations generated');
    }

    // Parse the JSON response from AI
    let recommendations;
    try {
      // Extract JSON from the response (it might be wrapped in markdown code blocks)
      const jsonMatch = recommendationsText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        recommendations = JSON.parse(jsonMatch[0]);
      } else {
        recommendations = JSON.parse(recommendationsText);
      }
    } catch (parseError) {
      console.error('Error parsing AI recommendations:', parseError);
      // Fallback: return raw text
      recommendations = [{
        title: "Personalized Recommendations",
        author: "Various",
        genre: "Mixed",
        reason: recommendationsText
      }];
    }

    return new Response(
      JSON.stringify({ recommendations }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error generating personalized recommendations:', error);
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