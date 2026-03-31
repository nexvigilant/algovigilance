/**
 * Observatory layout — bare shell, no marketing header/footer.
 *
 * The Observatory is an immersive 3D experience that manages its own visual
 * frame (deep-space atmosphere, shader sphere, circuit traces). It inherits
 * the (public) route group but must NOT render PublicPageWrapper, which would
 * inject the SiteHeader and SiteFooter over the full-page canvas.
 *
 * All explorers use 'use client' with next/dynamic Three.js imports — they
 * are already code-split and do not need SSR wrappers.
 */
export default function ObservatoryLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
