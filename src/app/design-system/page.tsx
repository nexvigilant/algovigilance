import { CircuitButton, MagneticButton, PCBGrid } from '@/components/ui/branded';

export default function DesignSystemPage() {
  return (
    <div className="min-h-screen bg-nex-deep p-8 text-slate-light">
      <div className="mx-auto max-w-4xl space-y-12">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold font-headline text-white">
            Design System Primitives
          </h1>
          <p className="text-slate-dim">
            Reimplementation of the "Circuit Theme" as reusable React
            components.
          </p>
        </div>

        {/* Circuit Buttons */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold font-headline text-gold">Circuit Buttons</h2>
          <div className="flex flex-wrap gap-4">
            <CircuitButton>Default Circuit</CircuitButton>
            <CircuitButton variant="secondary">Secondary Circuit</CircuitButton>
            <CircuitButton variant="destructive">Destructive</CircuitButton>
            <CircuitButton glow>Glowing Circuit</CircuitButton>
          </div>
        </section>

        {/* Magnetic Buttons */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold font-headline text-gold">Magnetic Buttons</h2>
          <div className="flex flex-wrap gap-8 rounded-xl border border-nex-light bg-nex-surface/50 p-8">
            <MagneticButton>Magnetic Hover</MagneticButton>
            <MagneticButton variant="outline">Outline Magnetic</MagneticButton>
            <MagneticButton variant="glow">Glowing Magnetic</MagneticButton>
          </div>
        </section>

        {/* PCB Grid */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold font-headline text-gold">
            PCB Grid Container
          </h2>
          <PCBGrid className="h-64">
            <div className="flex h-full flex-col items-center justify-center space-y-4">
              <h3 className="text-xl font-bold text-cyan">
                System Operational
              </h3>
              <p className="max-w-md text-center text-slate-dim">
                The PCB Grid component encapsulates the background pattern and
                animated data nodes automatically.
              </p>
              <CircuitButton glow>Initiate Sequence</CircuitButton>
            </div>
          </PCBGrid>
        </section>

        {/* Comparison */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold font-headline text-gold">Legacy vs. New</h2>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4 rounded-lg border border-nex-light p-6">
              <h3 className="font-medium text-slate-dim">
                Legacy (Raw CSS Classes)
              </h3>
              <button className="circuit-button rounded-md bg-cyan-dark px-4 py-2 text-white">
                .circuit-button
              </button>
            </div>
            <div className="space-y-4 rounded-lg border border-nex-light p-6">
              <h3 className="font-medium text-slate-dim">New (Component)</h3>
              <CircuitButton className="bg-cyan-dark text-white">
                &lt;CircuitButton /&gt;
              </CircuitButton>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
