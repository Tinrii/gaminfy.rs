import type { Metadata } from "next";
import { LegalDocument, legalMetadata } from "@/components/site/legal-document";

export function generateMetadata(): Promise<Metadata> {
  return legalMetadata("terms");
}

export default function Page() {
  return <LegalDocument kind="terms" />;
}
