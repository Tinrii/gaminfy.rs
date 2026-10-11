import { StatusPage } from "@/components/site/status-page";

export default function NotFound() {
  return <StatusPage code="404" title="Not found" text="This admin page doesn't exist." href="/" cta="Back to site" />;
}
