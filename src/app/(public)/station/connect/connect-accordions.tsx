"use client";

import { useState } from "react";
import { ChevronDown, AlertCircle, Monitor, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";

interface AccordionItemProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function AccordionItem({
  title,
  icon,
  children,
  defaultOpen = false,
}: AccordionItemProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-lg border border-border/30 bg-card/20">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-3 p-3 text-left hover:bg-white/[0.02] transition-colors"
        aria-expanded={open}
      >
        {icon}
        <span className="flex-1 text-sm font-medium text-foreground">
          {title}
        </span>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open && (
        <div className="px-3 pb-3 pt-0 text-sm text-muted-foreground leading-relaxed space-y-2">
          {children}
        </div>
      )}
    </div>
  );
}

export function ConnectAccordions() {
  return (
    <section className="mb-golden-5">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground mb-golden-3">
        <AlertCircle className="w-5 h-5 text-muted-foreground" />
        Need Help?
      </h2>
      <div className="space-y-2">
        <AccordionItem
          title="I don't see 'Integrations' in my Claude settings"
          icon={<Monitor className="w-4 h-4 text-muted-foreground shrink-0" />}
        >
          <p>
            MCP integrations are available on{" "}
            <strong className="text-foreground">claude.ai</strong> (the website)
            with a <strong className="text-foreground">Pro or Team plan</strong>.
            If you&apos;re on the free plan, you may not see the Integrations
            menu yet.
          </p>
          <p>
            If you have a paid plan and still don&apos;t see it, try refreshing
            the page or logging out and back in. Anthropic has been rolling this
            feature out gradually.
          </p>
        </AccordionItem>

        <AccordionItem
          title="Can I use this on my phone?"
          icon={
            <Smartphone className="w-4 h-4 text-muted-foreground shrink-0" />
          }
        >
          <p>
            MCP integrations currently work on{" "}
            <strong className="text-foreground">claude.ai in a desktop browser</strong>{" "}
            and in the{" "}
            <strong className="text-foreground">Claude Desktop app</strong>{" "}
            (Mac/Windows). The Claude mobile app does not support MCP
            integrations yet.
          </p>
        </AccordionItem>

        <AccordionItem
          title="I pasted the URL but nothing happened"
          icon={
            <AlertCircle className="w-4 h-4 text-muted-foreground shrink-0" />
          }
        >
          <p>
            After adding the server URL, Claude may take a few seconds to
            connect and load the tools. You should see a confirmation that the
            server was added.
          </p>
          <p>
            If it fails, double-check that the URL is exactly:
          </p>
          <code className="block rounded bg-slate-900 px-2 py-1 text-xs text-cyan-300 font-mono mt-1">
            https://mcp.nexvigilant.com/mcp
          </code>
          <p className="mt-2">
            Make sure there are no extra spaces before or after the URL. If it
            still doesn&apos;t work, our server might be temporarily restarting
            — try again in a minute.
          </p>
        </AccordionItem>

        <AccordionItem
          title="How do I use Claude Desktop instead of the website?"
          icon={<Monitor className="w-4 h-4 text-muted-foreground shrink-0" />}
        >
          <p>
            If you prefer the{" "}
            <strong className="text-foreground">Claude Desktop app</strong>{" "}
            (available for Mac and Windows), you can add AlgoVigilance Station by
            editing a config file:
          </p>
          <ol className="list-decimal list-inside space-y-1 mt-2 text-xs">
            <li>
              Open Claude Desktop → Settings → Developer → Edit Config
            </li>
            <li>
              Add this to the <code className="text-cyan-400">mcpServers</code>{" "}
              section:
            </li>
          </ol>
          <pre className="rounded bg-slate-900 p-3 text-xs text-cyan-300 font-mono mt-2 overflow-x-auto">
            {JSON.stringify(
              {
                mcpServers: {
                  "nexvigilant-station": {
                    url: "https://mcp.nexvigilant.com/mcp",
                  },
                },
              },
              null,
              2,
            )}
          </pre>
          <p className="mt-2">Save the file and restart Claude Desktop.</p>
        </AccordionItem>

        <AccordionItem
          title="Is this safe? What data do you collect?"
          icon={
            <AlertCircle className="w-4 h-4 text-muted-foreground shrink-0" />
          }
        >
          <p>
            AlgoVigilance Station is{" "}
            <strong className="text-foreground">read-only</strong>. All tools
            are marked as non-destructive — they search public databases and
            compute statistics. They cannot modify anything.
          </p>
          <p>
            We do not collect your conversation content. We log basic
            telemetry (which tools were called, response times) to monitor
            service health. No personal data is stored.
          </p>
        </AccordionItem>

        <AccordionItem
          title="I'm a developer — how do I integrate this into my own agent?"
          icon={<Monitor className="w-4 h-4 text-muted-foreground shrink-0" />}
        >
          <p>
            AlgoVigilance Station speaks the{" "}
            <strong className="text-foreground">
              Model Context Protocol (MCP)
            </strong>{" "}
            — an open standard by Anthropic for connecting AI to external tools.
            Any MCP-compatible client can connect.
          </p>
          <p>
            Endpoint:{" "}
            <code className="text-cyan-400">
              https://mcp.nexvigilant.com/mcp
            </code>
          </p>
          <p>
            Protocol: MCP 2025-03-26 (Streamable HTTP). No auth. CORS enabled.
            Call <code className="text-cyan-400">nexvigilant_chart_course</code>{" "}
            first — it returns step-by-step tool sequences for any drug safety
            workflow.
          </p>
        </AccordionItem>
      </div>
    </section>
  );
}
