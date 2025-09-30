import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, BookOpen, Star, Clock, Play, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Book {
  id: string;
  title: string;
  author: string;
  cover_url?: string;
  description?: string;
  genre?: string;
  rating: number;
  page_count?: number;
  ai_summary?: string;
  isbn?: string;
}

interface UserLibraryItem {
  id: string;
  status: string;
  progress: number;
  current_page: number;
}

const BookDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState<Book | null>(null);
  const [libraryItem, setLibraryItem] = useState<UserLibraryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      loadBookDetails();
      checkUserLibrary();
    }
  }, [id]);

  const loadBookDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setBook(data);

      // Generate AI summary if not exists
      if (data && !data.ai_summary) {
        generateAISummary(data);
      }
    } catch (error) {
      console.error('Error loading book details:', error);
      toast({
        title: "Error",
        description: "Failed to load book details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const checkUserLibrary = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_library')
        .select('*')
        .eq('user_id', user.id)
        .eq('book_id', id)
        .maybeSingle();

      if (error) throw error;
      setLibraryItem(data);
    } catch (error) {
      console.error('Error checking user library:', error);
    }
  };

  const generateAISummary = async (bookData: Book) => {
    setSummaryLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-book-summary', {
        body: {
          title: bookData.title,
          author: bookData.author,
          description: bookData.description
        }
      });

      if (error) throw error;

      if (data?.summary) {
        // Update the book with the generated summary
        const { error: updateError } = await supabase
          .from('books')
          .update({ ai_summary: data.summary })
          .eq('id', bookData.id);

        if (updateError) throw updateError;

        setBook(prev => prev ? { ...prev, ai_summary: data.summary } : null);
      }
    } catch (error) {
      console.error('Error generating AI summary:', error);
    } finally {
      setSummaryLoading(false);
    }
  };

  const addToLibrary = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to add books to your library",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase
        .from('user_library')
        .insert({
          user_id: user.id,
          book_id: id,
          status: 'to_read'
        })
        .select()
        .single();

      if (error) throw error;

      setLibraryItem(data);
      toast({
        title: "Success",
        description: "Book added to your library",
      });
    } catch (error) {
      console.error('Error adding to library:', error);
      toast({
        title: "Error",
        description: "Failed to add book to library",
        variant: "destructive",
      });
    }
  };

  const startReading = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to start reading",
          variant: "destructive",
        });
        return;
      }

      if (libraryItem) {
        const { error } = await supabase
          .from('user_library')
          .update({
            status: 'reading',
            started_at: new Date().toISOString()
          })
          .eq('id', libraryItem.id);

        if (error) throw error;

        setLibraryItem(prev => prev ? { ...prev, status: 'reading' } : null);
      } else {
        // Add to library and start reading
        const { data, error } = await supabase
          .from('user_library')
          .insert({
            user_id: user.id,
            book_id: id,
            status: 'reading',
            started_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) throw error;
        setLibraryItem(data);
      }

      navigate(`/read/${id}`);
    } catch (error) {
      console.error('Error starting reading:', error);
      toast({
        title: "Error",
        description: "Failed to start reading",
        variant: "destructive",
      });
    }
  };

  const continueReading = () => {
    navigate(`/read/${id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-8 w-48" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-80 w-full" />
            <div className="md:col-span-2 space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto text-center py-8">
          <h2 className="text-2xl font-bold mb-2">Book Not Found</h2>
          <p className="text-muted-foreground mb-4">The book you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/library')}>
            Back to Library
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold">Book Details</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Book Cover */}
          <div className="flex flex-col items-center">
            {book.cover_url ? (
              <img
                src={book.cover_url}
                alt={book.title}
                className="w-full max-w-64 h-80 object-cover rounded-lg shadow-lg"
              />
            ) : (
              <div className="w-full max-w-64 h-80 bg-muted rounded-lg shadow-lg flex items-center justify-center">
                <BookOpen className="w-16 h-16 text-muted-foreground" />
              </div>
            )}

            {/* Action Buttons */}
            <div className="w-full mt-4 space-y-2">
              {!libraryItem ? (
                <Button onClick={addToLibrary} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Add to Library
                </Button>
              ) : libraryItem.status === 'to_read' ? (
                <Button onClick={startReading} className="w-full">
                  <Play className="w-4 h-4 mr-2" />
                  Start Reading
                </Button>
              ) : libraryItem.status === 'reading' ? (
                <Button onClick={continueReading} className="w-full">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Continue Reading
                </Button>
              ) : (
                <Button onClick={continueReading} variant="outline" className="w-full">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Read Again
                </Button>
              )}
            </div>

            {/* Progress */}
            {libraryItem && libraryItem.progress > 0 && (
              <div className="w-full mt-2 text-center">
                <div className="text-sm text-muted-foreground">
                  Progress: {libraryItem.progress}%
                </div>
                <div className="w-full bg-muted rounded-full h-2 mt-1">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${libraryItem.progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Book Information */}
          <div className="md:col-span-2 space-y-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{book.title}</h1>
              <p className="text-xl text-muted-foreground mb-4">by {book.author}</p>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {book.genre && (
                  <Badge variant="secondary">{book.genre}</Badge>
                )}
                {book.rating > 0 && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-current" />
                    {book.rating.toFixed(1)}
                  </Badge>
                )}
                {book.page_count && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {book.page_count} pages
                  </Badge>
                )}
              </div>
            </div>

            {/* Description */}
            {book.description && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {book.description}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* AI Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">AI Summary</CardTitle>
                <CardDescription>
                  Get the key insights from this book
                </CardDescription>
              </CardHeader>
              <CardContent>
                {summaryLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ) : book.ai_summary ? (
                  <p className="text-muted-foreground leading-relaxed">
                    {book.ai_summary}
                  </p>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground mb-2">
                      No AI summary available yet
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => generateAISummary(book)}
                    >
                      Generate Summary
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Additional Details */}
            {book.isbn && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Additional Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">ISBN:</span>
                      <span>{book.isbn}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookDetails;