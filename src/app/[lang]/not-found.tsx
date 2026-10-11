import { StatusPage } from "@/components/site/status-page";
import { getI18n } from "@/i18n/server";

export default async function NotFound() {
  const { dict, href } = await getI18n();
  return (
    <StatusPage
      code="404"
      title={dict.errors.notFoundTitle}
      text={dict.errors.notFoundText}
      href={href("/marketplace")}
      cta={dict.errors.toShop}
    />
  );
}
