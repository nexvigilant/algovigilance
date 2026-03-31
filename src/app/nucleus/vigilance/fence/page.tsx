import { FenceMonitor } from "./components/fence-monitor";

export const metadata = {
  title: "Signal Fence | AlgoVigilance Vigilance",
  description:
    "Monitor signal boundary enforcement — connection auditing, fence decisions, alert thresholds",
};

export default function FencePage() {
  return <FenceMonitor />;
}
