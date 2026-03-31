'use client';

/**
 * RichTextEditor Composition
 *
 * Production-ready markdown editor with:
 * - Edit/Preview tabs
 * - Formatting toolbar (bold, italic, code, link, headers)
 * - DOMPurify sanitization for XSS prevention
 * - Dark mode support
 * - Character count
 * - Keyboard shortcuts
 */

import { useState, useRef, useCallback } from 'react';
import DOMPurify from 'isomorphic-dompurify';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Bold,
  Italic,
  Code,
  Link2,
  Heading1,
  Heading2,
  List,
  Eye,
  Edit,
  Quote
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface RichTextEditorProps {
  /** Current markdown value */
  value: string;
  /** Callback when value changes */
  onChange: (value: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Maximum character length */
  maxLength?: number;
  /** Minimum height in pixels */
  minHeight?: number;
  /** Whether the editor is disabled */
  disabled?: boolean;
  /** Additional class names */
  className?: string;
  /** Show character count */
  showCharCount?: boolean;
  /** Error state */
  error?: boolean;
}

interface ToolbarAction {
  icon: React.ReactNode;
  title: string;
  prefix: string;
  suffix: string;
  block?: boolean;
}

const TOOLBAR_ACTIONS: ToolbarAction[] = [
  { icon: <Bold className="h-4 w-4" />, title: 'Bold (Ctrl+B)', prefix: '**', suffix: '**' },
  { icon: <Italic className="h-4 w-4" />, title: 'Italic (Ctrl+I)', prefix: '*', suffix: '*' },
  { icon: <Code className="h-4 w-4" />, title: 'Code', prefix: '`', suffix: '`' },
  { icon: <Link2 className="h-4 w-4" />, title: 'Link', prefix: '[', suffix: '](url)' },
  { icon: <Heading1 className="h-4 w-4" />, title: 'Heading 1', prefix: '# ', suffix: '', block: true },
  { icon: <Heading2 className="h-4 w-4" />, title: 'Heading 2', prefix: '## ', suffix: '', block: true },
  { icon: <List className="h-4 w-4" />, title: 'List item', prefix: '- ', suffix: '', block: true },
  { icon: <Quote className="h-4 w-4" />, title: 'Quote', prefix: '> ', suffix: '', block: true },
];

/**
 * Render markdown to sanitized HTML
 */
function renderMarkdown(markdown: string): string {
  const unsafeHtml = markdown
    .split('\n\n')
    .map((para) => {
      // Skip empty paragraphs
      if (!para.trim()) return '';

      // Headers
      if (para.startsWith('### ')) return `<h3>${para.slice(4)}</h3>`;
      if (para.startsWith('## ')) return `<h2>${para.slice(3)}</h2>`;
      if (para.startsWith('# ')) return `<h1>${para.slice(2)}</h1>`;

      // Blockquotes
      if (para.startsWith('> ')) {
        const quoteContent = para.slice(2);
        return `<blockquote>${quoteContent}</blockquote>`;
      }

      // Lists (simple implementation)
      if (para.includes('\n- ') || para.startsWith('- ')) {
        const items = para.split('\n').filter(line => line.startsWith('- '));
        const listItems = items.map(item => `<li>${item.slice(2)}</li>`).join('');
        return `<ul>${listItems}</ul>`;
      }

      // Inline formatting
      let formatted = para;

      // Code blocks (triple backticks)
      formatted = formatted.replace(/```(\w*)\n?([\s\S]*?)```/g, '<pre><code>$2</code></pre>');

      // Bold
      formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

      // Italic
      formatted = formatted.replace(/\*(.+?)\*/g, '<em>$1</em>');

      // Inline code
      formatted = formatted.replace(/`(.+?)`/g, '<code>$1</code>');

      // Links
      formatted = formatted.replace(
        /\[(.+?)\]\((.+?)\)/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-cyan hover:text-cyan-glow underline">$1</a>'
      );

      // Line breaks within paragraphs
      formatted = formatted.replace(/\n/g, '<br />');

      return `<p>${formatted}</p>`;
    })
    .filter(Boolean)
    .join('\n');

  // Sanitize to prevent XSS attacks
  return DOMPurify.sanitize(unsafeHtml, {
    ALLOWED_TAGS: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'strong', 'em', 'code', 'pre', 'a', 'ul', 'ol', 'li', 'blockquote'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
  });
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Write something...',
  maxLength,
  minHeight = 300,
  disabled = false,
  className,
  showCharCount = true,
  error = false,
}: RichTextEditorProps) {
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /**
   * Insert formatting at cursor position or around selection
   */
  const insertFormatting = useCallback((prefix: string, suffix: string, block = false) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);

    let newValue: string;
    let newCursorPos: number;

    if (block && start > 0 && value[start - 1] !== '\n') {
      // For block elements, ensure we're on a new line
      newValue = value.substring(0, start) + '\n' + prefix + selectedText + suffix + value.substring(end);
      newCursorPos = start + 1 + prefix.length + selectedText.length;
    } else {
      newValue = value.substring(0, start) + prefix + selectedText + suffix + value.substring(end);
      newCursorPos = start + prefix.length + selectedText.length;
    }

    onChange(newValue);

    // Restore cursor position after React updates
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    });
  }, [value, onChange]);

  /**
   * Handle keyboard shortcuts
   */
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault();
          insertFormatting('**', '**');
          break;
        case 'i':
          e.preventDefault();
          insertFormatting('*', '*');
          break;
        case 'k':
          e.preventDefault();
          insertFormatting('[', '](url)');
          break;
      }
    }
  }, [insertFormatting]);

  return (
    <div className={cn('rounded-lg border', error && 'border-destructive', className)}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b bg-muted/30 flex-wrap">
        {TOOLBAR_ACTIONS.map((action) => (
          <Button
            key={action.title}
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertFormatting(action.prefix, action.suffix, action.block)}
            disabled={disabled}
            title={action.title}
            className="h-8 w-8 p-0 hover:bg-muted"
          >
            {action.icon}
          </Button>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as 'edit' | 'preview')}>
        <TabsList className="w-full justify-start rounded-none border-b bg-transparent h-auto p-0">
          <TabsTrigger
            value="edit"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </TabsTrigger>
          <TabsTrigger
            value="preview"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2"
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="edit" className="m-0">
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            maxLength={maxLength}
            disabled={disabled}
            className={cn(
              'border-0 rounded-none rounded-b-lg resize-y font-mono focus-visible:ring-0 focus-visible:ring-offset-0',
            )}
            style={{ minHeight }}
          />
        </TabsContent>

        <TabsContent value="preview" className="m-0">
          {value.trim() ? (
            <div
              className="prose prose-sm prose-invert max-w-none p-4 rounded-b-lg bg-muted/20"
              style={{ minHeight }}
              dangerouslySetInnerHTML={{ __html: renderMarkdown(value) }}
            />
          ) : (
            <div
              className="flex items-center justify-center text-muted-foreground text-sm rounded-b-lg bg-muted/20"
              style={{ minHeight }}
            >
              Nothing to preview yet. Write some content in the Edit tab.
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Footer */}
      {showCharCount && (
        <div className="px-3 py-2 border-t text-xs text-muted-foreground flex justify-between">
          <span>
            {value.length}{maxLength ? `/${maxLength}` : ''} characters
          </span>
          <span>Supports Markdown • Ctrl+B bold • Ctrl+I italic • Ctrl+K link</span>
        </div>
      )}
    </div>
  );
}
