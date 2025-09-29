import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, LogOut, Sparkles, User, Search, Library, MessageCircle, TrendingUp, Clock, Star } from "lucide-react";

const Home = () => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [userLibrary, setUserLibrary] = useState([]);
  const [readingStats, setReadingStats] = useState(null);
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

      // Get user library with book details
      const { data: libraryData } = await supabase
        .from("user_library")
        .select(`
          *,
          books (
            id,
            title,
            author,
            cover_url,
            genre
          )
        `)
        .eq("user_id", session.user.id)
        .eq("status", "reading")
        .limit(3);
      
      setUserLibrary(libraryData || []);

      // Get reading statistics for today
      const today = new Date().toISOString().split('T')[0];
      const { data: statsData } = await supabase
        .from("reading_statistics")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("date", today)
        .single();
      
      setReadingStats(statsData);
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
          <div className="flex items-center space-x-2">
            <Button variant="ghost" asChild>
              <Link to="/profile">
                <User className="h-4 w-4 mr-2" />
                Profile
              </Link>
            </Button>
            <Button variant="ghost" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold text-foreground">
                Welcome back, {profile?.display_name || user?.email?.split('@')[0]}!
              </h2>
              <p className="text-muted-foreground mt-1">Continue your reading journey</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          </div>

          {/* Daily Quote */}
          <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <Sparkles className="h-8 w-8 text-accent flex-shrink-0 mt-1" />
                <div>
                  <p className="text-lg text-foreground italic mb-2">
                    "{currentQuote}"
                  </p>
                  <p className="text-sm text-muted-foreground">Daily Inspiration</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Reading Stats */}
        {readingStats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="bg-card/80 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{readingStats.minutes_read || 0}</p>
                    <p className="text-sm text-muted-foreground">Minutes Today</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card/80 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-5 w-5 text-accent" />
                  <div>
                    <p className="text-2xl font-bold">{readingStats.pages_read || 0}</p>
                    <p className="text-sm text-muted-foreground">Pages Today</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card/80 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{readingStats.books_completed || 0}</p>
                    <p className="text-sm text-muted-foreground">Books Completed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Continue Reading */}
        {userLibrary.length > 0 && (
          <div className="mb-8">
            <h3 className="text-2xl font-semibold text-foreground mb-4">Continue Reading</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userLibrary.map((item) => (
                <Card key={item.id} className="bg-card/80 backdrop-blur-sm hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex space-x-3">
                      <div className="w-16 h-20 bg-muted rounded flex items-center justify-center flex-shrink-0">
                        {item.books?.cover_url ? (
                          <img 
                            src={item.books.cover_url} 
                            alt={item.books.title}
                            className="w-full h-full object-cover rounded"
                          />
                        ) : (
                          <BookOpen className="h-8 w-8 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm truncate">{item.books?.title}</h4>
                        <p className="text-xs text-muted-foreground truncate">{item.books?.author}</p>
                        <Badge variant="secondary" className="text-xs mt-1">
                          {item.books?.genre || 'Fiction'}
                        </Badge>
                        <div className="mt-2">
                          <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span>Progress</span>
                            <span>{item.progress || 0}%</span>
                          </div>
                          <Progress value={item.progress || 0} className="h-1" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-card/80 backdrop-blur-sm hover:shadow-lg transition-all hover:scale-105 cursor-pointer group">
            <CardContent className="p-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-3 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <Library className="h-6 w-6" />
              </div>
              <h3 className="font-semibold mb-1">My Library</h3>
              <p className="text-sm text-muted-foreground">View your books</p>
            </CardContent>
          </Card>

          <Card className="bg-card/80 backdrop-blur-sm hover:shadow-lg transition-all hover:scale-105 cursor-pointer group">
            <CardContent className="p-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent/10 text-accent mb-3 group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
                <Search className="h-6 w-6" />
              </div>
              <h3 className="font-semibold mb-1">Discover</h3>
              <p className="text-sm text-muted-foreground">Find new books</p>
            </CardContent>
          </Card>

          <Card className="bg-card/80 backdrop-blur-sm hover:shadow-lg transition-all hover:scale-105 cursor-pointer group">
            <CardContent className="p-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-3 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <MessageCircle className="h-6 w-6" />
              </div>
              <h3 className="font-semibold mb-1">AI Chat</h3>
              <p className="text-sm text-muted-foreground">Get recommendations</p>
            </CardContent>
          </Card>

          <Card className="bg-card/80 backdrop-blur-sm hover:shadow-lg transition-all hover:scale-105 cursor-pointer group">
            <CardContent className="p-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent/10 text-accent mb-3 group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
                <TrendingUp className="h-6 w-6" />
              </div>
              <h3 className="font-semibold mb-1">Statistics</h3>
              <p className="text-sm text-muted-foreground">Track progress</p>
            </CardContent>
          </Card>
        </div>

        {/* Featured Books */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-semibold text-foreground">Featured Books</h3>
            <Button variant="ghost" size="sm">
              View All
            </Button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Placeholder books - will be replaced with real data in later phases */}
            {[
              { title: "The Great Gatsby", author: "F. Scott Fitzgerald", rating: 4.5 },
              { title: "To Kill a Mockingbird", author: "Harper Lee", rating: 4.8 },
              { title: "1984", author: "George Orwell", rating: 4.7 },
              { title: "Pride and Prejudice", author: "Jane Austen", rating: 4.6 },
            ].map((book, index) => (
              <Card key={index} className="bg-card/80 backdrop-blur-sm hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="aspect-[3/4] bg-muted rounded mb-3 flex items-center justify-center">
                    <BookOpen className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <h4 className="font-semibold text-sm truncate">{book.title}</h4>
                  <p className="text-xs text-muted-foreground truncate">{book.author}</p>
                  <div className="flex items-center mt-2">
                    <Star className="h-3 w-3 text-yellow-500 fill-current" />
                    <span className="text-xs text-muted-foreground ml-1">{book.rating}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
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