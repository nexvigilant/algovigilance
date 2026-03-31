import type { SVGProps } from "react";

interface LogoProps extends SVGProps<SVGSVGElement> {
  /** Title for screen readers (default: "AlgoVigilance Logo") */
  title?: string;
}

export function Logo({ title = "AlgoVigilance Logo", ...props }: LogoProps) {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={title}
      {...props}
    >
      <title>{title}</title>
      <path
        d="M24 4L4 12V30L24 44L44 30V12L24 4Z"
        stroke="hsl(var(--primary))"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M24 22V44"
        stroke="hsl(var(--primary))"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M44 12L24 22L4 12"
        stroke="hsl(var(--primary))"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M34 9L14 15"
        stroke="hsl(var(--primary))"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
