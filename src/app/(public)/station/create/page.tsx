import { createMetadata } from "@/lib/metadata";
import { ConfigCreator } from "./config-creator";

export const metadata = createMetadata({
  title: "Station — Config Creator",
  description:
    "Build an MCP tool config for AlgoVigilance Station. Define tools, parameters, and output schemas — then download a config template ready for proxy script implementation.",
  path: "/station/create",
});

export default function CreateConfigPage() {
  return <ConfigCreator />;
}
