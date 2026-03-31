"use client";

import { BookOpen } from "lucide-react";
import { PageHero } from "@/components/marketing";
import { CRYSTALBOOK_METADATA } from "@/data/crystalbook";

export function CrystalbookHero() {
  return (
    <PageHero
      title="The Crystalbook"
      icon={
        <BookOpen
          className="w-10 h-10 md:w-12 md:h-12 text-cyan"
          aria-hidden="true"
        />
      }
    >
      <p className="text-sm text-slate-dim text-center mt-4">
        Eight Laws of System Homeostasis &middot; v
        {CRYSTALBOOK_METADATA.version} &middot; Founded{" "}
        {CRYSTALBOOK_METADATA.founded}
      </p>
      <p className="text-xs text-slate-dim text-center mt-1">
        By {CRYSTALBOOK_METADATA.author}
      </p>
    </PageHero>
  );
}
