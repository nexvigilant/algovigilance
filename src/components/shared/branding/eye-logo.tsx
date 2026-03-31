import Image from "next/image";

interface EyeLogoProps {
  className?: string;
  'aria-hidden'?: boolean | 'true' | 'false';
}

export function EyeLogo({ className, ...props }: EyeLogoProps) {
  return (
    <Image
      src="/logo.svg"
      alt="AlgoVigilance Logo"
      width={40}
      height={40}
      className={className}
      priority
      {...props}
    />
  );
}
