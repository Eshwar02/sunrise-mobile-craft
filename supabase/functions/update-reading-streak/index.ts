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
    const { userId } = await req.json();
    
    if (!userId) {
      throw new Error('User ID is required');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    // Get user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('current_streak, longest_streak, last_read_date')
      .eq('user_id', userId)
      .single();

    if (profileError) throw profileError;

    // Check if user read today
    const { data: todayStats } = await supabase
      .from('reading_statistics')
      .select('pages_read')
      .eq('user_id', userId)
      .eq('date', today)
      .single();

    const readToday = todayStats && todayStats.pages_read > 0;

    if (!readToday) {
      return new Response(
        JSON.stringify({ 
          currentStreak: profile?.current_streak || 0,
          longestStreak: profile?.longest_streak || 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let newStreak = 1;
    let newLongestStreak = profile?.longest_streak || 0;

    // Check if user read yesterday (streak continues)
    if (profile?.last_read_date === yesterday) {
      newStreak = (profile.current_streak || 0) + 1;
    } else if (profile?.last_read_date === today) {
      // Already updated today
      newStreak = profile.current_streak || 1;
    }

    // Update longest streak if current is higher
    if (newStreak > newLongestStreak) {
      newLongestStreak = newStreak;
    }

    // Update profile with new streak
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        current_streak: newStreak,
        longest_streak: newLongestStreak,
        last_read_date: today
      })
      .eq('user_id', userId);

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({ 
        currentStreak: newStreak,
        longestStreak: newLongestStreak,
        updated: true
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error updating streak:', error);
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