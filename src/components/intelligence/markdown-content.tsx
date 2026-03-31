'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';

interface MarkdownContentProps {
  content: string;
}

/** Custom components for styled markdown rendering */
const components: Components = {
  h1: ({ children, ...props }) => (
    <h1 className="text-3xl font-headline text-white mt-12 mb-4" {...props}>
      {children}
    </h1>
  ),
  h2: ({ children, ...props }) => (
    <h2 className="text-2xl font-headline text-white mt-10 mb-4" {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }) => (
    <h3 className="text-xl font-semibold text-white mt-8 mb-3" {...props}>
      {children}
    </h3>
  ),
  p: ({ children, ...props }) => (
    <p className="text-slate-light leading-relaxed mb-6" {...props}>
      {children}
    </p>
  ),
  ul: ({ children, ...props }) => (
    <ul className="list-disc list-inside text-slate-light mb-6 space-y-2" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }) => (
    <ol className="list-decimal list-inside text-slate-light mb-6 space-y-2" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }) => (
    <li className="text-slate-light" {...props}>
      {children}
    </li>
  ),
  a: ({ children, href, ...props }) => (
    <a
      href={href}
      className="text-cyan hover:text-cyan/80 underline underline-offset-2"
      {...props}
    >
      {children}
    </a>
  ),
  blockquote: ({ children, ...props }) => (
    <blockquote
      className="border-l-4 border-cyan pl-6 italic text-slate-light my-8"
      {...props}
    >
      {children}
    </blockquote>
  ),
  code: ({ children, className, ...props }) => {
    // Check if this is an inline code or a code block
    const isInline = !className;
    if (isInline) {
      return (
        <code className="bg-nex-surface px-1.5 py-0.5 rounded text-sm text-cyan" {...props}>
          {children}
        </code>
      );
    }
    return (
      <code className={className} {...props}>
        {children}
      </code>
    );
  },
  pre: ({ children, ...props }) => (
    <pre
      className="bg-nex-surface p-4 rounded-lg overflow-x-auto mb-6 text-sm"
      {...props}
    >
      {children}
    </pre>
  ),
  hr: () => <hr className="border-nex-light my-10" />,
  img: ({ src, alt, ...props }) => (
    <img
      src={src}
      alt={alt ?? ''}
      className="rounded-lg my-8 w-full"
      {...props}
    />
  ),
  strong: ({ children, ...props }) => (
    <strong className="font-semibold text-white" {...props}>
      {children}
    </strong>
  ),
  em: ({ children, ...props }) => (
    <em className="italic" {...props}>
      {children}
    </em>
  ),
  table: ({ children, ...props }) => (
    <div className="overflow-x-auto mb-6">
      <table className="min-w-full divide-y divide-nex-light" {...props}>
        {children}
      </table>
    </div>
  ),
  th: ({ children, ...props }) => (
    <th className="px-4 py-3 text-left text-sm font-semibold text-white bg-nex-surface" {...props}>
      {children}
    </th>
  ),
  td: ({ children, ...props }) => (
    <td className="px-4 py-3 text-sm text-slate-light border-t border-nex-light" {...props}>
      {children}
    </td>
  ),
};

export function MarkdownContent({ content }: MarkdownContentProps) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {content}
    </ReactMarkdown>
  );
}
