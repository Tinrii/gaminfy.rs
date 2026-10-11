import { StatusPage } from "@/components/site/status-page";
import { getI18n } from "@/i18n/server";

export default async function Forbidden() {
  const { dict, href } = await getI18n();
  return (
    <StatusPage
      code="403"
      title={dict.errors.forbiddenTitle}
      text={dict.errors.forbiddenText}
      href={href("/")}
      cta={dict.errors.home}
    />
  );
}
