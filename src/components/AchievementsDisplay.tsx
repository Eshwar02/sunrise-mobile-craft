import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Award, Trophy, Star } from "lucide-react";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  requirement_type: string;
  requirement_value: number;
}

interface UserAchievement {
  id: string;
  achievement_id: string;
  earned_at: string;
  achievements: Achievement;
}

interface AchievementProgress {
  achievement: Achievement;
  earned: boolean;
  progress: number;
  earnedAt?: string;
}

interface AchievementsDisplayProps {
  userId: string;
}

const AchievementsDisplay = ({ userId }: AchievementsDisplayProps) => {
  const [achievementProgress, setAchievementProgress] = useState<AchievementProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      loadAchievements();
    }
  }, [userId]);

  const loadAchievements = async () => {
    try {
      // Load all achievements
      const { data: allAchievements, error: achievementsError } = await supabase
        .from('achievements')
        .select('*')
        .order('requirement_value');

      if (achievementsError) throw achievementsError;

      // Load user's earned achievements
      const { data: userAchievements, error: userAchievementsError } = await supabase
        .from('user_achievements')
        .select(`
          *,
          achievements (*)
        `)
        .eq('user_id', userId);

      if (userAchievementsError) throw userAchievementsError;

      // Calculate progress for each achievement
      const progress = await Promise.all(
        (allAchievements || []).map(async (achievement) => {
          const earned = userAchievements?.some(
            (ua: any) => ua.achievement_id === achievement.id
          );
          const userAchievement = userAchievements?.find(
            (ua: any) => ua.achievement_id === achievement.id
          );

          let currentValue = 0;

          // Calculate progress based on requirement type
          switch (achievement.requirement_type) {
            case 'books_completed': {
              const { count } = await supabase
                .from('user_library')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId)
                .eq('status', 'completed');
              currentValue = count || 0;
              break;
            }
            case 'current_streak': {
              const { data: profile } = await supabase
                .from('profiles')
                .select('current_streak')
                .eq('user_id', userId)
                .single();
              currentValue = profile?.current_streak || 0;
              break;
            }
            case 'books_in_library': {
              const { count } = await supabase
                .from('user_library')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId);
              currentValue = count || 0;
              break;
            }
            default:
              currentValue = 0;
          }

          const progressPercentage = earned
            ? 100
            : Math.min((currentValue / achievement.requirement_value) * 100, 100);

          return {
            achievement,
            earned,
            progress: progressPercentage,
            earnedAt: userAchievement?.earned_at
          };
        })
      );

      setAchievementProgress(progress);
    } catch (error) {
      console.error('Error loading achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'reading':
        return <Trophy className="w-4 h-4" />;
      case 'streak':
        return <Star className="w-4 h-4" />;
      default:
        return <Award className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  const earnedCount = achievementProgress.filter(a => a.earned).length;
  const totalCount = achievementProgress.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Achievements</h2>
        <Badge variant="secondary" className="text-lg">
          {earnedCount} / {totalCount}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {achievementProgress.map(({ achievement, earned, progress, earnedAt }) => (
          <Card
            key={achievement.id}
            className={`transition-all ${
              earned
                ? 'border-primary bg-primary/5'
                : 'border-muted opacity-70 hover:opacity-100'
            }`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-3xl">{achievement.icon}</span>
                  <div>
                    <CardTitle className="text-lg">{achievement.name}</CardTitle>
                    <Badge variant="outline" className="mt-1">
                      {getCategoryIcon(achievement.category)}
                      <span className="ml-1 capitalize">{achievement.category}</span>
                    </Badge>
                  </div>
                </div>
                {earned && (
                  <Trophy className="w-5 h-5 text-primary" />
                )}
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-3">
                {achievement.description}
              </CardDescription>
              {!earned && (
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}
              {earned && earnedAt && (
                <p className="text-sm text-muted-foreground">
                  Earned on {new Date(earnedAt).toLocaleDateString()}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AchievementsDisplay;