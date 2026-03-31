'use client';
import { useState, useEffect, useTransition } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { Loader2, Search, Sparkles } from 'lucide-react';
import { intelligentSearchFromPrompt } from '@/lib/ai/flows/intelligent-search-from-prompt';
import { summarizeSearchResults } from '@/lib/ai/flows/summarize-search-results';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

import { logger } from '@/lib/logger';
const log = logger.scope('components/intelligent-search');

interface SearchState {
  results?: string[];
  summary?: string;
  error?: string;
  query?: string;
}

const initialState: SearchState = {};

function _SearchButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="icon" aria-label="Search" disabled={pending}>
      {pending ? <Loader2 className="animate-spin" /> : <Search />}
    </Button>
  );
}

export function IntelligentSearch() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isSummarizing, startSummarizing] = useTransition();

  const searchAction = async (prevState: SearchState, formData: FormData): Promise<SearchState> => {
    const prompt = formData.get('prompt') as string;
    try {
      const { results } = await intelligentSearchFromPrompt({ prompt });
      setOpen(true);
      return { results, query: prompt };
    } catch (error) {
      log.error('Search action failed');
      toast({
        title: 'Search Error',
        description: 'Could not perform search. Please try again.',
        variant: 'destructive',
      });
      return { error: 'Failed to search' };
    }
  };

  const [state, formAction] = useFormState(searchAction, initialState);

  const handleSummarize = async () => {
    if (!state.results || !state.query) return;
    startSummarizing(async () => {
      try {
        const { summary } = await summarizeSearchResults({ query: state.query ?? '', results: state.results ?? [] });
        // This is a bit of a hack to update the state from an async action.
        // A more robust solution might involve a state management library.
        document.dispatchEvent(new CustomEvent('summaryUpdate', { detail: summary }));
      } catch (error) {
        log.error('Summarization failed');
        toast({
          title: 'Summarization Error',
          description: 'Could not summarize results. Please try again.',
          variant: 'destructive',
        });
      }
    });
  };
  
  // Listen for summary updates from the async summarization
  const [summary, setSummary] = useState<string | undefined>();
  useEffect(() => {
    const handleSummaryUpdate = (e: Event) => {
        setSummary((e as CustomEvent).detail);
    };
    document.addEventListener('summaryUpdate', handleSummaryUpdate);
    return () => document.removeEventListener('summaryUpdate', handleSummaryUpdate);
  }, []);

  return (
    <>
      <form action={formAction} className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          name="prompt"
          placeholder="Intelligent Search..."
          className="w-full bg-background/70 pl-10"
          required
        />
      </form>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="font-headline">
              Search Results for: <span className="text-primary">{state.query}</span>
            </DialogTitle>
            <DialogDescription>
              Neural™ has found the following results across all AlgoVigilance services.
            </DialogDescription>
          </DialogHeader>
          
          {(summary || isSummarizing) && (
            <div className='p-4 rounded-lg bg-muted/50 border'>
                <h3 className='font-semibold flex items-center gap-2 mb-2'><Sparkles className='text-nex-gold-400'/> AI Summary</h3>
                {isSummarizing ? <p className='text-sm text-muted-foreground animate-pulse'>Generating summary...</p> : <p className='text-sm text-muted-foreground whitespace-pre-wrap'>{summary}</p>}
            </div>
          )}
          
          <ScrollArea className="max-h-[50vh] pr-4">
            <div className="space-y-4">
              {state.results?.map((result, index) => (
                <div key={index} className="rounded-lg border bg-card p-4 text-sm">
                  {result}
                </div>
              ))}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button
              onClick={handleSummarize}
              disabled={isSummarizing || !state.results || !!summary}
              variant="outline"
            >
              {isSummarizing ? <Loader2 className="animate-spin" /> : <Sparkles />}
              {summary ? 'Summary Generated' : 'Summarize with AI'}
            </Button>
            <Button onClick={() => setOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
