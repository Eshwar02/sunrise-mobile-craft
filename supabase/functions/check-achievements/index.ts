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

    // Get user's current achievements
    const { data: userAchievements } = await supabase
      .from('user_achievements')
      .select('achievement_id')
      .eq('user_id', userId);

    const earnedIds = new Set(userAchievements?.map(ua => ua.achievement_id) || []);

    // Get all achievements
    const { data: allAchievements } = await supabase
      .from('achievements')
      .select('*');

    if (!allAchievements) {
      return new Response(
        JSON.stringify({ newAchievements: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const newlyEarned = [];

    // Check each achievement
    for (const achievement of allAchievements) {
      if (earnedIds.has(achievement.id)) continue;

      let currentValue = 0;
      let shouldEarn = false;

      // Calculate current value based on requirement type
      switch (achievement.requirement_type) {
        case 'books_completed': {
          const { count } = await supabase
            .from('user_library')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('status', 'completed');
          currentValue = count || 0;
          shouldEarn = currentValue >= achievement.requirement_value;
          break;
        }

        case 'current_streak': {
          const { data: profile } = await supabase
            .from('profiles')
            .select('current_streak')
            .eq('user_id', userId)
            .single();
          currentValue = profile?.current_streak || 0;
          shouldEarn = currentValue >= achievement.requirement_value;
          break;
        }

        case 'pages_read': {
          const today = new Date().toISOString().split('T')[0];
          const { data: stats } = await supabase
            .from('reading_statistics')
            .select('pages_read')
            .eq('user_id', userId)
            .eq('date', today)
            .single();
          currentValue = stats?.pages_read || 0;
          shouldEarn = currentValue >= achievement.requirement_value;
          break;
        }

        case 'minutes_read': {
          const today = new Date().toISOString().split('T')[0];
          const { data: stats } = await supabase
            .from('reading_statistics')
            .select('minutes_read')
            .eq('user_id', userId)
            .eq('date', today)
            .single();
          currentValue = stats?.minutes_read || 0;
          shouldEarn = currentValue >= achievement.requirement_value;
          break;
        }

        case 'books_in_library': {
          const { count } = await supabase
            .from('user_library')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);
          currentValue = count || 0;
          shouldEarn = currentValue >= achievement.requirement_value;
          break;
        }
      }

      // Award achievement if earned
      if (shouldEarn) {
        const { error } = await supabase
          .from('user_achievements')
          .insert({
            user_id: userId,
            achievement_id: achievement.id
          });

        if (!error) {
          newlyEarned.push(achievement);
        }
      }
    }

    return new Response(
      JSON.stringify({ newAchievements: newlyEarned }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error checking achievements:', error);
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