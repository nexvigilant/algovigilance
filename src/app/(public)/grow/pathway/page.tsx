import Link from "next/link";
import {
  ArrowRight,
  Briefcase,
  CheckCircle,
  Clock,
  Target,
  DollarSign,
  TrendingUp,
  GraduationCap,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHero } from "@/components/marketing/page-hero";
import { cn } from "@/lib/utils";
import { createMetadata } from "@/lib/metadata";
import { pathwayStages, advisorVsConsultant } from "@/data/career-pathway";

export const metadata = createMetadata({
  title: "Career Pathway",
  description:
    "Your career pathway from Ambassador to Advisor, Consultant, and Fractional Executive. Build your pharmaceutical safety career with AlgoVigilance.",
  path: "/grow/pathway",
});

export default function PathwayPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="container mx-auto px-4 md:px-6 pt-8">
        <PageHero
          title="Your Career Pathway"
          description="From early career to executive leadership, AlgoVigilance provides a clear progression path. Start wherever you are, grow as far as you want to go."
          icon={
            <TrendingUp
              className="w-10 h-10 md:w-12 md:h-12 text-cyan"
              aria-hidden="true"
            />
          }
          size="lg"
        >
          <div className="flex flex-wrap justify-center gap-4 mt-6">
            <Badge
              variant="outline"
              className="border-cyan/50 text-cyan bg-cyan/10"
            >
              <Clock className="w-3 h-3 mr-1" />
              Your Pace
            </Badge>
            <Badge
              variant="outline"
              className="border-gold/50 text-gold bg-gold/10"
            >
              <Target className="w-3 h-3 mr-1" />
              Clear Milestones
            </Badge>
            <Badge
              variant="outline"
              className="border-cyan/50 text-cyan bg-cyan/10"
            >
              <DollarSign className="w-3 h-3 mr-1" />
              Increasing Compensation
            </Badge>
          </div>
        </PageHero>
      </section>

      {/* Pathway Stages */}
      <section className="container mx-auto px-4 md:px-6 py-16">
        <div className="space-y-8 max-w-4xl mx-auto">
          {pathwayStages.map((stage, index) => (
            <div key={stage.id} className="relative">
              {/* Connector line */}
              {index < pathwayStages.length - 1 && (
                <div className="hidden md:block absolute left-8 top-full w-0.5 h-8 bg-gradient-to-b from-nex-light/50 to-transparent" />
              )}

              <Card
                className={cn(
                  "bg-nex-surface/90 backdrop-blur-sm transition-all",
                  stage.color === "gold"
                    ? "border-gold/30 hover:border-gold/50"
                    : "border-cyan/30 hover:border-cyan/50",
                )}
              >
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    {/* Stage number and icon */}
                    <div className="flex items-center gap-4">
                      <div
                        className={cn(
                          "w-16 h-16 rounded-full flex items-center justify-center border-2 shrink-0",
                          stage.color === "gold"
                            ? "bg-gold/20 border-gold/50"
                            : "bg-cyan/20 border-cyan/50",
                        )}
                      >
                        <stage.icon
                          className={cn(
                            "h-8 w-8",
                            stage.color === "gold" ? "text-gold" : "text-cyan",
                          )}
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <CardTitle className="text-2xl text-white">
                            {stage.title}
                          </CardTitle>
                          <Badge
                            className={cn(
                              "text-xs",
                              stage.color === "gold"
                                ? "bg-gold/20 text-gold border-gold/30"
                                : "bg-cyan/20 text-cyan border-cyan/30",
                            )}
                          >
                            {stage.subtitle}
                          </Badge>
                        </div>
                        <CardDescription className="text-slate-dim mt-1">
                          {stage.description}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Key Activities */}
                    <div>
                      <h4 className="text-sm font-semibold text-slate-light mb-3 flex items-center gap-2">
                        <Target
                          className={cn(
                            "h-4 w-4",
                            stage.color === "gold" ? "text-gold" : "text-cyan",
                          )}
                        />
                        Key Activities
                      </h4>
                      <ul className="space-y-2">
                        {stage.keyActivities.map((activity) => (
                          <li
                            key={activity}
                            className="flex items-start gap-2 text-sm text-slate-dim"
                          >
                            <CheckCircle
                              className={cn(
                                "h-4 w-4 mt-0.5 shrink-0",
                                stage.color === "gold"
                                  ? "text-gold/60"
                                  : "text-cyan/60",
                              )}
                            />
                            {activity}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Outcomes */}
                    <div>
                      <h4 className="text-sm font-semibold text-slate-light mb-3 flex items-center gap-2">
                        <TrendingUp
                          className={cn(
                            "h-4 w-4",
                            stage.color === "gold" ? "text-gold" : "text-cyan",
                          )}
                        />
                        Expected Outcomes
                      </h4>
                      <ul className="space-y-2">
                        {stage.outcomes.map((outcome) => (
                          <li
                            key={outcome}
                            className="flex items-start gap-2 text-sm text-slate-dim"
                          >
                            <CheckCircle
                              className={cn(
                                "h-4 w-4 mt-0.5 shrink-0",
                                stage.color === "gold"
                                  ? "text-gold/60"
                                  : "text-cyan/60",
                              )}
                            />
                            {outcome}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Compensation and Next Step */}
                  <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-nex-light/20">
                    <div className="flex-1">
                      <span className="text-xs text-slate-dim uppercase tracking-wide">
                        Compensation
                      </span>
                      <p className="text-sm text-slate-light mt-1">
                        {stage.compensation}
                      </p>
                    </div>
                    <div className="flex-1">
                      <span className="text-xs text-slate-dim uppercase tracking-wide">
                        Duration
                      </span>
                      <p className="text-sm text-slate-light mt-1">
                        {stage.duration}
                      </p>
                    </div>
                  </div>

                  {/* Next Step callout */}
                  <div
                    className={cn(
                      "p-3 rounded-lg text-sm",
                      stage.color === "gold"
                        ? "bg-gold/10 text-gold"
                        : "bg-cyan/10 text-cyan",
                    )}
                  >
                    <span className="font-medium">Next:</span> {stage.nextStep}
                  </div>
                </CardContent>

                <CardFooter>
                  <Button
                    asChild
                    variant={stage.cta.variant || "default"}
                    className={cn(
                      stage.cta.variant === "outline"
                        ? stage.color === "gold"
                          ? "border-gold/50 text-gold hover:bg-gold/10"
                          : "border-cyan/50 text-cyan hover:bg-cyan/10"
                        : stage.color === "gold"
                          ? "bg-gold hover:bg-gold-bright text-nex-deep"
                          : "bg-cyan hover:bg-cyan-glow text-nex-deep",
                    )}
                  >
                    <Link href={stage.cta.href}>
                      {stage.cta.label}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </div>
          ))}
        </div>
      </section>

      {/* Advisor vs Consultant Comparison */}
      <section className="bg-nex-dark/50 border-y border-nex-light/20">
        <div className="container mx-auto px-4 md:px-6 py-16">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-lg font-mono uppercase tracking-widest text-cyan/80 mb-3">
                Role Differentiation
              </p>
              <h2 className="text-3xl font-headline font-bold text-white mb-4 uppercase tracking-wide">
                {advisorVsConsultant.title}
              </h2>
              <p className="text-slate-dim">
                {advisorVsConsultant.description}
              </p>
            </div>

            <Card className="bg-nex-surface/90 backdrop-blur-sm border-nex-light/30 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-nex-light/30">
                      <th className="text-left p-4 text-slate-dim font-medium text-sm">
                        Dimension
                      </th>
                      <th className="text-left p-4 text-cyan font-semibold">
                        Advisor
                      </th>
                      <th className="text-left p-4 text-gold font-semibold">
                        Consultant
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {advisorVsConsultant.comparison.map((row, index) => (
                      <tr
                        key={row.dimension}
                        className={cn(
                          "border-b border-nex-light/10",
                          index % 2 === 0 ? "bg-nex-dark/20" : "",
                        )}
                      >
                        <td className="p-4 text-slate-light font-medium text-sm">
                          {row.dimension}
                        </td>
                        <td className="p-4">
                          <span className="text-cyan font-medium text-sm">
                            {row.advisor.text}
                          </span>
                          <p className="text-xs text-slate-dim mt-0.5">
                            {row.advisor.detail}
                          </p>
                        </td>
                        <td className="p-4">
                          <span className="text-gold font-medium text-sm">
                            {row.consultant.text}
                          </span>
                          <p className="text-xs text-slate-dim mt-0.5">
                            {row.consultant.detail}
                          </p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 md:px-6 py-16 text-center">
        <p className="text-lg font-mono uppercase tracking-widest text-cyan/80 mb-3">
          Initiate Protocol
        </p>
        <h2 className="text-3xl font-headline font-bold text-white mb-4 uppercase tracking-wide">
          Start Your Journey Today
        </h2>
        <p className="text-slate-dim max-w-xl mx-auto mb-8">
          Whether you&apos;re just starting out or ready for the next level,
          AlgoVigilance has a place for you.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Button
            asChild
            size="lg"
            className="bg-cyan hover:bg-cyan-glow text-nex-deep touch-target"
          >
            <Link href="/grow/ambassador">
              <GraduationCap className="mr-2 h-5 w-5" />
              Start as Ambassador
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            className="bg-gold hover:bg-gold-bright text-nex-deep touch-target"
          >
            <Link href="/grow/advisor">
              <Briefcase className="mr-2 h-5 w-5" />
              Join as Advisor
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
