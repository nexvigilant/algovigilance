"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  PAGE_REGISTRY,
  SECTION_ORDER,
  getPagesBySection,
} from "@/data/page-registry";

/** Fire this custom event to open the palette from anywhere */
const OPEN_EVENT = "nexvigilant:command-palette:open";

export function openCommandPalette() {
  window.dispatchEvent(new CustomEvent(OPEN_EVENT));
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    const onOpen = () => setOpen(true);

    document.addEventListener("keydown", down);
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => {
      document.removeEventListener("keydown", down);
      window.removeEventListener(OPEN_EVENT, onOpen);
    };
  }, []);

  const handleSelect = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router],
  );

  const pagesBySection = getPagesBySection();

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search pages, tools, and features..." />
      <CommandList>
        <CommandEmpty>
          No results found. Try a different search term.
        </CommandEmpty>
        {SECTION_ORDER.map((section, sectionIndex) => {
          const pages = pagesBySection[section];
          if (!pages?.length) return null;
          return (
            <div key={section}>
              {sectionIndex > 0 && <CommandSeparator />}
              <CommandGroup heading={section}>
                {pages.map((page) => {
                  const Icon = page.icon;
                  return (
                    <CommandItem
                      key={page.href}
                      value={`${page.title} ${page.description} ${page.keywords.join(" ")}`}
                      onSelect={() => handleSelect(page.href)}
                    >
                      <Icon className="mr-2 h-4 w-4 shrink-0 text-cyan/50" />
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-medium text-white/90 truncate">
                          {page.title}
                        </span>
                        <span className="text-xs text-slate-dim/50 truncate">
                          {page.description}
                        </span>
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </div>
          );
        })}
      </CommandList>
      <div className="border-t border-cyan/10 px-3 py-2 text-xs text-slate-dim/40 flex items-center gap-4">
        <span>
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-cyan/20 bg-nex-surface/50 px-1.5 font-mono text-[10px] font-medium text-cyan/50">
            Enter
          </kbd>{" "}
          to navigate
        </span>
        <span>
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-cyan/20 bg-nex-surface/50 px-1.5 font-mono text-[10px] font-medium text-cyan/50">
            Esc
          </kbd>{" "}
          to close
        </span>
        <span className="ml-auto text-slate-dim/30">
          {PAGE_REGISTRY.length} pages indexed
        </span>
      </div>
    </CommandDialog>
  );
}

/** Inline search trigger button for the header */
export function SearchTrigger() {
  return (
    <button
      onClick={() => openCommandPalette()}
      className="hidden sm:flex items-center gap-2 rounded-md border border-cyan/20 bg-nex-surface/30 px-3 py-1.5 text-sm text-slate-dim/60 hover:border-cyan/40 hover:text-cyan/80 transition-colors"
      aria-label="Search pages (Ctrl+K)"
    >
      <Search className="h-3.5 w-3.5" />
      <span className="text-xs">Search...</span>
      <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-cyan/20 bg-nex-surface/50 px-1.5 font-mono text-[10px] font-medium text-cyan/40">
        <span className="text-xs">⌘</span>K
      </kbd>
    </button>
  );
}
