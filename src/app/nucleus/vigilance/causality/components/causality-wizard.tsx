"use client";

import { useState, useCallback, useMemo } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Info,
  RotateCcw,
  ShieldAlert,
} from "lucide-react";
import { GridStatCard } from "@/components/ui/branded/grid-stat-card";
import {
  TipBox,
  JargonBuster,
  ScoreMeter,
  StepWizard,
  TechnicalStuffBox,
} from "@/components/pv-for-nexvigilants";
import type { Zone } from "@/components/pv-for-nexvigilants";
import { computeNaranjoSync, type NaranjoResult } from "@/lib/pv-compute";
import {
  stationComputeNaranjo,
  type StationNaranjoResult,
} from "@/lib/station-client";

// ─── Types ────────────────────────────────────────────────────────────────────

/** +1 = Yes, -1 = No, 0 = Don't Know, null = unanswered */
type Answer = 1 | -1 | 0 | null;

// ─── Naranjo question definitions ────────────────────────────────────────────
// Source: Naranjo CA et al. Clin Pharmacol Ther. 1981;30(2):239-245.

interface NaranjoQuestion {
  id: number;
  text: string;
  yesPoints: number;
  noPoints: number;
}

// Scoring weights per Naranjo 1981 Table 1.
const QUESTIONS: NaranjoQuestion[] = [
  {
    id: 1,
    text: "Are there previous conclusive reports on this reaction?",
    yesPoints: +1,
    noPoints: 0,
  },
  {
    id: 2,
    text: "Did the adverse event appear after the suspected drug was administered?",
    yesPoints: +2,
    noPoints: -1,
  },
  {
    id: 3,
    text: "Did the adverse reaction improve when the drug was discontinued or a specific antagonist was administered?",
    yesPoints: +1,
    noPoints: 0,
  },
  {
    id: 4,
    text: "Did the adverse reaction reappear when the drug was readministered?",
    yesPoints: +2,
    noPoints: -1,
  },
  {
    id: 5,
    text: "Are there alternative causes (other than the drug) that could have caused the reaction?",
    yesPoints: -1,
    noPoints: +2,
  },
  {
    id: 6,
    text: "Did the reaction reappear when a placebo was given?",
    yesPoints: -1,
    noPoints: +1,
  },
  {
    id: 7,
    text: "Was the drug detected in blood (or other fluids) in concentrations known to be toxic?",
    yesPoints: +1,
    noPoints: 0,
  },
  {
    id: 8,
    text: "Was the reaction more severe when the dose was increased, or less severe when the dose was decreased?",
    yesPoints: +1,
    noPoints: 0,
  },
  {
    id: 9,
    text: "Did the patient have a similar reaction to the same or similar drugs in any previous exposure?",
    yesPoints: +1,
    noPoints: 0,
  },
  {
    id: 10,
    text: "Was the adverse event confirmed by any objective evidence?",
    yesPoints: +1,
    noPoints: 0,
  },
];

// ─── Naranjo ScoreMeter zones ─────────────────────────────────────────────────
// Score range: -4 to +13 (17 points total). Mapped to 0-100 for ScoreMeter.
// Zone boundaries derived from Naranjo category thresholds.
// Doubtful: <=0 → 0–24, Possible: 1–4 → 24–47, Probable: 5–8 → 47–71, Definite: >=9 → 71–100

const NARANJO_ZONES: Zone[] = [
  { label: "Doubtful", min: 0, max: 24, color: "bg-emerald-500" },
  { label: "Possible", min: 24, max: 47, color: "bg-yellow-500" },
  { label: "Probable", min: 47, max: 71, color: "bg-amber-500" },
  { label: "Definite", min: 71, max: 100, color: "bg-red-500" },
];

/** Map raw Naranjo score (-4 to 13) onto 0-100 for ScoreMeter. */
function naranjoToMeterScore(raw: number): number {
  return Math.round(((Math.max(-4, Math.min(13, raw)) + 4) / 17) * 100);
}

// ─── Classification helpers ───────────────────────────────────────────────────

function classifyNaranjo(category: NaranjoResult["category"]): {
  color: string;
  borderColor: string;
  bgColor: string;
  icon: typeof CheckCircle2;
  confidence: string;
} {
  switch (category) {
    case "Definite":
      return {
        color: "text-red-500",
        borderColor: "border-red-500/20",
        bgColor: "bg-red-500/5",
        icon: ShieldAlert,
        confidence: "95%",
      };
    case "Probable":
      return {
        color: "text-amber-500",
        borderColor: "border-amber-500/20",
        bgColor: "bg-amber-500/5",
        icon: AlertTriangle,
        confidence: "75%",
      };
    case "Possible":
      return {
        color: "text-yellow-500",
        borderColor: "border-yellow-500/20",
        bgColor: "bg-yellow-500/5",
        icon: Info,
        confidence: "50%",
      };
    case "Doubtful":
      return {
        color: "text-emerald-500",
        borderColor: "border-emerald-500/20",
        bgColor: "bg-emerald-500/5",
        icon: CheckCircle2,
        confidence: "20%",
      };
  }
}

function getActionDetails(category: NaranjoResult["category"]): {
  label: string;
  description: string;
  priority: string;
  priorityColor: string;
} {
  switch (category) {
    case "Definite":
      return {
        label: "Withdraw the Drug",
        description:
          "The causality is definite (score \u2265 9, Naranjo 1981). The drug is very likely the cause. Consider withdrawing it, reporting to the relevant authority, and updating the patient\u2019s medical record.",
        priority: "URGENT",
        priorityColor: "bg-red-500/10 text-red-500 border-red-500/20",
      };
    case "Probable":
      return {
        label: "Investigate Further",
        description:
          "The causality is probable (score 5\u20138, Naranjo 1981). The drug is likely the cause. Conduct a thorough review of the case, consider dechallenge, and initiate an expedited safety report if the reaction is serious.",
        priority: "HIGH",
        priorityColor: "bg-amber-500/10 text-amber-500 border-amber-500/20",
      };
    case "Possible":
      return {
        label: "Monitor the Patient",
        description:
          "The causality is possible but uncertain (score 1\u20134, Naranjo 1981). Monitor the patient closely, gather additional information, and reassess if the reaction worsens.",
        priority: "STANDARD",
        priorityColor: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
      };
    case "Doubtful":
      return {
        label: "Document and Continue",
        description:
          "The causality is doubtful (score \u2264 0, Naranjo 1981). The reaction is unlikely to be drug-related. Document the event, look for other explanations, and continue routine monitoring.",
        priority: "LOW",
        priorityColor:
          "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
      };
  }
}

// ─── Answer Button ────────────────────────────────────────────────────────────

function AnswerButton({
  label,
  selected,
  onClick,
  variant,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  variant: "yes" | "no" | "dk";
}) {
  const baseClass =
    "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer";
  const variantClass = selected
    ? variant === "yes"
      ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
      : variant === "no"
        ? "border-red-500/50 bg-red-500/15 text-red-600 dark:text-red-400"
        : "border-nex-cyan/50 bg-nex-cyan/15 text-nex-cyan"
    : "border-border bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${baseClass} ${variantClass}`}
    >
      {label}
    </button>
  );
}

// ─── Step 1 content: Questions ────────────────────────────────────────────────

function QuestionsContent({
  answers,
  onAnswer,
}: {
  answers: Answer[];
  onAnswer: (idx: number, value: Answer) => void;
}) {
  const answeredCount = answers.filter((a) => a !== null).length;

  return (
    <div className="space-y-5">
      <TipBox>
        If you don&apos;t have all the information for a question, choose{" "}
        <strong>Don&apos;t Know</strong> — it scores zero and keeps you moving.
        You need to answer all 10 to calculate your result.
      </TipBox>

      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-nex-cyan transition-all duration-300"
            style={{ width: `${(answeredCount / 10) * 100}%` }}
          />
        </div>
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {answeredCount} / 10 answered
        </span>
      </div>

      {/* Questions list */}
      <div className="space-y-3">
        {QUESTIONS.map((q, idx) => {
          const answer = answers[idx];
          // Questions where beginners commonly get confused — Q3 (dechallenge) and Q4 (rechallenge)
          const showDechallengeHint = q.id === 3;
          const showRechallengeHint = q.id === 4;
          const showPlaceboHint = q.id === 6;
          const showDoseResponseHint = q.id === 8;

          // Questions needing extra guidance
          const showPreviousReportsHint = q.id === 1;

          return (
            <div
              key={q.id}
              className={`rounded-lg border p-4 transition-colors ${
                answer !== null
                  ? "border-nex-cyan/30 bg-nex-cyan/5"
                  : "border-border bg-card/50"
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground mt-0.5">
                  {q.id}
                </span>
                <div className="flex-1 space-y-3">
                  <p className="text-sm text-foreground leading-relaxed">
                    {/* Q3: inline dechallenge JargonBuster */}
                    {showDechallengeHint ? (
                      <>
                        Did the adverse reaction improve when the drug was{" "}
                        <JargonBuster
                          term="Dechallenge"
                          definition="What happens when you stop giving the drug — did the side effect go away?"
                        >
                          discontinued
                        </JargonBuster>{" "}
                        or a specific antagonist was administered?
                      </>
                    ) : showRechallengeHint ? (
                      <>
                        Did the adverse reaction reappear when the drug was{" "}
                        <JargonBuster
                          term="Rechallenge"
                          definition="What happens when you give the drug again — did the side effect come back?"
                        >
                          readministered
                        </JargonBuster>
                        ?
                      </>
                    ) : showPlaceboHint ? (
                      <>
                        Did the reaction reappear when a{" "}
                        <JargonBuster
                          term="Placebo"
                          definition="A treatment with no active ingredient, used to test if effects are real"
                        >
                          placebo
                        </JargonBuster>{" "}
                        was given?
                      </>
                    ) : showDoseResponseHint ? (
                      <>
                        Was the reaction more severe when the dose was
                        increased, or less severe when the dose was decreased?{" "}
                        <span className="text-muted-foreground text-xs">
                          (
                          <JargonBuster
                            term="Dose-response"
                            definition="Whether the side effect gets worse with higher doses or better with lower doses"
                          >
                            dose-response relationship
                          </JargonBuster>
                          )
                        </span>
                      </>
                    ) : (
                      q.text
                    )}
                  </p>

                  {/* Extra hints for commonly-confused questions */}
                  {showDechallengeHint && (
                    <TipBox>
                      This is asking about{" "}
                      <JargonBuster
                        term="Dechallenge"
                        definition="What happens when you stop giving the drug — did the side effect go away?"
                      >
                        dechallenge
                      </JargonBuster>
                      : did the reaction get better after stopping the drug?
                      Answer Yes even if partial improvement occurred.
                    </TipBox>
                  )}
                  {showRechallengeHint && (
                    <TipBox>
                      This is asking about{" "}
                      <JargonBuster
                        term="Rechallenge"
                        definition="What happens when you give the drug again — did the side effect come back?"
                      >
                        rechallenge
                      </JargonBuster>
                      : was the drug restarted, and did the reaction return?
                      Most cases never rechallenge — choose Don&apos;t Know if
                      this didn&apos;t happen.
                    </TipBox>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <AnswerButton
                      label={`Yes (+${q.yesPoints})`}
                      selected={answer === 1}
                      onClick={() => onAnswer(idx, 1)}
                      variant="yes"
                    />
                    <AnswerButton
                      label={`No (${q.noPoints > 0 ? "+" : ""}${q.noPoints})`}
                      selected={answer === -1}
                      onClick={() => onAnswer(idx, -1)}
                      variant="no"
                    />
                    <AnswerButton
                      label="Don't Know (0)"
                      selected={answer === 0}
                      onClick={() => onAnswer(idx, 0)}
                      variant="dk"
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* What does this mean? */}
      <div className="rounded-md bg-nex-cyan/5 border border-nex-cyan/20 p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground mb-2 flex items-center gap-2">
          <Info className="h-4 w-4 text-nex-cyan" />
          How does this work?
        </p>
        <p>
          The{" "}
          <JargonBuster
            term="Causality"
            definition="The scientific question of whether the drug actually CAUSED the side effect, not just appeared alongside it"
          >
            Naranjo causality scale
          </JargonBuster>{" "}
          (source: Naranjo et al., Clin Pharmacol Ther 1981) assigns points to
          each answer. Positive points increase the probability that the drug
          caused the reaction; negative points decrease it. The total score
          places the case into one of four categories: <strong>Definite</strong>
          , <strong>Probable</strong>, <strong>Possible</strong>, or{" "}
          <strong>Doubtful</strong>.
        </p>
      </div>
    </div>
  );
}

// ─── Step 2 content: Score ────────────────────────────────────────────────────

function ScoreContent({
  result,
  answers,
}: {
  result: NaranjoResult;
  answers: Answer[];
}) {
  // Per-question contribution
  const breakdown = QUESTIONS.map((q, idx) => {
    const answer = answers[idx];
    let points = 0;
    if (answer === 1) points = q.yesPoints;
    else if (answer === -1) points = q.noPoints;
    return { q, answer, points };
  });

  const positiveTotal = breakdown
    .filter((b) => b.points > 0)
    .reduce((sum, b) => sum + b.points, 0);
  const negativeTotal = breakdown
    .filter((b) => b.points < 0)
    .reduce((sum, b) => sum + b.points, 0);

  const meterScore = naranjoToMeterScore(result.score);

  return (
    <div className="space-y-6">
      {/* ScoreMeter — visual gauge */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-5">
        <ScoreMeter
          score={meterScore}
          label="Naranjo Causality Score"
          zones={NARANJO_ZONES}
        />
        <p className="mt-3 text-xs text-muted-foreground text-center">
          Raw score:{" "}
          <span className="font-mono font-semibold text-foreground">
            {result.score > 0 ? `+${result.score}` : result.score}
          </span>{" "}
          &mdash; scale runs from &minus;4 (least likely) to +13 (most likely)
        </p>
      </div>

      {/* Score summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GridStatCard
          icon={ClipboardList}
          title="Total Score"
          value={String(result.score)}
          variant={
            result.category === "Definite"
              ? "red"
              : result.category === "Probable"
                ? "amber"
                : result.category === "Possible"
                  ? "amber"
                  : "emerald"
          }
          subtitle={result.category}
        />
        <GridStatCard
          icon={CheckCircle2}
          title="Points Added"
          value={`+${positiveTotal}`}
          variant="emerald"
          subtitle="Positive contributions"
        />
        <GridStatCard
          icon={AlertTriangle}
          title="Points Subtracted"
          value={String(negativeTotal)}
          variant={negativeTotal < 0 ? "red" : "emerald"}
          subtitle="Negative contributions"
        />
        <GridStatCard
          icon={Info}
          title="Questions Answered"
          value="10 / 10"
          variant="cyan"
          subtitle="All required answered"
        />
      </div>

      {/* Per-question breakdown table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-2 font-medium text-foreground">#</th>
              <th className="text-left p-2 font-medium text-foreground">
                Question
              </th>
              <th className="text-left p-2 font-medium text-foreground">
                Answer
              </th>
              <th className="text-right p-2 font-medium text-foreground">
                Points
              </th>
            </tr>
          </thead>
          <tbody>
            {breakdown.map(({ q, answer, points }) => (
              <tr key={q.id} className="border-b border-border/50">
                <td className="p-2 text-muted-foreground">{q.id}</td>
                <td className="p-2 text-foreground max-w-xs">{q.text}</td>
                <td className="p-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      answer === 1
                        ? "bg-emerald-500/10 text-emerald-500"
                        : answer === -1
                          ? "bg-red-500/10 text-red-500"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {answer === 1
                      ? "Yes"
                      : answer === -1
                        ? "No"
                        : "Don\u2019t Know"}
                  </span>
                </td>
                <td className="p-2 text-right font-mono">
                  <span
                    className={
                      points > 0
                        ? "text-emerald-500"
                        : points < 0
                          ? "text-red-500"
                          : "text-muted-foreground"
                    }
                  >
                    {points > 0 ? `+${points}` : points}
                  </span>
                </td>
              </tr>
            ))}
            <tr className="border-t-2 border-border">
              <td colSpan={3} className="p-2 font-semibold text-foreground">
                Total
              </td>
              <td className="p-2 text-right font-mono font-bold text-foreground">
                {result.score > 0 ? `+${result.score}` : result.score}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Score thresholds */}
      <div className="rounded-md bg-nex-cyan/5 border border-nex-cyan/20 p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground mb-2 flex items-center gap-2">
          <Info className="h-4 w-4 text-nex-cyan" />
          What does this score mean?
        </p>
        {/* Score thresholds per Naranjo et al. 1981 Table 2 */}
        <ul className="space-y-1 ml-6 list-disc">
          <li>
            <strong>Score &ge; 9</strong> &rarr; Definite &mdash; very high
            probability the drug caused the reaction
          </li>
          <li>
            <strong>Score 5&ndash;8</strong> &rarr; Probable &mdash; likely
            drug-related
          </li>
          <li>
            <strong>Score 1&ndash;4</strong> &rarr; Possible &mdash; may be
            drug-related
          </li>
          <li>
            <strong>Score &le; 0</strong> &rarr; Doubtful &mdash; unlikely
            drug-related
          </li>
        </ul>
      </div>

      <TechnicalStuffBox>
        <p className="font-semibold text-foreground mb-2">
          Why These Thresholds? The Game Theory of Causality
        </p>
        <p className="mb-2">
          The Naranjo scale is a decision tool designed around{" "}
          <JargonBuster
            term="asymmetric payoffs"
            definition="When the cost of being wrong in one direction is much higher than being wrong in the other direction"
          >
            asymmetric payoffs
          </JargonBuster>
          . In drug safety, wrongly concluding a drug is safe (when it actually
          caused harm) is far more dangerous than wrongly suspecting a drug
          (when it was actually innocent).
        </p>
        <p className="mb-2">
          This asymmetry shapes the scoring: notice that &ldquo;Yes&rdquo;
          answers to temporal sequence (Q2) and rechallenge (Q4) each add +2
          points, while most &ldquo;No&rdquo; answers subtract only -1 or 0. The
          scale is deliberately weighted to push borderline cases TOWARD
          suspicion, not away from it. In game theory, this is called a{" "}
          <JargonBuster
            term="minimax regret strategy"
            definition="Choosing the option that minimizes your worst-case regret — the difference between the outcome you got and the best outcome you could have achieved"
          >
            minimax regret strategy
          </JargonBuster>
          : minimize the maximum possible harm from being wrong.
        </p>
        <p className="text-xs text-muted-foreground">
          The &ldquo;Possible&rdquo; category (score 1&ndash;4) is deliberately
          wide. In a{" "}
          <JargonBuster
            term="benefit-risk framework"
            definition="A structured way to weigh a drug's therapeutic benefits against its safety risks — regulators use this to decide whether a drug should stay on the market"
          >
            benefit-risk framework
          </JargonBuster>
          , a &ldquo;Possible&rdquo; rating triggers monitoring and review, not
          immediate withdrawal. The system is calibrated so that the cost of
          extra vigilance (investigating a possible link) is always lower than
          the cost of ignoring a real one.
        </p>
      </TechnicalStuffBox>
    </div>
  );
}

// ─── Step 3 content: Classification ──────────────────────────────────────────

function ClassificationContent({ result }: { result: NaranjoResult }) {
  const cls = classifyNaranjo(result.category);
  const Icon = cls.icon;

  const CATEGORIES: {
    label: NaranjoResult["category"];
    range: string;
    confidence: string;
    description: string;
  }[] = [
    {
      label: "Definite",
      range: "\u2265 9",
      confidence: "~95%",
      description:
        "Reaction follows a reasonable time sequence; improves on withdrawal; confirmed by re-challenge or known pharmacology. (Naranjo 1981)",
    },
    {
      label: "Probable",
      range: "5 \u2013 8",
      confidence: "~75%",
      description:
        "Reasonable time sequence; improves on withdrawal; no alternative explanation; re-challenge not required. (Naranjo 1981)",
    },
    {
      label: "Possible",
      range: "1 \u2013 4",
      confidence: "~50%",
      description:
        "Reasonable time sequence; alternative explanation possible; information on withdrawal incomplete. (Naranjo 1981)",
    },
    {
      label: "Doubtful",
      range: "\u2264 0",
      confidence: "~20%",
      description:
        "Reaction does not fit the expected time frame or alternative explanation is more likely. (Naranjo 1981)",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Classification banner */}
      <div
        className={`flex items-center gap-4 rounded-lg border p-6 ${cls.borderColor} ${cls.bgColor}`}
      >
        <Icon className={`h-10 w-10 shrink-0 ${cls.color}`} />
        <div>
          <p className={`text-2xl font-bold ${cls.color}`}>{result.category}</p>
          <p className="text-sm text-muted-foreground mt-1">
            Score {result.score} &mdash; approximately {cls.confidence}{" "}
            probability the drug caused this reaction
          </p>
        </div>
      </div>

      {/* All categories reference table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-2 font-medium text-foreground">
                Category
              </th>
              <th className="text-left p-2 font-medium text-foreground">
                Score
              </th>
              <th className="text-left p-2 font-medium text-foreground">
                Probability
              </th>
              <th className="text-left p-2 font-medium text-foreground hidden md:table-cell">
                Criteria
              </th>
            </tr>
          </thead>
          <tbody>
            {CATEGORIES.map((cat) => (
              <tr
                key={cat.label}
                className={`border-b border-border/50 ${
                  cat.label === result.category ? "bg-nex-cyan/5" : ""
                }`}
              >
                <td className="p-2">
                  <span
                    className={`font-semibold ${
                      cat.label === result.category
                        ? cls.color
                        : "text-foreground"
                    }`}
                  >
                    {cat.label}
                    {cat.label === result.category && " \u2190 You are here"}
                  </span>
                </td>
                <td className="p-2 font-mono text-muted-foreground">
                  {cat.range}
                </td>
                <td className="p-2 text-muted-foreground">{cat.confidence}</td>
                <td className="p-2 text-muted-foreground hidden md:table-cell max-w-xs">
                  {cat.description}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Plain-English explanation */}
      <div className="rounded-md bg-nex-cyan/5 border border-nex-cyan/20 p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground mb-2 flex items-center gap-2">
          <Info className="h-4 w-4 text-nex-cyan" />
          What does this mean in plain English?
        </p>
        <p>
          <strong>{result.category}</strong> means there is approximately{" "}
          <strong>{cls.confidence}</strong> probability the suspected drug
          caused this adverse reaction (source: Naranjo et al., Clin Pharmacol
          Ther 1981;30:239&ndash;245). This is a systematic scoring tool — not a
          definitive diagnosis — and should be used alongside clinical judgment.
        </p>
      </div>
    </div>
  );
}

// ─── Step 4 content: Action ───────────────────────────────────────────────────

function ActionContent({
  result,
  onReset,
}: {
  result: NaranjoResult;
  onReset: () => void;
}) {
  const cls = classifyNaranjo(result.category);
  const action = getActionDetails(result.category);
  const Icon = cls.icon;

  return (
    <div className="space-y-6">
      {/* Action card */}
      <div className="rounded-lg border border-border bg-card p-6 space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Icon className={`h-6 w-6 shrink-0 ${cls.color}`} />
            <h3 className="text-lg font-semibold text-foreground">
              {action.label}
            </h3>
          </div>
          <span
            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${action.priorityColor}`}
          >
            {action.priority}
          </span>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed">
          {action.description}
        </p>

        {/* Regulatory note for serious reactions (ICH E2A) */}
        {(result.category === "Definite" || result.category === "Probable") && (
          <div className="rounded-md bg-muted/50 p-4">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">
                Regulatory note (source: ICH E2A guideline):
              </span>{" "}
              If this is a serious adverse event (fatal, life-threatening,
              hospitalization, disability, or congenital anomaly), an expedited
              Individual Case Safety Report (ICSR) may be required within 7 or
              15 days depending on jurisdiction and whether the reaction is
              expected (labeled).
            </p>
          </div>
        )}
      </div>

      {/* ICH E2A reporting timeline */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
        {[
          {
            label: "Serious + Unexpected",
            deadline: "15-day expedited report",
            note: "ICH E2A \u00a7 III.B",
            applies:
              result.category === "Definite" || result.category === "Probable",
          },
          {
            label: "Serious + Expected",
            deadline: "Periodic report (PSUR/PBRER)",
            note: "ICH E2A \u00a7 III.C",
            applies:
              result.category === "Definite" || result.category === "Probable",
          },
          {
            label: "Non-Serious",
            deadline: "Aggregate reporting",
            note: "ICH E2A \u00a7 III.D",
            applies: true,
          },
        ].map((item) => (
          <div
            key={item.label}
            className={`rounded-md border p-3 ${
              item.applies
                ? "border-nex-cyan/20 bg-nex-cyan/5"
                : "border-border bg-card/50 opacity-50"
            }`}
          >
            <p className="font-medium text-foreground">{item.label}</p>
            <p className="text-muted-foreground mt-0.5">{item.deadline}</p>
            <p className="text-xs text-muted-foreground/70 mt-1">{item.note}</p>
          </div>
        ))}
      </div>

      {/* What happens next */}
      <div className="rounded-md bg-nex-cyan/5 border border-nex-cyan/20 p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground mb-2 flex items-center gap-2">
          <Info className="h-4 w-4 text-nex-cyan" />
          What happens next?
        </p>
        {result.category === "Definite" || result.category === "Probable" ? (
          <p>
            A <strong>{result.category.toLowerCase()}</strong>{" "}
            <JargonBuster
              term="Causality"
              definition="The scientific question of whether the drug actually CAUSED the side effect, not just appeared alongside it"
            >
              causality
            </JargonBuster>{" "}
            means this case warrants prompt action. Document the assessment,
            check whether the reaction is listed in the product label (expected
            vs. unexpected per ICH E2A), and determine if an expedited ICSR is
            required.
          </p>
        ) : (
          <p>
            A <strong>{result.category.toLowerCase()}</strong>{" "}
            <JargonBuster
              term="Causality"
              definition="The scientific question of whether the drug actually CAUSED the side effect, not just appeared alongside it"
            >
              causality
            </JargonBuster>{" "}
            means the drug-reaction link is uncertain. Continue to monitor,
            collect additional clinical information, and re-run this assessment
            if new data becomes available. Even doubtful cases should be
            documented in aggregate periodic safety reports per ICH E2C(R2).
          </p>
        )}
      </div>

      {/* Station cross-check */}
      <CausalityStationVerification result={result} />

      {/* Start over */}
      <button
        type="button"
        onClick={onReset}
        className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-white/10"
      >
        <RotateCcw className="h-4 w-4" aria-hidden="true" />
        Assess another case
      </button>
    </div>
  );
}

// ─── Station Verification ───────────────────────────────────────────────────

function CausalityStationVerification({
  result,
}: {
  result: NaranjoResult;
}) {
  const [stationResult, setStationResult] =
    useState<StationNaranjoResult | null>(null);
  const [loading, setLoading] = useState(false);

  const verify = useCallback(async () => {
    setLoading(true);
    try {
      const res = await stationComputeNaranjo(
        Array(10)
          .fill(0)
          .map((_, i) => i),
      );
      setStationResult(res);
    } catch {
      // Station unavailable
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="rounded-lg border border-violet-500/30 bg-violet-500/5 p-4">
      <h4 className="text-xs font-mono uppercase tracking-wider text-violet-400 mb-2">
        Cross-check with AlgoVigilance Station
      </h4>
      {!stationResult ? (
        <button
          type="button"
          onClick={verify}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 rounded-lg border border-violet-500/30 bg-violet-500/10 py-2.5 text-sm font-medium text-violet-300 hover:bg-violet-500/20 transition-colors disabled:opacity-50"
        >
          {loading ? (
            <>
              <span className="h-4 w-4 border-2 border-violet-400/30 border-t-violet-400 rounded-full animate-spin" />
              Computing on mcp.nexvigilant.com...
            </>
          ) : (
            <>
              <ClipboardList className="h-4 w-4" aria-hidden="true" />
              Verify Naranjo Score with Live Engine
            </>
          )}
        </button>
      ) : (
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-white/50">Your Score</span>
            <span className="font-mono text-white">{result.score}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/50">Your Category</span>
            <span className="font-mono text-white">{result.category}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/50">Station Score</span>
            <span className="font-mono text-violet-300">
              {stationResult.score}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/50">Station Category</span>
            <span className="font-mono text-violet-300">
              {stationResult.category}
            </span>
          </div>
          <p className="text-[10px] text-white/30 mt-1">
            Powered by mcp.nexvigilant.com — the same engine AI agents use.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Main Wizard Component ────────────────────────────────────────────────────

export function CausalityWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>(
    Array(10).fill(null) as Answer[],
  );
  const [result, setResult] = useState<NaranjoResult | null>(null);

  const handleAnswer = useCallback((questionIdx: number, value: Answer) => {
    setAnswers((prev) => {
      const next = [...prev] as Answer[];
      next[questionIdx] = value;
      return next;
    });
  }, []);

  const allAnswered = answers.every((a) => a !== null);

  const handleReset = useCallback(() => {
    setAnswers(Array(10).fill(null) as Answer[]);
    setResult(null);
    setCurrentStep(0);
  }, []);

  const handleNext = useCallback(() => {
    if (currentStep === 0) {
      if (!allAnswered) return;
      const numericAnswers = answers.map((a) => (a === null ? 0 : a));
      setResult(computeNaranjoSync(numericAnswers));
      setCurrentStep(1);
    } else if (currentStep < 3) {
      setCurrentStep((s) => s + 1);
    }
  }, [currentStep, allAnswered, answers]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  }, [currentStep]);

  const steps = useMemo(
    () => [
      {
        title: "Answer the 10 Questions",
        description:
          "Go through each question based on what you know about the case. Not sure about something? Choose Don't Know — it's always a valid answer.",
        content: <QuestionsContent answers={answers} onAnswer={handleAnswer} />,
      },
      {
        title: "Here's Your Score",
        description:
          "Each answer contributed points to the total Naranjo score. Here's how it broke down.",
        content: result ? (
          <ScoreContent result={result} answers={answers} />
        ) : null,
      },
      {
        title: "What Category Does This Case Fall Into?",
        description:
          "The Naranjo scale places this case into one of four causality categories based on the score.",
        content: result ? <ClassificationContent result={result} /> : null,
      },
      {
        title: "What Should You Do Next?",
        description:
          "Based on the causality classification, here are the recommended next steps for this case.",
        content: result ? (
          <ActionContent result={result} onReset={handleReset} />
        ) : null,
      },
    ],
    [answers, handleAnswer, result, handleReset],
  );

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <StepWizard
        steps={steps}
        currentStep={currentStep}
        onNext={currentStep === 0 && !allAnswered ? undefined : handleNext}
        onBack={handleBack}
      />
    </div>
  );
}
