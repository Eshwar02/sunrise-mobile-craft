import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, Sparkles } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/home");
      } else {
        // Short delay for splash screen effect
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      }
    };

    checkAuth();
  }, [navigate]);

  // Inspirational quotes for splash screen
  const quotes = [
    "Every book is a new adventure waiting to unfold.",
    "Reading is dreaming with open eyes.",
    "Books are the quietest and most constant of friends.",
    "A room without books is like a body without a soul."
  ];

  const currentQuote = quotes[Math.floor(Math.random() * quotes.length)];

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-secondary">
      <div className="text-center space-y-8 px-4">
        {/* Logo Animation */}
        <div className="flex justify-center">
          <div className="relative">
            <BookOpen className="h-24 w-24 text-primary animate-pulse" />
            <Sparkles className="h-8 w-8 text-accent absolute -top-2 -right-2 animate-bounce" />
          </div>
        </div>
        
        {/* App Title */}
        <div>
          <h1 className="text-5xl font-bold text-foreground mb-2">Papyrus</h1>
          <p className="text-xl text-muted-foreground">Your Digital Library</p>
        </div>

        {/* Inspirational Quote */}
        <div className="max-w-md mx-auto">
          <p className="text-lg text-muted-foreground italic">
            "{currentQuote}"
          </p>
        </div>

        {/* Loading Indicator */}
        <div className="flex justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    </div>
  );
};

export default Index;
