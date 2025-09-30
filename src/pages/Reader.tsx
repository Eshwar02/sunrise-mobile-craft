import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Settings, 
  Bookmark, 
  Plus, 
  Moon, 
  Sun, 
  Type, 
  Palette,
  ChevronLeft,
  ChevronRight,
  Menu,
  StickyNote,
  Highlighter
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

interface Book {
  id: string;
  title: string;
  author: string;
  content_url?: string;
  page_count?: number;
}

interface UserLibraryItem {
  id: string;
  current_page: number;
  progress: number;
  status: string;
}

interface Bookmark {
  id: string;
  page_number: number;
  note?: string;
  created_at: string;
}

interface ReadingSettings {
  fontSize: number;
  fontFamily: string;
  lineHeight: number;
  theme: 'light' | 'dark' | 'sepia';
  backgroundColor: string;
  textColor: string;
}

const Reader = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState<Book | null>(null);
  const [libraryItem, setLibraryItem] = useState<UserLibraryItem | null>(null);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [bookContent, setBookContent] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [bookmarkDialogOpen, setBookmarkDialogOpen] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [selectedText, setSelectedText] = useState("");
  const [showHighlightMenu, setShowHighlightMenu] = useState(false);
  const [highlightPosition, setHighlightPosition] = useState({ x: 0, y: 0 });
  const contentRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const [settings, setSettings] = useState<ReadingSettings>({
    fontSize: 18,
    fontFamily: 'Source Serif Pro',
    lineHeight: 1.6,
    theme: 'light',
    backgroundColor: '#ffffff',
    textColor: '#000000'
  });

  useEffect(() => {
    if (id) {
      loadBookData();
      loadBookmarks();
      loadReadingSettings();
    }
  }, [id]);

  useEffect(() => {
    if (currentPage && libraryItem) {
      updateReadingProgress();
    }
  }, [currentPage]);

  const loadBookData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      // Load book details
      const { data: bookData, error: bookError } = await supabase
        .from('books')
        .select('*')
        .eq('id', id)
        .single();

      if (bookError) throw bookError;
      setBook(bookData);

      // Load user library item
      const { data: libraryData, error: libraryError } = await supabase
        .from('user_library')
        .select('*')
        .eq('user_id', user.id)
        .eq('book_id', id)
        .maybeSingle();

      if (libraryError) throw libraryError;
      
      if (libraryData) {
        setLibraryItem(libraryData);
        setCurrentPage(libraryData.current_page || 1);
      } else {
        // Create library entry if doesn't exist
        const { data: newLibraryItem, error: createError } = await supabase
          .from('user_library')
          .insert({
            user_id: user.id,
            book_id: id,
            status: 'reading',
            current_page: 1,
            started_at: new Date().toISOString()
          })
          .select()
          .single();

        if (createError) throw createError;
        setLibraryItem(newLibraryItem);
      }

      // Generate sample book content (in real app, this would load from content_url)
      generateSampleContent(bookData);

    } catch (error) {
      console.error('Error loading book data:', error);
      toast({
        title: "Error",
        description: "Failed to load book",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateSampleContent = (bookData: Book) => {
    // Generate sample content pages (in real app, this would parse actual book content)
    const samplePages = [];
    const totalPages = bookData.page_count || 200;
    
    for (let i = 1; i <= Math.min(totalPages, 50); i++) {
      samplePages.push(`
        <div class="page-content">
          <h2>Chapter ${Math.ceil(i / 10)}</h2>
          <p>This is page ${i} of "${bookData.title}" by ${bookData.author}.</p>
          <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
          <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
          <p>Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.</p>
          <p>Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.</p>
        </div>
      `);
    }
    
    setBookContent(samplePages);
  };

  const loadBookmarks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('bookmarks')
        .select('*')
        .eq('user_id', user.id)
        .eq('book_id', id)
        .order('page_number', { ascending: true });

      if (error) throw error;
      setBookmarks(data || []);
    } catch (error) {
      console.error('Error loading bookmarks:', error);
    }
  };

  const loadReadingSettings = () => {
    const savedSettings = localStorage.getItem('papyrus-reading-settings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  };

  const saveReadingSettings = (newSettings: ReadingSettings) => {
    setSettings(newSettings);
    localStorage.setItem('papyrus-reading-settings', JSON.stringify(newSettings));
  };

  const updateReadingProgress = useCallback(async () => {
    if (!libraryItem || !book) return;

    try {
      const progress = Math.round((currentPage / (book.page_count || bookContent.length)) * 100);
      
      const { error } = await supabase
        .from('user_library')
        .update({
          current_page: currentPage,
          progress: progress,
          status: progress >= 100 ? 'completed' : 'reading',
          completed_at: progress >= 100 ? new Date().toISOString() : null
        })
        .eq('id', libraryItem.id);

      if (error) throw error;

      setLibraryItem(prev => prev ? { ...prev, current_page: currentPage, progress } : null);

      // Update reading statistics
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const today = new Date().toISOString().split('T')[0];
        
        const { data: existingStats } = await supabase
          .from('reading_statistics')
          .select('*')
          .eq('user_id', user.id)
          .eq('date', today)
          .single();

        if (existingStats) {
          await supabase
            .from('reading_statistics')
            .update({
              pages_read: (existingStats.pages_read || 0) + 1,
              minutes_read: (existingStats.minutes_read || 0) + 2, // Assume 2 mins per page
              books_completed: progress >= 100 ? (existingStats.books_completed || 0) + 1 : existingStats.books_completed
            })
            .eq('id', existingStats.id);
        } else {
          await supabase
            .from('reading_statistics')
            .insert({
              user_id: user.id,
              date: today,
              pages_read: 1,
              minutes_read: 2,
              books_completed: progress >= 100 ? 1 : 0
            });
        }
      }

    } catch (error) {
      console.error('Error updating reading progress:', error);
    }
  }, [currentPage, libraryItem, book, bookContent.length]);

  const addBookmark = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('bookmarks')
        .insert({
          user_id: user.id,
          book_id: id,
          page_number: currentPage,
          note: noteText
        });

      if (error) throw error;

      toast({
        title: "Bookmark Added",
        description: `Page ${currentPage} bookmarked successfully`,
      });

      loadBookmarks();
      setBookmarkDialogOpen(false);
      setNoteText("");
    } catch (error) {
      console.error('Error adding bookmark:', error);
      toast({
        title: "Error",
        description: "Failed to add bookmark",
        variant: "destructive",
      });
    }
  };

  const goToPage = (pageNumber: number) => {
    if (pageNumber >= 1 && pageNumber <= bookContent.length) {
      setCurrentPage(pageNumber);
    }
  };

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) {
      setSelectedText(selection.toString());
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setHighlightPosition({ x: rect.left + rect.width / 2, y: rect.top });
      setShowHighlightMenu(true);
    } else {
      setShowHighlightMenu(false);
    }
  };

  const addHighlight = async (color: string) => {
    if (!selectedText) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // In a real app, you'd store highlight data with position info
      // For now, we'll add it as a bookmark with the highlighted text
      const { error } = await supabase
        .from('bookmarks')
        .insert({
          user_id: user.id,
          book_id: id,
          page_number: currentPage,
          note: `Highlighted: "${selectedText}"`
        });

      if (error) throw error;

      toast({
        title: "Text Highlighted",
        description: "Highlight saved successfully",
      });

      setShowHighlightMenu(false);
      setSelectedText("");
      loadBookmarks();
    } catch (error) {
      console.error('Error adding highlight:', error);
    }
  };

  const applyTheme = (theme: 'light' | 'dark' | 'sepia') => {
    let backgroundColor, textColor;
    
    switch (theme) {
      case 'dark':
        backgroundColor = '#1a1a1a';
        textColor = '#e5e5e5';
        break;
      case 'sepia':
        backgroundColor = '#f4f1e8';
        textColor = '#5c4b37';
        break;
      default:
        backgroundColor = '#ffffff';
        textColor = '#000000';
    }

    saveReadingSettings({
      ...settings,
      theme,
      backgroundColor,
      textColor
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-8 w-48" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (!book || !libraryItem) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto text-center py-8">
          <h2 className="text-2xl font-bold mb-2">Book Not Found</h2>
          <Button onClick={() => navigate('/library')}>
            Back to Library
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen transition-colors duration-300"
      style={{ backgroundColor: settings.backgroundColor }}
    >
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-semibold truncate max-w-48">{book.title}</h1>
              <p className="text-sm text-muted-foreground">{book.author}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Bookmark Button */}
            <Dialog open={bookmarkDialogOpen} onOpenChange={setBookmarkDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Bookmark className="w-5 h-5" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Bookmark</DialogTitle>
                  <DialogDescription>
                    Add a bookmark for page {currentPage}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Note (optional)</Label>
                    <Textarea
                      placeholder="Add a note for this bookmark..."
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                    />
                  </div>
                  <Button onClick={addBookmark} className="w-full">
                    Add Bookmark
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Settings Sheet */}
            <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Settings className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Reading Settings</SheetTitle>
                  <SheetDescription>
                    Customize your reading experience
                  </SheetDescription>
                </SheetHeader>
                
                <div className="space-y-6 mt-6">
                  {/* Theme Selection */}
                  <div>
                    <Label className="text-base font-medium">Theme</Label>
                    <div className="flex gap-2 mt-2">
                      <Button
                        variant={settings.theme === 'light' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => applyTheme('light')}
                      >
                        <Sun className="w-4 h-4 mr-2" />
                        Light
                      </Button>
                      <Button
                        variant={settings.theme === 'dark' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => applyTheme('dark')}
                      >
                        <Moon className="w-4 h-4 mr-2" />
                        Dark
                      </Button>
                      <Button
                        variant={settings.theme === 'sepia' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => applyTheme('sepia')}
                      >
                        <Palette className="w-4 h-4 mr-2" />
                        Sepia
                      </Button>
                    </div>
                  </div>

                  {/* Font Size */}
                  <div>
                    <Label className="text-base font-medium">Font Size: {settings.fontSize}px</Label>
                    <Slider
                      value={[settings.fontSize]}
                      onValueChange={(value) =>
                        saveReadingSettings({ ...settings, fontSize: value[0] })
                      }
                      max={32}
                      min={12}
                      step={2}
                      className="mt-2"
                    />
                  </div>

                  {/* Line Height */}
                  <div>
                    <Label className="text-base font-medium">Line Height: {settings.lineHeight}</Label>
                    <Slider
                      value={[settings.lineHeight]}
                      onValueChange={(value) =>
                        saveReadingSettings({ ...settings, lineHeight: value[0] })
                      }
                      max={2.5}
                      min={1.0}
                      step={0.1}
                      className="mt-2"
                    />
                  </div>

                  {/* Font Family */}
                  <div>
                    <Label className="text-base font-medium">Font Family</Label>
                    <div className="grid grid-cols-1 gap-2 mt-2">
                      {['Source Serif Pro', 'Inter', 'Georgia', 'Times New Roman'].map((font) => (
                        <Button
                          key={font}
                          variant={settings.fontFamily === font ? 'default' : 'outline'}
                          size="sm"
                          onClick={() =>
                            saveReadingSettings({ ...settings, fontFamily: font })
                          }
                          style={{ fontFamily: font }}
                        >
                          {font}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Bookmarks */}
                  <div>
                    <Label className="text-base font-medium">Bookmarks</Label>
                    <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                      {bookmarks.map((bookmark) => (
                        <Card key={bookmark.id} className="p-3">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <Button
                                variant="link"
                                className="p-0 h-auto text-left"
                                onClick={() => {
                                  goToPage(bookmark.page_number);
                                  setSettingsOpen(false);
                                }}
                              >
                                Page {bookmark.page_number}
                              </Button>
                              {bookmark.note && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {bookmark.note}
                                </p>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Reading Content */}
      <main className="relative">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>Page {currentPage} of {bookContent.length}</span>
              <span>{libraryItem.progress || 0}% complete</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${libraryItem.progress || 0}%` }}
              />
            </div>
          </div>

          {/* Reading Area */}
          <div
            ref={contentRef}
            className="reading-content mx-auto max-w-none prose prose-lg transition-all duration-300"
            style={{
              fontSize: `${settings.fontSize}px`,
              lineHeight: settings.lineHeight,
              fontFamily: settings.fontFamily,
              color: settings.textColor,
              maxWidth: '100%'
            }}
            onMouseUp={handleTextSelection}
            dangerouslySetInnerHTML={{
              __html: bookContent[currentPage - 1] || '<p>Page not found</p>'
            }}
          />

          {/* Navigation */}
          <div className="flex justify-between items-center mt-8">
            <Button
              variant="outline"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const pageNum = prompt('Go to page:', currentPage.toString());
                  if (pageNum) goToPage(parseInt(pageNum));
                }}
              >
                {currentPage} / {bookContent.length}
              </Button>
            </div>

            <Button
              variant="outline"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage >= bookContent.length}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>

        {/* Highlight Menu */}
        {showHighlightMenu && (
          <div
            className="fixed z-50 bg-background border rounded-lg shadow-lg p-2"
            style={{
              left: highlightPosition.x - 100,
              top: highlightPosition.y - 50,
            }}
          >
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => addHighlight('yellow')}
              >
                <Highlighter className="w-4 h-4 text-yellow-500" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => addHighlight('blue')}
              >
                <Highlighter className="w-4 h-4 text-blue-500" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => addHighlight('green')}
              >
                <Highlighter className="w-4 h-4 text-green-500" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowHighlightMenu(false)}
              >
                ✕
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Reader;