# RichTextEditor Composition

**Status**: Starter Implementation - Ready for Enhancement

A WYSIWYG markdown editor component with rich formatting capabilities.

## Recommended Libraries

For production implementation, consider:
- **@tiptap/react** - Modern WYSIWYG editor
- **react-markdown** - Already in use (markdown rendering)
- **react-mde** - Markdown editor with preview

## Basic Implementation Pattern

```tsx
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Write something...',
  maxLength,
}) {
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');

  return (
    <div className="border rounded-lg">
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-2 border-b bg-gray-50">
        <button onClick={() => insertMarkdown('**', '**')} title="Bold">
          <strong>B</strong>
        </button>
        <button onClick={() => insertMarkdown('*', '*')} title="Italic">
          <em>I</em>
        </button>
        <button onClick={() => insertMarkdown('[', '](url)')} title="Link">
          Link
        </button>
      </div>

      {/* Editor / Preview Toggle */}
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab('edit')}
          className={activeTab === 'edit' ? 'bg-white' : 'bg-gray-50'}
        >
          Edit
        </button>
        <button
          onClick={() => setActiveTab('preview')}
          className={activeTab === 'preview' ? 'bg-white' : 'bg-gray-50'}
        >
          Preview
        </button>
      </div>

      {/* Content Area */}
      {activeTab === 'edit' ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          className="w-full p-4 min-h-[300px] resize-y"
        />
      ) : (
        <div className="p-4 min-h-[300px] prose">
          <ReactMarkdown>{value}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}
```

## Recommended Features

- Bold, italic, underline, strikethrough
- Headings (H1-H6)
- Lists (ordered, unordered)
- Links and images
- Code blocks
- Blockquotes
- Tables
- Undo/redo
- Keyboard shortcuts
- Auto-save draft
- Character/word count

## Future Enhancement

Create full implementation with toolbar, keyboard shortcuts, and accessibility features using Tiptap or similar library.
