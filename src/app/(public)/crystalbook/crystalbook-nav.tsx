"use client";

import { useState, useEffect } from "react";
import { Menu, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { CRYSTALBOOK_NAV_ITEMS } from "@/data/crystalbook";

function NavContent({
  activeSection,
  passedSections,
  scrollProgress,
  onNavigate,
}: {
  activeSection: string;
  passedSections: Set<string>;
  scrollProgress: number;
  onNavigate?: () => void;
}) {
  const activeIndex = CRYSTALBOOK_NAV_ITEMS.findIndex(
    (item) => item.id === activeSection,
  );

  return (
    <nav className="relative" aria-label="Crystalbook navigation">
      {/* Header with progress */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-slate-dim uppercase tracking-wider mb-2">
          The Crystalbook
        </h2>
        <div className="flex items-center gap-3">
          <Progress value={scrollProgress} className="h-1" />
          <span className="text-xs text-slate-dim tabular-nums">
            {Math.round(scrollProgress)}%
          </span>
        </div>
      </div>

      {/* Vertical progress line */}
      <div className="absolute left-[7px] top-[72px] bottom-2 w-0.5 bg-nex-surface rounded-full overflow-hidden">
        <div
          className="w-full bg-gradient-to-b from-cyan to-cyan-glow transition-all duration-300"
          style={{
            height: `${((activeIndex + 1) / CRYSTALBOOK_NAV_ITEMS.length) * 100}%`,
          }}
        />
      </div>

      {/* Nav items */}
      <div className="space-y-1 relative">
        {CRYSTALBOOK_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          const isPassed = passedSections.has(item.id) && !isActive;

          return (
            <a
              key={item.id}
              href={`#${item.id}`}
              title={item.num ? `${item.num}: ${item.title}` : item.title}
              aria-current={isActive ? "true" : undefined}
              onClick={(e) => {
                e.preventDefault();
                document
                  .getElementById(item.id)
                  ?.scrollIntoView({ behavior: "smooth" });
                onNavigate?.();
              }}
              className={cn(
                "flex items-center gap-3 pl-6 pr-3 py-2.5 rounded-md text-sm transition-all relative",
                "hover:bg-nex-surface hover:text-slate-light",
                isActive && "bg-cyan/10 text-cyan font-medium",
                isPassed && "text-slate-light",
                !isActive && !isPassed && "text-slate-dim",
              )}
            >
              {/* Progress node */}
              <div
                className={cn(
                  "absolute left-0 w-3.5 h-3.5 rounded-full border-2 transition-all flex items-center justify-center",
                  isActive && "bg-cyan border-cyan shadow-glow-cyan",
                  isPassed && "bg-nex-surface border-cyan",
                  !isActive && !isPassed && "bg-nex-dark border-nex-light",
                )}
              >
                {isPassed && <Check className="h-2 w-2 text-cyan" />}
              </div>

              <Icon
                className={cn(
                  "h-4 w-4 flex-shrink-0",
                  isActive && "text-cyan",
                  isPassed && "text-cyan/70",
                )}
              />
              <div className="flex-1 min-w-0">
                <span className="line-clamp-1">{item.title}</span>
                {item.num && (
                  <span
                    className={cn(
                      "text-xs",
                      isActive ? "text-cyan/70" : "text-slate-dim",
                    )}
                  >
                    {item.num}
                  </span>
                )}
              </div>
            </a>
          );
        })}
      </div>
    </nav>
  );
}

export function CrystalbookNav() {
  const [activeSection, setActiveSection] = useState("law-i");
  const [passedSections, setPassedSections] = useState<Set<string>>(new Set());
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isNearFooter, setIsNearFooter] = useState(false);

  // Track scroll progress and footer proximity
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      setScrollProgress(Math.min(100, Math.max(0, progress)));

      const distanceFromBottom = docHeight - scrollTop;
      setIsNearFooter(progress > 92 || distanceFromBottom < 300);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Track active section via IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const currentId = entry.target.id;
            setActiveSection(currentId);

            const currentIndex = CRYSTALBOOK_NAV_ITEMS.findIndex(
              (item) => item.id === currentId,
            );
            if (currentIndex > 0) {
              setPassedSections((prev) => {
                const newPassed = new Set(prev);
                for (let i = 0; i < currentIndex; i++) {
                  newPassed.add(CRYSTALBOOK_NAV_ITEMS[i].id);
                }
                return newPassed;
              });
            }
          }
        });
      },
      { rootMargin: "-20% 0px -70% 0px" },
    );

    CRYSTALBOOK_NAV_ITEMS.forEach((item) => {
      const element = document.getElementById(item.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <>
      {/* Mobile Navigation */}
      <div className="lg:hidden fixed top-28 right-4 z-50">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="shadow-lg border-cyan text-cyan hover:shadow-glow-cyan hover:bg-cyan/10"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Open navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] sm:w-[320px]">
            <div className="mt-6">
              <NavContent
                activeSection={activeSection}
                passedSections={passedSections}
                scrollProgress={scrollProgress}
                onNavigate={() => setMobileOpen(false)}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Navigation */}
      <aside
        className={cn(
          "hidden lg:block fixed top-[500px] w-[220px] bg-nex-deep/95 backdrop-blur-sm rounded-lg p-4 border border-nex-light/10 transition-opacity duration-300",
          isNearFooter && "opacity-0 pointer-events-none",
        )}
        style={{ left: "max(1rem, calc((100vw - 1280px) / 2 + 1rem))" }}
      >
        <ScrollArea className="h-[calc(100vh-10rem)]">
          <NavContent
            activeSection={activeSection}
            passedSections={passedSections}
            scrollProgress={scrollProgress}
          />
        </ScrollArea>
      </aside>
    </>
  );
}
