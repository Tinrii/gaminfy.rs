import { StatusPage } from "@/components/site/status-page";

export default function Unauthorized() {
  return <StatusPage code="401" title="Please sign in" text="Sign in with an admin account to continue." href="/sign-in" cta="Sign in" />;
}
