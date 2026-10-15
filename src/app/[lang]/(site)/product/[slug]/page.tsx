import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import {
  ChevronRightIcon,
  CircleCheckIcon,
  CreditCardIcon,
  MailIcon,
  MessageCircleIcon,
  PackageCheckIcon,
  ShieldCheckIcon,
  UserRoundCheckIcon,
  ZapIcon,
} from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { ProductCard } from "@/components/shop/product-card";
import { ProductImage } from "@/components/shop/product-image";
import { Skeleton } from "@/components/ui/skeleton";
import { t } from "@/i18n/dictionaries";
import { getI18n } from "@/i18n/server";
import { getProduct, getProductSlugs, getRelatedProducts } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import { absoluteAsset, absoluteUrl, breadcrumbLd, pageMetadata, siteUrl } from "@/lib/seo";
import { JsonLd } from "@/components/site/json-ld";
import { BuyBox } from "./buy-box";
import { CheckoutNotice } from "@/components/shop/checkout-notice";

export async function generateStaticParams() {
  return (await getProductSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/product/[slug]">): Promise<Metadata> {
  const { locale, dict } = await getI18n();
  const product = await getProduct((await params).slug, locale);
  if (!product) return { title: dict.product.notFound, robots: { index: false } };
  return pageMetadata({
    title: product.name,
    description: `${product.description ?? product.name} ${dict.product.price}: ${formatPrice(product.priceMinor, product.currency, locale)}.`,
    path: `/product/${product.slug}`,
    image: false,
  });
}

const STEP_ICONS = {
  automatic: [CreditCardIcon, MailIcon, PackageCheckIcon],
  manual: [CreditCardIcon, MessageCircleIcon, UserRoundCheckIcon],
};

export default function ProductPage({ params }: PageProps<"/[lang]/product/[slug]">) {
  return (
    <Suspense fallback={<ProductSkeleton />}>
      <ProductContent params={params} />
    </Suspense>
  );
}

function ProductSkeleton() {
  return (
    <div className="container-page grid gap-10 pt-[6.5rem] pb-24 lg:grid-cols-[minmax(0,26rem)_1fr] lg:gap-16">
      <Skeleton className="aspect-[4/5] rounded-3xl" />
      <div className="space-y-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="mt-8 h-24 rounded-2xl" />
      </div>
    </div>
  );
}

async function ProductContent({ params }: Pick<PageProps<"/[lang]/product/[slug]">, "params">) {
  const { slug } = await params;
  const { locale, dict, href } = await getI18n();
  const product = await getProduct(slug, locale);
  if (!product) notFound();

  const related = await getRelatedProducts(product.categoryId, product.id, locale);
  const automatic = product.deliveryType === "automatic";
  const lowStock = product.inStock && product.stock !== null && product.stock <= 5;
  const steps = automatic ? dict.product.stepsAutomatic : dict.product.stepsManual;
  const categoryHref = href(`/marketplace?category=${product.categorySlug}`);
  const productUrl = absoluteUrl(locale, `/product/${product.slug}`);

  return (
    <div className="pt-[4.5rem]">
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "Product",
            name: product.name,
            description: product.description ?? undefined,
            image: product.imageUrl ? [absoluteAsset(product.imageUrl)] : undefined,
            sku: product.slug,
            category: product.categoryName,
            brand: { "@type": "Brand", name: product.categoryName },
            url: productUrl,
            offers: {
              "@type": "Offer",
              url: productUrl,
              price: (product.priceMinor / 100).toFixed(2),
              priceCurrency: product.currency,
              availability: product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
              itemCondition: "https://schema.org/NewCondition",
              seller: { "@id": `${siteUrl()}/#organization` },
            },
          },
          breadcrumbLd([
            { name: dict.nav.marketplace, url: absoluteUrl(locale, "/marketplace") },
            { name: product.categoryName, url: absoluteUrl(locale, `/marketplace?category=${product.categorySlug}`) },
            { name: product.name, url: productUrl },
          ]),
        ]}
      />
      <div aria-hidden className="bg-hero-glow pointer-events-none absolute inset-x-0 top-0 -z-10 h-[40rem]" />
      <div className="container-page pt-8 pb-24">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Link href={href("/marketplace")} className="hover:text-foreground">
            {dict.nav.marketplace}
          </Link>
          <ChevronRightIcon className="size-3" />
          <Link href={categoryHref} className="hover:text-foreground">
            {product.categoryName}
          </Link>
          <ChevronRightIcon className="size-3" />
          <span className="truncate text-foreground">{product.name}</span>
        </nav>

        <Suspense>
          <CheckoutNotice />
        </Suspense>

        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,26rem)_1fr] lg:gap-16">
          <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-white/[0.06] bg-card lg:sticky lg:top-24 lg:self-start">
            <ProductImage
              src={product.imageUrl}
              alt={product.name}
              fill
              loading="eager"
              sizes="(min-width: 1024px) 416px, 100vw"
              className="object-cover"
            />
          </div>

          <div>
            <Link href={categoryHref} className="text-xs font-semibold tracking-wider text-primary uppercase">
              {product.categoryName}
            </Link>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{product.name}</h1>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {product.inStock ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  <CircleCheckIcon className="size-3.5" />
                  {lowStock ? t(dict.product.onlyLeft, { n: product.stock! }) : dict.product.inStock}
                </span>
              ) : (
                <span className="rounded-full bg-destructive/10 px-3 py-1 text-xs font-semibold text-destructive">
                  {dict.product.outOfStock}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                {automatic ? <ZapIcon className="size-3.5" /> : <UserRoundCheckIcon className="size-3.5" />}
                {automatic ? dict.product.instantDelivery : dict.product.teamDelivery}
              </span>
            </div>

            <BuyBox productId={product.id} productName={product.name} priceMinor={product.priceMinor} currency={product.currency} inStock={product.inStock} />

            <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheckIcon className="size-4 text-primary" />
              {dict.product.secureCheckout}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              {dict.product.consent.split(/(\{terms\}|\{refunds\})/).map((part) =>
                part === "{terms}" ? (
                  <Link key={part} href={href("/terms")} className="text-foreground underline underline-offset-2 hover:text-primary">
                    {dict.footer.terms}
                  </Link>
                ) : part === "{refunds}" ? (
                  <Link key={part} href={href("/refund-policy")} className="text-foreground underline underline-offset-2 hover:text-primary">
                    {dict.footer.refunds}
                  </Link>
                ) : (
                  part
                ),
              )}
            </p>

            {product.description && (
              <section className="mt-10">
                <h2 className="text-sm font-semibold">{dict.product.about}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{product.description}</p>
              </section>
            )}

            <section className="mt-10">
              <h2 className="text-sm font-semibold">{dict.product.howItWorks}</h2>
              <ol className="mt-4 grid gap-3 sm:grid-cols-3">
                {steps.map(({ title, text }, i) => {
                  const Icon = STEP_ICONS[product.deliveryType][i];
                  return (
                    <li key={title} className="rounded-2xl border border-white/[0.06] bg-card p-4">
                      <div className="flex items-center justify-between">
                        <Icon className="size-5 text-primary" />
                        <span className="text-xs font-semibold text-muted-foreground">0{i + 1}</span>
                      </div>
                      <p className="mt-4 text-sm font-semibold">{title}</p>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{text}</p>
                    </li>
                  );
                })}
              </ol>
            </section>

            {product.instructions && (
              <section className="mt-10 rounded-2xl border border-primary/20 bg-primary/[0.04] p-5">
                <h2 className="text-sm font-semibold">{dict.product.beforeYouBuy}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{product.instructions}</p>
              </section>
            )}
          </div>
        </div>

        {related.length > 0 && (
          <Reveal>
            <section className="mt-24">
              <div className="mb-6 flex items-end justify-between gap-4">
                <h2 className="text-xl font-semibold">{t(dict.product.moreFrom, { category: product.categoryName })}</h2>
                <Link href={categoryHref} className="text-sm font-semibold text-primary hover:underline">
                  {dict.product.viewAll}
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                {related.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </section>
          </Reveal>
        )}
      </div>
    </div>
  );
}
