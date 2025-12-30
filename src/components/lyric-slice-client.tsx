'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Copy,
  Download,
  Loader2,
  Save,
  ScanLine,
  Trash2,
  Wand2,
} from 'lucide-react';

import { analyzeLyrics, type AnalyzeLyricsOutput } from '@/lib/analyze-lyrics';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Logo } from '@/components/logo';

const formSchema = z.object({
  lyrics: z.string().min(20, 'Please enter at least 20 characters of lyrics.').max(4000, 'Lyrics cannot exceed 4000 characters.'),
});

type SavedLyric = {
  id: string;
  text: string;
};

export default function LyricSliceClient() {
  const { toast } = useToast();
  const [isAnalyzing, startAnalyzeTransition] = useTransition();
  const [isRemixing, startRemixTransition] = useTransition();

  const [analysis, setAnalysis] = useState<AnalyzeLyricsOutput | null>(null);
  const [remix, setRemix] = useState<string | null>(null);
  const [savedLyrics, setSavedLyrics] = useState<SavedLyric[]>([]);
  const [activeTab, setActiveTab] = useState('remixes');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      lyrics: '',
    },
  });

  const onAnalyze = (values: z.infer<typeof formSchema>) => {
    setAnalysis(null);
    setActiveTab('analysis');

    startAnalyzeTransition(() => {
      try {
        const result = analyzeLyrics(values.lyrics);
        setAnalysis(result);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        toast({ variant: 'destructive', title: 'Analysis Failed', description: errorMessage });
        setAnalysis(null);
      }
    });
  };

  const onRemix = (values: z.infer<typeof formSchema>) => {
    setRemix(null);
    setActiveTab('remixes');
    setEditedRemix(null);

    startRemixTransition(() => {
      const lines = values.lyrics.split('\n').filter(line => line.trim() !== '');
      if (lines.length === 0) {
        setRemix(null);
        return;
      }

      // Fisher-Yates shuffle for the remix
      const shuffledLines = [...lines];
      for (let j = shuffledLines.length - 1; j > 0; j--) {
        const k = Math.floor(Math.random() * (j + 1));
        [shuffledLines[j], shuffledLines[k]] = [shuffledLines[k], shuffledLines[j]];
      }
      
      setRemix(shuffledLines.join('\n'));
    });
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied to clipboard!' });
  };

  const handleSave = (text: string) => {
    const newSavedLyric = { id: Date.now().toString(), text };
    setSavedLyrics(prev => [...prev, newSavedLyric]);
    toast({ title: 'Remix saved!', description: 'You can find it in the "Saved" section below.' });
  };
  
  const handleRemoveSaved = (id: string) => {
    setSavedLyrics(prev => prev.filter(lyric => lyric.id !== id));
    toast({ title: 'Saved lyric removed.' });
  };

  const handleDownload = (text: string) => {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'lyricslice-remix.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({ title: 'Download started!' });
  };
  
  const [editedRemix, setEditedRemix] = useState<string | null>(null);
  const [editedSaved, setEditedSaved] = useState<Record<string, string>>({});

  const handleSavedEdit = (id: string, newText: string) => {
    setEditedSaved(prev => ({...prev, [id]: newText}));
  };

  const lyrics = form.watch('lyrics');

  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="flex flex-col items-center text-center mb-8">
        <Logo />
        <p className="max-w-2xl mt-2 text-muted-foreground">
          Paste your lyrics, get instant analysis, and generate creative remixes. Refine your songwriting.
        </p>
      </header>

      <main className="grid md:grid-cols-2 gap-8 items-start">
        <Card className="sticky top-8">
          <CardHeader>
            <CardTitle>Original Lyrics</CardTitle>
            <CardDescription>Type or paste your lyrics here to get started.</CardDescription>
          </CardHeader>
          <Form {...form}>
            <form>
              <CardContent>
                <FormField
                  control={form.control}
                  name="lyrics"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          id="lyrics-input"
                          placeholder="In a town of quiet streets, a silent heart still beats..."
                          className="min-h-[250px] text-base resize-y"
                          {...field}
                        />
                      </FormControl>
                      <div className="text-right text-sm text-muted-foreground pr-1">
                        {lyrics.length} / 4000
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter className="flex flex-col sm:flex-row justify-end gap-4">
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button type="button" variant="secondary" onClick={form.handleSubmit(onAnalyze)} disabled={isAnalyzing || !lyrics} className="w-full">
                    {isAnalyzing ? <Loader2 className="animate-spin" /> : <ScanLine />}
                    Analyze
                  </Button>
                  <Button type="button" onClick={form.handleSubmit(onRemix)} disabled={isRemixing || !lyrics} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                    {isRemixing ? <Loader2 className="animate-spin" /> : <Wand2 />}
                    Remix
                  </Button>
                </div>
              </CardFooter>
            </form>
          </Form>
        </Card>

        <div>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="remixes">Remixes</TabsTrigger>
              <TabsTrigger value="analysis">Analysis</TabsTrigger>
            </TabsList>
            <TabsContent value="remixes">
              <Card>
                <CardHeader>
                  <CardTitle>Remixed Version</CardTitle>
                  <CardDescription>A shuffled variation of your lyrics. Edit it freely.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isRemixing && (
                    <div className="space-y-2">
                      <Skeleton className="h-6 w-1/4" />
                      <Skeleton className="h-24 w-full" />
                    </div>
                  )}
                  {!isRemixing && !remix && (
                    <div className="text-center py-12 text-muted-foreground">
                      <Wand2 className="mx-auto h-12 w-12 mb-2" />
                      <p>Your remixed lyric will appear here.</p>
                    </div>
                  )}
                  {remix && (
                     <Card className="bg-background/50">
                      <CardHeader>
                        <CardTitle className="text-lg">Remix</CardTitle>
                      </CardHeader>
                      <CardContent>
                         <Textarea 
                            id="remix-textarea"
                            name="remix"
                            value={editedRemix !== null ? editedRemix : remix}
                            onChange={(e) => setEditedRemix(e.target.value)}
                            className="min-h-[150px] text-base"
                          />
                      </CardContent>
                      <CardFooter className="justify-end gap-2">
                         <Button variant="ghost" size="sm" onClick={() => handleCopyToClipboard(editedRemix !== null ? editedRemix : remix)}>
                            <Copy className="h-4 w-4" />
                         </Button>
                         <Button variant="ghost" size="sm" onClick={() => handleSave(editedRemix !== null ? editedRemix : remix)}>
                            <Save className="h-4 w-4" />
                         </Button>
                      </CardFooter>
                     </Card>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="analysis">
              <Card>
                <CardHeader>
                  <CardTitle>Lyric Analysis</CardTitle>
                  <CardDescription>AI-powered breakdown of syllable and rhyme patterns.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isAnalyzing && (
                    <>
                     <div className="space-y-2">
                        <Skeleton className="h-6 w-1/3" />
                        <Skeleton className="h-20 w-full" />
                      </div>
                      <div className="space-y-2">
                        <Skeleton className="h-6 w-1/4" />
                        <Skeleton className="h-20 w-full" />
                      </div>
                    </>
                  )}
                  {!isAnalyzing && !analysis && (
                    <div className="text-center py-12 text-muted-foreground">
                      <ScanLine className="mx-auto h-12 w-12 mb-2" />
                      <p>Your lyric analysis will appear here.</p>
                    </div>
                  )}
                  {analysis && (
                    <>
                      <div>
                        <h3 className="font-headline text-lg font-medium">Syllable Analysis</h3>
                        <p className="text-muted-foreground whitespace-pre-wrap">{analysis.syllableAnalysis}</p>
                      </div>
                      <Separator/>
                      <div>
                        <h3 className="font-headline text-lg font-medium">Rhyme Analysis</h3>
                        <p className="text-muted-foreground whitespace-pre-wrap">{analysis.rhymeAnalysis}</p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {savedLyrics.length > 0 && (
         <section className="mt-12">
            <h2 className="font-headline text-3xl font-bold text-center mb-6">Saved Versions</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
               {savedLyrics.map((lyric) => (
                  <Card key={lyric.id}>
                    <CardContent className="p-6">
                      <Textarea 
                        id={`saved-lyric-${lyric.id}`}
                        name={`saved-lyric-${lyric.id}`}
                        value={editedSaved[lyric.id] !== undefined ? editedSaved[lyric.id] : lyric.text}
                        onChange={(e) => handleSavedEdit(lyric.id, e.target.value)}
                        className="min-h-[180px] text-base" 
                      />
                    </CardContent>
                    <CardFooter className="justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleCopyToClipboard(editedSaved[lyric.id] !== undefined ? editedSaved[lyric.id] : lyric.text)}>
                           <Copy className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDownload(editedSaved[lyric.id] !== undefined ? editedSaved[lyric.id] : lyric.text)}>
                           <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleRemoveSaved(lyric.id)}>
                           <Trash2 className="h-4 w-4" />
                        </Button>
                    </CardFooter>
                  </Card>
               ))}
            </div>
         </section>
      )}

    </div>
  );
}
