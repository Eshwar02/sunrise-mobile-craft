import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Search, BookOpen, Clock, CheckCircle, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Book {
  id: string;
  title: string;
  author: string;
  cover_url?: string;
  description?: string;
  genre?: string;
  rating: number;
  page_count?: number;
}

interface UserLibraryItem {
  id: string;
  book_id: string;
  status: string;
  progress: number;
  current_page: number;
  books: Book;
}

const Library = () => {
  const [userLibrary, setUserLibrary] = useState<UserLibraryItem[]>([]);
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadUserLibrary();
    loadAllBooks();
  }, []);

  const loadUserLibrary = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_library')
        .select(`
          *,
          books (*)
        `)
        .eq('user_id', user.id);

      if (error) throw error;
      setUserLibrary(data || []);
    } catch (error) {
      console.error('Error loading user library:', error);
      toast({
        title: "Error",
        description: "Failed to load your library",
        variant: "destructive",
      });
    }
  };

  const loadAllBooks = async () => {
    try {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAllBooks(data || []);
    } catch (error) {
      console.error('Error loading books:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBooks = allBooks.filter(book =>
    book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.genre?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBooks = (status: string) => {
    return userLibrary.filter(item => item.status === status);
  };

  const addToLibrary = async (bookId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('user_library')
        .insert({
          user_id: user.id,
          book_id: bookId,
          status: 'to_read'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Book added to your library",
      });

      loadUserLibrary();
    } catch (error) {
      console.error('Error adding to library:', error);
      toast({
        title: "Error",
        description: "Failed to add book to library",
        variant: "destructive",
      });
    }
  };

  const updateBookStatus = async (libraryId: string, newStatus: string) => {
    try {
      const updateData: any = { status: newStatus };
      
      if (newStatus === 'reading') {
        updateData.started_at = new Date().toISOString();
      } else if (newStatus === 'completed') {
        updateData.completed_at = new Date().toISOString();
        updateData.progress = 100;
      }

      const { error } = await supabase
        .from('user_library')
        .update(updateData)
        .eq('id', libraryId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Book status updated",
      });

      loadUserLibrary();
    } catch (error) {
      console.error('Error updating book status:', error);
      toast({
        title: "Error",
        description: "Failed to update book status",
        variant: "destructive",
      });
    }
  };

  const BookCard = ({ book, libraryItem }: { book: Book; libraryItem?: UserLibraryItem }) => (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
      <div onClick={() => navigate(`/book/${book.id}`)}>
        <CardHeader className="pb-2">
          <div className="flex gap-3">
            {book.cover_url ? (
              <img
                src={book.cover_url}
                alt={book.title}
                className="w-16 h-20 object-cover rounded"
              />
            ) : (
              <div className="w-16 h-20 bg-muted rounded flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1">
              <CardTitle className="text-base line-clamp-2">{book.title}</CardTitle>
              <CardDescription className="text-sm">{book.author}</CardDescription>
              {book.genre && (
                <Badge variant="secondary" className="mt-1 text-xs">
                  {book.genre}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
      </div>
      <CardContent className="pt-0">
        {libraryItem ? (
          <div className="space-y-2">
            {libraryItem.progress > 0 && (
              <div className="text-sm text-muted-foreground">
                Progress: {libraryItem.progress}%
              </div>
            )}
            <div className="flex gap-2">
              {libraryItem.status === 'to_read' && (
                <Button
                  size="sm"
                  onClick={() => updateBookStatus(libraryItem.id, 'reading')}
                >
                  Start Reading
                </Button>
              )}
              {libraryItem.status === 'reading' && (
                <Button
                  size="sm"
                  onClick={() => updateBookStatus(libraryItem.id, 'completed')}
                >
                  Mark Complete
                </Button>
              )}
              {libraryItem.status === 'completed' && (
                <Badge variant="default" className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Completed
                </Badge>
              )}
            </div>
          </div>
        ) : (
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              addToLibrary(book.id);
            }}
          >
            Add to Library
          </Button>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-8">Loading your library...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-4">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/home')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-3xl font-bold">My Library</h1>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search books by title, author, or genre..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">All Books</TabsTrigger>
            <TabsTrigger value="to_read" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              To Read ({getStatusBooks('to_read').length})
            </TabsTrigger>
            <TabsTrigger value="reading" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Reading ({getStatusBooks('reading').length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Completed ({getStatusBooks('completed').length})
            </TabsTrigger>
            <TabsTrigger value="discover">Discover</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userLibrary.map((item) => (
                <BookCard
                  key={item.id}
                  book={item.books}
                  libraryItem={item}
                />
              ))}
            </div>
            {userLibrary.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Your library is empty. Start by discovering new books!
              </div>
            )}
          </TabsContent>

          <TabsContent value="to_read" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getStatusBooks('to_read').map((item) => (
                <BookCard
                  key={item.id}
                  book={item.books}
                  libraryItem={item}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="reading" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getStatusBooks('reading').map((item) => (
                <BookCard
                  key={item.id}
                  book={item.books}
                  libraryItem={item}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getStatusBooks('completed').map((item) => (
                <BookCard
                  key={item.id}
                  book={item.books}
                  libraryItem={item}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="discover" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredBooks
                .filter(book => !userLibrary.some(item => item.book_id === book.id))
                .map((book) => (
                  <BookCard key={book.id} book={book} />
                ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Library;