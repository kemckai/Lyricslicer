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

import type { AnalyzeLyricsOutput } from '@/ai/flows/analyze-lyrics';
import { handleAnalyze, handleRemix } from '@/app/actions';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Logo } from '@/components/logo';

const formSchema = z.object({
  lyrics: z.string().min(20, 'Please enter at least 20 characters of lyrics.').max(4000, 'Lyrics cannot exceed 4000 characters.'),
  numRemixes: z.coerce.number().min(1).max(5),
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
  const [remixes, setRemixes] = useState<string[]>([]);
  const [savedLyrics, setSavedLyrics] = useState<SavedLyric[]>([]);
  const [activeTab, setActiveTab] = useState('remixes');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      lyrics: '',
      numRemixes: 3,
    },
  });

  const onAnalyze = async (values: z.infer<typeof formSchema>) => {
    setAnalysis(null);
    setActiveTab('analysis');

    startAnalyzeTransition(async () => {
      const formData = new FormData();
      formData.append('lyrics', values.lyrics);
      const result = await handleAnalyze(formData);

      if (result.error) {
        toast({ variant: 'destructive', title: 'Analysis Failed', description: result.error });
        setAnalysis(null);
      } else {
        setAnalysis(result);
      }
    });
  };

  const onRemix = (values: z.infer<typeof formSchema>) => {
    setRemixes([]);
    setActiveTab('remixes');

    startRemixTransition(async () => {
      const formData = new FormData();
      formData.append('lyrics', values.lyrics);
      formData.append('numRemixes', values.numRemixes.toString());
      const result = await handleRemix(formData);
      if (result.error) {
        toast({ variant: 'destructive', title: 'Remix Failed', description: result.error });
        setRemixes([]);
      } else {
        setRemixes(result.remixes || []);
      }
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
  
  const [editedRemixes, setEditedRemixes] = useState<Record<number, string>>({});
  const [editedSaved, setEditedSaved] = useState<Record<string, string>>({});

  const handleRemixEdit = (index: number, newText: string) => {
    setEditedRemixes(prev => ({...prev, [index]: newText}));
  };

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
              <CardFooter className="flex flex-col sm:flex-row justify-between gap-4">
                 <FormField
                    control={form.control}
                    name="numRemixes"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2 space-y-0 w-full sm:w-auto">
                        <FormLabel className="whitespace-nowrap">Remix versions</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={String(field.value)}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select number of remixes" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {[1, 2, 3, 4, 5].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
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
                  <CardTitle>Remixed Versions</CardTitle>
                  <CardDescription>AI-generated variations of your lyrics. Edit them freely.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isRemixing && Array.from({ length: form.getValues('numRemixes') }).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-6 w-1/4" />
                      <Skeleton className="h-24 w-full" />
                    </div>
                  ))}
                  {!isRemixing && remixes.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <Wand2 className="mx-auto h-12 w-12 mb-2" />
                      <p>Your remixed lyrics will appear here.</p>
                    </div>
                  )}
                  {remixes.map((remix, i) => (
                     <Card key={i} className="bg-background/50">
                      <CardHeader>
                        <CardTitle className="text-lg">Remix #{i + 1}</CardTitle>
                      </CardHeader>
                      <CardContent>
                         <Textarea 
                            value={editedRemixes[i] !== undefined ? editedRemixes[i] : remix}
                            onChange={(e) => handleRemixEdit(i, e.target.value)}
                            className="min-h-[150px] text-base"
                          />
                      </CardContent>
                      <CardFooter className="justify-end gap-2">
                         <Button variant="ghost" size="sm" onClick={() => handleCopyToClipboard(editedRemixes[i] !== undefined ? editedRemixes[i] : remix)}>
                            <Copy className="h-4 w-4" />
                         </Button>
                         <Button variant="ghost" size="sm" onClick={() => handleSave(editedRemixes[i] !== undefined ? editedRemixes[i] : remix)}>
                            <Save className="h-4 w-4" />
                         </Button>
                      </CardFooter>
                     </Card>
                  ))}
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
