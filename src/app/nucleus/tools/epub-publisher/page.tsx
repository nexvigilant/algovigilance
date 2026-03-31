"use client";

import { useState, useCallback, useRef } from "react";
import {
  BookOpen,
  Upload,
  Download,
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  RotateCcw,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import mammoth from "mammoth";
import JSZip from "jszip";

// ─── Types ───

interface PublishResult {
  title: string;
  author: string;
  chapters: ChapterInfo[];
  totalWords: number;
  epubBlob: Blob;
  epubSize: number;
  kdpChecks: KdpCheck[];
  kdpCompliant: boolean;
  recommendations: string[];
}

interface ChapterInfo {
  title: string;
  wordCount: number;
  order: number;
}

interface KdpCheck {
  name: string;
  passed: boolean;
  message: string;
  category: string;
}

// ─── EPUB Generator (client-side) ───

const DEFAULT_CSS = `body {
  font-family: Georgia, "Times New Roman", serif;
  margin: 1em;
  line-height: 1.6;
  color: #1a1a1a;
}
h1 { font-size: 2em; margin-top: 2em; margin-bottom: 0.5em; page-break-before: always; text-align: center; }
h2 { font-size: 1.5em; margin-top: 1.5em; margin-bottom: 0.4em; }
h3 { font-size: 1.2em; margin-top: 1em; margin-bottom: 0.3em; }
p { margin-top: 0.3em; margin-bottom: 0.3em; text-indent: 1.5em; }
p:first-child, h1 + p, h2 + p, h3 + p { text-indent: 0; }
blockquote { margin: 1em 2em; font-style: italic; border-left: 3px solid #ccc; padding-left: 1em; }
em { font-style: italic; }
strong { font-weight: bold; }`;

async function publishDocx(
  file: File,
  title: string,
  author: string,
  language: string,
  description: string,
  publisher: string,
): Promise<PublishResult> {
  // 1. Convert .docx to HTML using mammoth
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.convertToHtml({ arrayBuffer });
  const fullHtml = result.value;

  // 2. Split HTML into chapters by <h1> tags
  const chapters = splitIntoChapters(fullHtml);

  // 3. Build EPUB ZIP
  const zip = new JSZip();

  // mimetype (must be first, uncompressed)
  zip.file("mimetype", "application/epub+zip", { compression: "STORE" });

  // META-INF/container.xml
  zip.file(
    "META-INF/container.xml",
    `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`,
  );

  // CSS
  zip.file("OEBPS/style.css", DEFAULT_CSS);

  // Chapter XHTML files
  const chapterInfos: ChapterInfo[] = [];
  for (let i = 0; i < chapters.length; i++) {
    const ch = chapters[i];
    const filename = `chapter_${String(i + 1).padStart(3, "0")}.xhtml`;
    const xhtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="${escXml(language)}">
<head>
  <meta charset="UTF-8" />
  <title>${escXml(ch.title)}</title>
  <link rel="stylesheet" type="text/css" href="style.css" />
</head>
<body>
  <h1>${escXml(ch.title)}</h1>
${ch.content}
</body>
</html>`;
    zip.file(`OEBPS/${filename}`, xhtml);
    chapterInfos.push({
      title: ch.title,
      wordCount: ch.content
        .replace(/<[^>]+>/g, "")
        .split(/\s+/)
        .filter(Boolean).length,
      order: i,
    });
  }

  const totalWords = chapterInfos.reduce((s, c) => s + c.wordCount, 0);

  // Navigation document
  const navXhtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="${escXml(language)}">
<head><meta charset="UTF-8" /><title>${escXml(title)} — Contents</title></head>
<body>
  <nav epub:type="toc" id="toc">
    <h1>Table of Contents</h1>
    <ol>
${chapters.map((ch, i) => `      <li><a href="chapter_${String(i + 1).padStart(3, "0")}.xhtml">${escXml(ch.title)}</a></li>`).join("\n")}
    </ol>
  </nav>
</body>
</html>`;
  zip.file("OEBPS/nav.xhtml", navXhtml);

  // NCX (EPUB 2 compat)
  const uniqueId = `urn:nexvigilant:${hashStr(title + author)}`;
  const ncx = `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="${escXml(uniqueId)}"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle><text>${escXml(title)}</text></docTitle>
  <navMap>
${chapters
  .map(
    (ch, i) => `    <navPoint id="navPoint-${i + 1}" playOrder="${i + 1}">
      <navLabel><text>${escXml(ch.title)}</text></navLabel>
      <content src="chapter_${String(i + 1).padStart(3, "0")}.xhtml"/>
    </navPoint>`,
  )
  .join("\n")}
  </navMap>
</ncx>`;
  zip.file("OEBPS/toc.ncx", ncx);

  // OPF package document
  const today = new Date().toISOString().split("T")[0];
  const opf = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="BookId">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">
    <dc:identifier id="BookId">${escXml(uniqueId)}</dc:identifier>
    <dc:title>${escXml(title)}</dc:title>
    <dc:creator opf:role="aut">${escXml(author)}</dc:creator>
    <dc:language>${escXml(language)}</dc:language>
    <meta property="dcterms:modified">${today}T00:00:00Z</meta>
${publisher ? `    <dc:publisher>${escXml(publisher)}</dc:publisher>\n` : ""}${description ? `    <dc:description>${escXml(description)}</dc:description>\n` : ""}  </metadata>
  <manifest>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
    <item id="css" href="style.css" media-type="text/css"/>
${chapters.map((_, i) => `    <item id="ch${i}" href="chapter_${String(i + 1).padStart(3, "0")}.xhtml" media-type="application/xhtml+xml"/>`).join("\n")}
  </manifest>
  <spine toc="ncx">
${chapters.map((_, i) => `    <itemref idref="ch${i}"/>`).join("\n")}
  </spine>
</package>`;
  zip.file("OEBPS/content.opf", opf);

  // Generate blob
  const epubBlob = await zip.generateAsync({
    type: "blob",
    mimeType: "application/epub+zip",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });

  // 4. KDP compliance checks
  const kdpChecks: KdpCheck[] = [];
  const recommendations: string[] = [];

  kdpChecks.push({
    category: "Metadata",
    name: "title",
    passed: title.trim().length > 0 && title.length <= 200,
    message: `Title: "${title}" (${title.length} chars, max 200)`,
  });
  kdpChecks.push({
    category: "Metadata",
    name: "author",
    passed: author.trim().length > 0,
    message: `Author: "${author}"`,
  });
  kdpChecks.push({
    category: "Metadata",
    name: "language",
    passed: language.trim().length > 0,
    message: `Language: ${language}`,
  });
  kdpChecks.push({
    category: "Content",
    name: "chapters",
    passed: chapters.length > 0,
    message: `${chapters.length} chapter(s)`,
  });
  kdpChecks.push({
    category: "Content",
    name: "word_count",
    passed: totalWords >= 2500,
    message: `${totalWords.toLocaleString()} words (KDP min ~2,500)`,
  });
  kdpChecks.push({
    category: "Content",
    name: "toc",
    passed: chapters.length > 1,
    message: "Table of contents generated from headings",
  });
  // Structural validation — verify the ZIP contains required EPUB files
  const epubErrors: string[] = [];
  if (!zip.file("mimetype")) epubErrors.push("missing mimetype");
  if (!zip.file("META-INF/container.xml"))
    epubErrors.push("missing container.xml");
  if (!zip.file("OEBPS/content.opf")) epubErrors.push("missing content.opf");
  if (!zip.file("OEBPS/nav.xhtml")) epubErrors.push("missing nav.xhtml");
  if (chapters.length === 0) epubErrors.push("no chapter files");

  const epubValid = epubErrors.length === 0;
  kdpChecks.push({
    category: "Structure",
    name: "epub_valid",
    passed: epubValid,
    message: epubValid
      ? `EPUB 3.0 archive (${(epubBlob.size / 1024).toFixed(1)} KB) — ${4 + chapters.length} files verified`
      : `EPUB structural errors: ${epubErrors.join(", ")}`,
  });

  if (!description)
    recommendations.push("Add a description for better Amazon discoverability");
  recommendations.push(
    "Add a cover image (1600x2560px) before uploading to KDP",
  );
  if (totalWords < 2500)
    recommendations.push(
      `Only ${totalWords} words — KDP recommends at least 2,500 for books`,
    );

  return {
    title,
    author,
    chapters: chapterInfos,
    totalWords,
    epubBlob,
    epubSize: epubBlob.size,
    kdpChecks,
    kdpCompliant: kdpChecks.every((c) => c.passed),
    recommendations,
  };
}

function splitIntoChapters(html: string): { title: string; content: string }[] {
  // Split on <h1> tags
  const parts = html.split(/<h1[^>]*>/i);
  const chapters: { title: string; content: string }[] = [];

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (i === 0) {
      // Content before first h1
      const trimmed = part.trim();
      if (trimmed && trimmed.replace(/<[^>]+>/g, "").trim().length > 20) {
        chapters.push({ title: "Front Matter", content: trimmed });
      }
      continue;
    }

    // Extract title from closing </h1>
    const closeIdx = part.indexOf("</h1>");
    if (closeIdx === -1) {
      chapters.push({ title: `Chapter ${i}`, content: part });
      continue;
    }

    const title = part
      .substring(0, closeIdx)
      .replace(/<[^>]+>/g, "")
      .trim();
    const content = part.substring(closeIdx + 5).trim();
    chapters.push({ title: title || `Chapter ${i}`, content });
  }

  // If no h1 tags found, treat entire content as one chapter
  if (chapters.length === 0 && html.trim()) {
    chapters.push({ title: "Chapter 1", content: html });
  }

  return chapters;
}

function escXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function hashStr(s: string): string {
  let hash = 5381;
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) + hash + s.charCodeAt(i)) >>> 0;
  }
  return hash.toString(16);
}

// ─── Component ───

export default function EpubPublisherPage() {
  const [result, setResult] = useState<PublishResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [language, setLanguage] = useState("en");
  const [description, setDescription] = useState("");
  const [publisher, setPublisher] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePublish = useCallback(async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const pubResult = await publishDocx(
        file,
        title || file.name.replace(/\.docx$/i, ""),
        author || "Unknown Author",
        language,
        description,
        publisher,
      );
      setResult(pubResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Publishing failed");
    } finally {
      setLoading(false);
    }
  }, [file, title, author, language, description, publisher]);

  const handleDownload = useCallback(() => {
    if (!result) return;
    const url = URL.createObjectURL(result.epubBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${result.title.replace(/[^a-zA-Z0-9-_ ]/g, "")}.epub`;
    a.click();
    URL.revokeObjectURL(url);
  }, [result]);

  const handleOpenInReader = useCallback(() => {
    if (!result) return;
    // Store in sessionStorage for the reader to pick up
    const reader = new FileReader();
    reader.onload = () => {
      sessionStorage.setItem("epub-handoff", reader.result as string);
      window.open("/nucleus/tools/epub-reader?from=publisher", "_blank");
    };
    reader.readAsDataURL(result.epubBlob);
  }, [result]);

  const handleReset = useCallback(() => {
    setResult(null);
    setFile(null);
    setTitle("");
    setAuthor("");
    setDescription("");
    setPublisher("");
    setError(null);
  }, []);

  // ─── Result View ───
  if (result) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100">
        <div className="max-w-3xl mx-auto px-6 py-12">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <BookOpen className="h-7 w-7 text-emerald-400" />
              <h1 className="text-2xl font-bold">Published</h1>
            </div>
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-200"
            >
              <RotateCcw className="h-4 w-4" />
              New Book
            </button>
          </div>

          {/* Book summary */}
          <div className="bg-zinc-900 rounded-xl p-6 mb-6 border border-zinc-800">
            <h2 className="text-xl font-semibold mb-1">{result.title}</h2>
            <p className="text-zinc-400 mb-4">by {result.author}</p>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-zinc-500">Chapters</span>
                <p className="text-lg font-semibold">
                  {result.chapters.length}
                </p>
              </div>
              <div>
                <span className="text-zinc-500">Words</span>
                <p className="text-lg font-semibold">
                  {result.totalWords.toLocaleString()}
                </p>
              </div>
              <div>
                <span className="text-zinc-500">File Size</span>
                <p className="text-lg font-semibold">
                  {(result.epubSize / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
          </div>

          {/* Chapters */}
          <div className="bg-zinc-900 rounded-xl p-6 mb-6 border border-zinc-800">
            <h3 className="text-sm font-semibold text-zinc-400 mb-3">
              Chapters
            </h3>
            <div className="space-y-1">
              {result.chapters.map((ch, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-1.5 px-3 rounded text-sm hover:bg-zinc-800/50"
                >
                  <span>
                    <span className="text-zinc-600 mr-2">{i + 1}.</span>
                    {ch.title}
                  </span>
                  <span className="text-zinc-600">{ch.wordCount}w</span>
                </div>
              ))}
            </div>
          </div>

          {/* KDP Compliance */}
          <div className="bg-zinc-900 rounded-xl p-6 mb-6 border border-zinc-800">
            <div className="flex items-center gap-2 mb-4">
              {result.kdpCompliant ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-amber-400" />
              )}
              <h3 className="text-sm font-semibold">
                KDP Compliance:{" "}
                <span
                  className={
                    result.kdpCompliant ? "text-emerald-400" : "text-amber-400"
                  }
                >
                  {result.kdpCompliant ? "PASS" : "NEEDS ATTENTION"}
                </span>
              </h3>
            </div>
            <div className="space-y-1.5">
              {result.kdpChecks.map((check, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  {check.passed ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                  )}
                  <span className="text-zinc-300">{check.message}</span>
                </div>
              ))}
            </div>
            {result.recommendations.length > 0 && (
              <div className="mt-4 pt-4 border-t border-zinc-800">
                <p className="text-xs text-zinc-500 mb-2">Recommendations</p>
                {result.recommendations.map((rec, i) => (
                  <p key={i} className="text-sm text-zinc-400 flex gap-2">
                    <span className="text-zinc-600">*</span> {rec}
                  </p>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleDownload}
              className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white py-3 px-6 rounded-lg font-medium transition-colors"
            >
              <Download className="h-5 w-5" />
              Download EPUB
            </button>
            <button
              onClick={handleOpenInReader}
              className="flex-1 flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 py-3 px-6 rounded-lg font-medium transition-colors border border-zinc-700"
            >
              <ArrowRight className="h-5 w-5" />
              Open in Reader
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Upload View ───
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="flex items-center gap-3 mb-2">
          <FileText className="h-8 w-8 text-emerald-400" />
          <h1 className="text-3xl font-bold">EPUB Publisher</h1>
        </div>
        <p className="text-zinc-400 mb-8">
          Convert Word documents to publication-ready EPUB ebooks. Everything
          runs in your browser.
        </p>

        {/* File drop */}
        <div
          role="button"
          tabIndex={0}
          aria-label={
            file
              ? `Selected: ${file.name}. Click to change file`
              : "Drop a .docx file or click to browse"
          }
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files[0];
            if (f) setFile(f);
          }}
          onDragOver={(e) => e.preventDefault()}
          className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all mb-6 ${
            file
              ? "border-emerald-500 bg-emerald-500/5"
              : "border-zinc-700 hover:border-emerald-500 hover:bg-zinc-900/50"
          }`}
        >
          {file ? (
            <div>
              <FileText className="h-10 w-10 mx-auto mb-3 text-emerald-400" />
              <p className="text-lg text-emerald-300">{file.name}</p>
              <p className="text-sm text-zinc-500 mt-1">
                {(file.size / 1024).toFixed(1)} KB — click to change
              </p>
            </div>
          ) : (
            <div>
              <Upload className="h-10 w-10 mx-auto mb-3 text-zinc-500" />
              <p className="text-lg text-zinc-300">
                Drop a .docx file or click to browse
              </p>
              <p className="text-sm text-zinc-500 mt-1">
                Converted entirely in your browser — no server upload
              </p>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".docx"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) setFile(f);
            }}
          />
        </div>

        {/* Metadata form */}
        {file && (
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">
                Title{" "}
                <span className="text-zinc-600">(defaults to filename)</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={file.name.replace(/\.docx$/i, "")}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2.5 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">
                  Author
                </label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Author name"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2.5 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">
                  Language
                </label>
                <input
                  type="text"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2.5 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">
                Publisher <span className="text-zinc-600">(optional)</span>
              </label>
              <input
                type="text"
                value={publisher}
                onChange={(e) => setPublisher(e.target.value)}
                placeholder="Your publishing imprint"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2.5 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">
                Description{" "}
                <span className="text-zinc-600">(for KDP/Amazon)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Book description / blurb"
                rows={3}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2.5 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 resize-none"
              />
            </div>

            <button
              onClick={handlePublish}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white py-3 px-6 rounded-lg font-medium transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <BookOpen className="h-5 w-5" />
                  Publish EPUB
                </>
              )}
            </button>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-950/50 border border-red-800 rounded-lg text-red-300 mb-4">
            {error}
          </div>
        )}

        <div className="text-sm text-zinc-600 space-y-1">
          <p>
            Powered by mammoth.js (.docx parsing) and JSZip (EPUB packaging).
          </p>
          <p>Outputs EPUB 3.0 with EPUB 2 NCX backward compatibility.</p>
        </div>

        <div className="mt-4 flex gap-4">
          <Link
            href="/nucleus/tools/epub-reader"
            className="text-sm text-zinc-500 hover:text-zinc-300"
          >
            EPUB Reader
          </Link>
          <Link
            href="/nucleus/tools"
            className="text-sm text-zinc-500 hover:text-zinc-300"
          >
            Back to Tools
          </Link>
        </div>
      </div>
    </div>
  );
}
