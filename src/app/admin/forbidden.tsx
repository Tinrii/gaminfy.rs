import { StatusPage } from "@/components/site/status-page";

export default function Forbidden() {
  return <StatusPage code="403" title="Access denied" text="Your account isn't an admin." href="/" cta="Back to site" />;
}
