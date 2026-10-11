import { StatusPage } from "@/components/site/status-page";
import { getI18n } from "@/i18n/server";

export default async function Unauthorized() {
  const { dict, href } = await getI18n();
  return (
    <StatusPage
      code="401"
      title={dict.errors.unauthorizedTitle}
      text={dict.errors.unauthorizedText}
      href={href("/sign-in")}
      cta={dict.errors.signIn}
    />
  );
}
