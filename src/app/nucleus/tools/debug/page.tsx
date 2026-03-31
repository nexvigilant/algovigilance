import { DebugAssistant } from './components/debug-assistant';

export const metadata = {
  title: 'Debug Assistant | AlgoVigilance Tools',
  description: 'AI-powered analysis of stack traces, logs, and logical anomalies',
};

export default function DebugPage() {
  return <DebugAssistant />;
}
