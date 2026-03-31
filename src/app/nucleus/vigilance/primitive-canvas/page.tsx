import { createMetadata } from "@/lib/metadata";
import { PrimitiveCanvas } from "./components/primitive-canvas";

export const metadata = createMetadata({
  title: "Build With Primitives",
  description:
    "Compose concepts from the 15 T1 Lex Primitiva — snap blocks together, watch the conservation law validate your structure in real time",
  path: "/nucleus/vigilance/primitive-canvas",
  keywords: [
    "primitives",
    "composition",
    "conservation law",
    "Lex Primitiva",
    "T1",
  ],
});

export default function PrimitiveCanvasPage() {
  return <PrimitiveCanvas />;
}
