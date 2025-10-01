import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { BookOpen, Sparkles } from "lucide-react";

interface Quote {
  quote: string;
  author: string;
}

const Index = () => {
  const navigate = useNavigate();
  const [currentQuote, setCurrentQuote] = useState<Quote>({
    quote: "A reader lives a thousand lives before he dies.",
    author: "George R.R. Martin"
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSession();
    loadRandomQuote();
    
    // Rotate quotes every 5 seconds
    const quoteInterval = setInterval(() => {
      loadRandomQuote();
    }, 5000);

    return () => clearInterval(quoteInterval);
  }, []);

  const checkSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      // User is already logged in, redirect to home
      setTimeout(() => navigate("/home"), 2000);
    } else {
      // Not logged in, redirect to login after showing splash
      setTimeout(() => navigate("/login"), 3000);
    }
    
    setLoading(false);
  };

  const loadRandomQuote = async () => {
    try {
      const { data, error } = await supabase
        .from('inspirational_quotes')
        .select('quote, author')
        .eq('is_active', true);

      if (error) throw error;

      if (data && data.length > 0) {
        const randomQuote = data[Math.floor(Math.random() * data.length)];
        setCurrentQuote(randomQuote);
      }
    } catch (error) {
      console.error('Error loading quote:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-background to-accent/20 flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center space-y-8 animate-fade-in">
        {/* Logo and Title */}
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="relative">
              <BookOpen className="w-24 h-24 text-primary animate-pulse" />
              <Sparkles className="w-8 h-8 text-accent absolute -top-2 -right-2 animate-bounce" />
            </div>
          </div>
          <h1 className="text-6xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Papyrus
          </h1>
          <p className="text-xl text-muted-foreground">
            Your Serene Digital Library
          </p>
        </div>

        {/* Inspirational Quote */}
        <div className="bg-card/50 backdrop-blur-sm rounded-lg p-6 border border-primary/20 shadow-lg transition-all duration-500">
          <div className="space-y-3">
            <Sparkles className="w-6 h-6 text-accent mx-auto" />
            <blockquote className="text-lg italic text-foreground leading-relaxed">
              "{currentQuote.quote}"
            </blockquote>
            <p className="text-sm text-muted-foreground">
              — {currentQuote.author}
            </p>
          </div>
        </div>

        {/* Loading Indicator */}
        {loading && (
          <div className="flex justify-center">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-primary animate-bounce" />
              <div className="w-3 h-3 rounded-full bg-primary animate-bounce [animation-delay:0.2s]" />
              <div className="w-3 h-3 rounded-full bg-primary animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}

        {/* Skip Button */}
        <Button
          variant="ghost"
          onClick={() => navigate(loading ? "/login" : "/home")}
          className="text-muted-foreground hover:text-foreground"
        >
          Continue →
        </Button>
      </div>
    </div>
  );
};

export default Index;