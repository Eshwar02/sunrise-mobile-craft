import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, LogOut, Sparkles } from "lucide-react";

const Home = () => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Inspirational quotes for the serene reading experience
  const quotes = [
    "A reader lives a thousand lives before he dies. The man who never reads lives only one.",
    "The more that you read, the more things you will know. The more that you learn, the more places you'll go.",
    "Reading is to the mind what exercise is to the body.",
    "Books are a uniquely portable magic.",
    "There is no friend as loyal as a book."
  ];

  const [currentQuote] = useState(quotes[Math.floor(Math.random() * quotes.length)]);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/login");
        return;
      }

      setUser(session.user);
      
      // Get user profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", session.user.id)
        .single();
      
      setProfile(profileData);
      setLoading(false);
    };

    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/login");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Signed out successfully",
        description: "See you next time!",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading your library...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Papyrus</h1>
          </div>
          <Button variant="ghost" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <Sparkles className="h-12 w-12 text-accent" />
          </div>
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Welcome back, {profile?.display_name || user?.email}!
          </h2>
          <Card className="max-w-2xl mx-auto p-6 bg-card/50 backdrop-blur-sm">
            <p className="text-lg text-muted-foreground italic">
              "{currentQuote}"
            </p>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer bg-card/80 backdrop-blur-sm">
            <div className="text-center">
              <BookOpen className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">My Library</h3>
              <p className="text-muted-foreground">Access your personal collection</p>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer bg-card/80 backdrop-blur-sm">
            <div className="text-center">
              <BookOpen className="h-12 w-12 text-accent mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Discover Books</h3>
              <p className="text-muted-foreground">Find your next great read</p>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer bg-card/80 backdrop-blur-sm">
            <div className="text-center">
              <Sparkles className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">AI Assistant</h3>
              <p className="text-muted-foreground">Get personalized recommendations</p>
            </div>
          </Card>
        </div>

        {/* Coming Soon Section */}
        <div className="mt-16 text-center">
          <h3 className="text-2xl font-semibold text-foreground mb-4">Phase 1 Complete!</h3>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Your Papyrus foundation is ready. The database is set up with user profiles, books, library management, 
            bookmarks, and reading statistics. Authentication is working, and the serene design system is in place. 
            Ready for Phase 2: Enhanced Authentication & Profiles!
          </p>
        </div>
      </main>
    </div>
  );
};

export default Home;