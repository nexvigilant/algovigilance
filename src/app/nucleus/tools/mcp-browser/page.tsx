import { createMetadata } from '@/lib/metadata'
import { Cpu } from 'lucide-react'
import { McpBrowser } from './mcp-browser'

export const metadata = createMetadata({
  title: 'MCP Tool Browser',
  description:
    'Browse, search, and invoke NexCore MCP tools with live parameter forms and response visualization.',
  path: '/nucleus/tools/mcp-browser',
})

export default function McpBrowserPage() {
  return (
    <div className="container mx-auto px-4 py-8 md:px-6 min-h-[calc(100vh-4rem)]">
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-lg bg-gold/10">
            <Cpu className="h-8 w-8 text-gold" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold font-headline text-gold">
            MCP Tool Browser
          </h1>
        </div>
        <p className="text-base md:text-lg text-slate-dim font-medium">
          Browse, search, and invoke MCP tools across all NexCore domains
        </p>
      </header>

      <McpBrowser />
    </div>
  )
}
