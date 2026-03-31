"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  BookOpen,
  Upload,
  ChevronLeft,
  ChevronRight,
  List,
  X,
  FileText,
  User,
  Globe,
} from "lucide-react";
import Link from "next/link";
import DOMPurify from "dompurify";
import JSZip from "jszip";

// ─── Types ───

interface EpubBook {
  title: string;
  author: string;
  language: string;
  publisher: string;
  description: string;
  chapters: EpubChapter[];
  coverDataUrl: string | null;
  totalWords: number;
}

interface EpubChapter {
  title: string;
  href: string;
  content: string; // sanitized HTML
  wordCount: number;
  order: number;
}

// ─── EPUB Parser (client-side, uses JSZip) ───

async function parseEpub(file: File): Promise<EpubBook> {
  const data = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(data);

  // 1. Find OPF path from container.xml
  const containerXml = await readZipText(zip, "META-INF/container.xml");
  const opfPath = extractOpfPath(containerXml);
  const opfDir = opfPath.includes("/")
    ? opfPath.substring(0, opfPath.lastIndexOf("/") + 1)
    : "";

  // 2. Parse OPF for metadata + manifest + spine
  const opfXml = await readZipText(zip, opfPath);
  const parser = new DOMParser();
  const opfDoc = parser.parseFromString(opfXml, "application/xml");

  const metadata = extractMetadata(opfDoc);
  const manifest = extractManifest(opfDoc);
  const spine = extractSpine(opfDoc);

  // 3. Read cover image
  let coverDataUrl: string | null = null;
  const coverMeta = opfDoc.querySelector('meta[name="cover"]');
  const coverItemId = coverMeta?.getAttribute("content");
  if (coverItemId) {
    const coverItem = manifest.get(coverItemId);
    if (coverItem) {
      const coverPath = opfDir + coverItem.href;
      const coverFile = zip.file(coverPath);
      if (coverFile) {
        const coverBlob = await coverFile.async("blob");
        coverDataUrl = URL.createObjectURL(coverBlob);
      }
    }
  }

  // 4. Read chapters in spine order
  const chapters: EpubChapter[] = [];
  for (let i = 0; i < spine.length; i++) {
    const itemId = spine[i];
    const item = manifest.get(itemId);
    if (
      !item ||
      (!item.mediaType.includes("xhtml") && !item.mediaType.includes("html"))
    )
      continue;

    const chapterPath = opfDir + item.href;
    const chapterXml = await readZipText(zip, chapterPath);
    const chapterDoc = parser.parseFromString(
      chapterXml,
      "application/xhtml+xml",
    );

    // Extract title from first heading or use filename
    const heading = chapterDoc.querySelector("h1, h2, h3");
    const title =
      heading?.textContent?.trim() ||
      item.href.replace(/\.x?html$/, "").replace(/_/g, " ");

    // Extract body content
    const body = chapterDoc.querySelector("body");
    const content = body ? sanitizeHtml(body.innerHTML) : "";
    const wordCount = content
      .replace(/<[^>]+>/g, "")
      .split(/\s+/)
      .filter(Boolean).length;

    chapters.push({ title, href: item.href, content, wordCount, order: i });
  }

  const totalWords = chapters.reduce((sum, ch) => sum + ch.wordCount, 0);

  return { ...metadata, chapters, coverDataUrl, totalWords };
}

async function readZipText(zip: JSZip, path: string): Promise<string> {
  const file = zip.file(path);
  if (!file) throw new Error(`Missing file in EPUB: ${path}`);
  return file.async("text");
}

function extractOpfPath(containerXml: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(containerXml, "application/xml");
  const rootfile = doc.querySelector("rootfile");
  return rootfile?.getAttribute("full-path") || "OEBPS/content.opf";
}

function extractMetadata(opfDoc: Document): {
  title: string;
  author: string;
  language: string;
  publisher: string;
  description: string;
} {
  const getText = (tag: string) => {
    // Try with namespace prefix
    const el = opfDoc.querySelector(`metadata ${tag}, metadata *|${tag}`);
    return el?.textContent?.trim() || "";
  };

  return {
    title: getText("title") || "Untitled",
    author: getText("creator") || "Unknown Author",
    language: getText("language") || "en",
    publisher: getText("publisher") || "",
    description: getText("description") || "",
  };
}

function extractManifest(
  opfDoc: Document,
): Map<string, { href: string; mediaType: string }> {
  const manifest = new Map<string, { href: string; mediaType: string }>();
  const items = opfDoc.querySelectorAll("manifest item");
  items.forEach((item) => {
    const id = item.getAttribute("id") || "";
    const href = item.getAttribute("href") || "";
    const mediaType = item.getAttribute("media-type") || "";
    manifest.set(id, { href, mediaType });
  });
  return manifest;
}

function extractSpine(opfDoc: Document): string[] {
  const refs = opfDoc.querySelectorAll("spine itemref");
  return Array.from(refs).map((ref) => ref.getAttribute("idref") || "");
}

function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "p",
      "br",
      "hr",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "em",
      "strong",
      "b",
      "i",
      "u",
      "s",
      "sub",
      "sup",
      "span",
      "div",
      "ul",
      "ol",
      "li",
      "dl",
      "dt",
      "dd",
      "blockquote",
      "pre",
      "code",
      "a",
      "img",
      "table",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
      "figure",
      "figcaption",
      "section",
      "article",
    ],
    ALLOWED_ATTR: [
      "href",
      "src",
      "alt",
      "title",
      "class",
      "id",
      "colspan",
      "rowspan",
    ],
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: [
      "script",
      "style",
      "iframe",
      "object",
      "embed",
      "form",
      "input",
      "meta",
      "link",
      "svg",
    ],
  });
}

// ─── Component ───

export default function EpubReaderPage() {
  const [book, setBook] = useState<EpubBook | null>(null);
  const [currentChapter, setCurrentChapter] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showToc, setShowToc] = useState(false);
  const [fontSize, setFontSize] = useState(18);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleBlob = useCallback(async (blob: Blob) => {
    setLoading(true);
    setError(null);
    try {
      const file = new File([blob], "book.epub", {
        type: "application/epub+zip",
      });
      const parsed = await parseEpub(file);
      setBook(parsed);
      setCurrentChapter(0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to parse EPUB");
    } finally {
      setLoading(false);
    }
  }, []);

  // Check for handoff from publisher page
  useEffect(() => {
    const handoff = sessionStorage.getItem("epub-handoff");
    if (handoff) {
      sessionStorage.removeItem("epub-handoff");
      // Convert data URL to blob
      fetch(handoff)
        .then((res) => res.blob())
        .then((blob) => handleBlob(blob))
        .catch((e) => setError(`Handoff failed: ${e}`));
    }
  }, [handleBlob]);

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.endsWith(".epub")) {
      setError("Please select an .epub file");
      return;
    }
    const MAX_SIZE = 100 * 1024 * 1024; // 100 MB
    if (file.size > MAX_SIZE) {
      setError(
        `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum: 100 MB.`,
      );
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const parsed = await parseEpub(file);
      setBook(parsed);
      setCurrentChapter(0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to parse EPUB");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  // Scroll to top on chapter change
  useEffect(() => {
    contentRef.current?.scrollTo(0, 0);
  }, [currentChapter]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!book) return;
      if (e.key === "ArrowRight" || e.key === "PageDown") {
        setCurrentChapter((c) => Math.min(c + 1, book.chapters.length - 1));
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        setCurrentChapter((c) => Math.max(c - 1, 0));
      } else if (e.key === "Escape") {
        setShowToc(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [book]);

  // ─── Upload View ───
  if (!book) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100">
        <div className="max-w-2xl mx-auto px-6 py-16">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="h-8 w-8 text-emerald-400" />
            <h1 className="text-3xl font-bold">EPUB Reader</h1>
          </div>
          <p className="text-zinc-400 mb-8">
            Open and read EPUB ebooks directly in AlgoVigilance Terminal.
          </p>

          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-zinc-700 rounded-xl p-16 text-center cursor-pointer hover:border-emerald-500 hover:bg-zinc-900/50 transition-all"
          >
            <Upload className="h-12 w-12 mx-auto mb-4 text-zinc-500" />
            <p className="text-lg text-zinc-300 mb-2">
              Drop an .epub file here or click to browse
            </p>
            <p className="text-sm text-zinc-500">
              Parsed entirely in your browser — no upload to any server
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".epub"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
          </div>

          {loading && (
            <div className="mt-6 text-center text-emerald-400">
              Parsing EPUB...
            </div>
          )}

          {error && (
            <div className="mt-6 p-4 bg-red-950/50 border border-red-800 rounded-lg text-red-300">
              {error}
            </div>
          )}

          <div className="mt-8 text-sm text-zinc-600">
            <p>
              Supports EPUB 2 and EPUB 3 files. Keyboard: Arrow keys to navigate
              chapters.
            </p>
          </div>

          <div className="mt-4">
            <Link
              href="/tools"
              className="text-sm text-zinc-500 hover:text-zinc-300"
            >
              Back to Tools
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ─── Reader View ───
  const chapter = book.chapters[currentChapter];
  const progress =
    book.chapters.length > 1
      ? Math.round((currentChapter / (book.chapters.length - 1)) * 100)
      : 100;

  return (
    <div className="h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Top bar */}
      <header className="flex-none border-b border-zinc-800 px-4 py-2 flex items-center gap-4 bg-zinc-950/95 backdrop-blur">
        <button
          onClick={() => {
            setBook(null);
            setShowToc(false);
          }}
          className="text-zinc-400 hover:text-zinc-200 transition-colors"
          title="Close book"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold truncate">{book.title}</h2>
          <p className="text-xs text-zinc-500 truncate">{book.author}</p>
        </div>

        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <span>
            {currentChapter + 1}/{book.chapters.length}
          </span>
          <span className="text-zinc-700">|</span>
          <span>{book.totalWords.toLocaleString()} words</span>
        </div>

        <button
          onClick={() => setFontSize((s) => Math.max(12, s - 2))}
          className="text-zinc-500 hover:text-zinc-300 px-1 text-sm font-mono"
          title="Decrease font size"
        >
          A-
        </button>
        <button
          onClick={() => setFontSize((s) => Math.min(28, s + 2))}
          className="text-zinc-500 hover:text-zinc-300 px-1 text-sm font-mono"
          title="Increase font size"
        >
          A+
        </button>

        <button
          onClick={() => setShowToc((t) => !t)}
          className={`p-1.5 rounded ${showToc ? "bg-zinc-800 text-emerald-400" : "text-zinc-400 hover:text-zinc-200"}`}
          title="Table of Contents"
        >
          <List className="h-5 w-5" />
        </button>
      </header>

      {/* Progress bar */}
      <div className="flex-none h-0.5 bg-zinc-900">
        <div
          className="h-full bg-emerald-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* TOC sidebar */}
        {showToc && (
          <aside className="w-72 flex-none border-r border-zinc-800 overflow-y-auto bg-zinc-950 p-4">
            <h3 className="text-sm font-semibold text-zinc-400 mb-3">
              Contents
            </h3>

            {/* Book info */}
            {book.coverDataUrl && (
              <img
                src={book.coverDataUrl}
                alt={book.title}
                className="w-full rounded-lg mb-4 shadow-lg"
              />
            )}

            <div className="mb-4 space-y-1 text-xs text-zinc-500">
              {book.author && (
                <div className="flex items-center gap-1.5">
                  <User className="h-3 w-3" />
                  <span>{book.author}</span>
                </div>
              )}
              {book.publisher && (
                <div className="flex items-center gap-1.5">
                  <FileText className="h-3 w-3" />
                  <span>{book.publisher}</span>
                </div>
              )}
              {book.language && (
                <div className="flex items-center gap-1.5">
                  <Globe className="h-3 w-3" />
                  <span>{book.language}</span>
                </div>
              )}
            </div>

            <nav className="space-y-0.5">
              {book.chapters.map((ch, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setCurrentChapter(i);
                    setShowToc(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded text-sm truncate transition-colors ${
                    i === currentChapter
                      ? "bg-emerald-500/10 text-emerald-400 font-medium"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                  }`}
                >
                  <span className="text-zinc-600 mr-2">{i + 1}.</span>
                  {ch.title}
                  <span className="text-zinc-700 ml-1 text-xs">
                    ({ch.wordCount}w)
                  </span>
                </button>
              ))}
            </nav>
          </aside>
        )}

        {/* Main content */}
        <main ref={contentRef} className="flex-1 overflow-y-auto">
          <article
            className="max-w-3xl mx-auto px-8 py-12"
            style={{ fontSize: `${fontSize}px` }}
          >
            <h1 className="text-2xl font-bold mb-8 text-zinc-200">
              {chapter.title}
            </h1>
            <div
              className="epub-content prose prose-invert prose-zinc max-w-none leading-relaxed"
              dangerouslySetInnerHTML={{ __html: chapter.content }}
            />
          </article>
        </main>
      </div>

      {/* Bottom nav */}
      <footer className="flex-none border-t border-zinc-800 px-4 py-2 flex items-center justify-between bg-zinc-950/95 backdrop-blur">
        <button
          onClick={() => setCurrentChapter((c) => Math.max(c - 1, 0))}
          disabled={currentChapter === 0}
          className="flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-200 disabled:text-zinc-700 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </button>

        <span className="text-xs text-zinc-600">
          {chapter.wordCount} words in this chapter
        </span>

        <button
          onClick={() =>
            setCurrentChapter((c) => Math.min(c + 1, book.chapters.length - 1))
          }
          disabled={currentChapter === book.chapters.length - 1}
          className="flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-200 disabled:text-zinc-700 disabled:cursor-not-allowed transition-colors"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </button>
      </footer>

      {/* EPUB content styles */}
      <style jsx global>{`
        .epub-content p {
          margin-bottom: 1em;
          text-indent: 1.5em;
        }
        .epub-content p:first-child,
        .epub-content h1 + p,
        .epub-content h2 + p,
        .epub-content h3 + p {
          text-indent: 0;
        }
        .epub-content h2 {
          font-size: 1.4em;
          font-weight: 600;
          margin-top: 2em;
          margin-bottom: 0.5em;
          color: #e4e4e7;
        }
        .epub-content h3 {
          font-size: 1.2em;
          font-weight: 600;
          margin-top: 1.5em;
          margin-bottom: 0.4em;
          color: #d4d4d8;
        }
        .epub-content blockquote {
          border-left: 3px solid #3f3f46;
          padding-left: 1em;
          margin: 1em 0;
          font-style: italic;
          color: #a1a1aa;
        }
        .epub-content img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
          margin: 1em 0;
        }
        .epub-content em {
          font-style: italic;
        }
        .epub-content strong {
          font-weight: 600;
        }
        .epub-content ul,
        .epub-content ol {
          padding-left: 2em;
          margin-bottom: 1em;
        }
        .epub-content li {
          margin-bottom: 0.3em;
        }
      `}</style>
    </div>
  );
}
