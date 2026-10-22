/**
 * Social profiles shown in the footer and contact page.
 * TODO: fill in the client's real profile URLs — entries without an href are hidden.
 */
export const SOCIAL_LINKS: { label: "Instagram" | "Discord" | "TikTok"; href: string }[] = [
  { label: "Instagram", href: "https://www.instagram.com/gaminfy.rs/" }
];

/** From the client's ordering info card. */
export const COUNTRIES = ["Serbia", "Croatia", "Bosnia & Herzegovina", "European Union"] as const;

/**
 * Business details used in the Terms, Privacy and Refund pages.
 * TODO: replace with the client's registered company name, address/country and
 * public support email before launch. An empty email falls back to "the contact form".
 */
export const LEGAL = {
  company: "Gaminfy",
  country: { sr: "Republici Srbiji", en: "the Republic of Serbia" },
  email: "contact@gaminfy.rs",
};

/** WhatsApp contact (international format, digits only) for the floating chat button. */
export const WHATSAPP_NUMBER = "381640069325";

/** Category whose offers live on the golden /cs2 page instead of the marketplace. */
export const CS2_CATEGORY = "cs2";

/** Skin wear options in the CS2 request form (labels in dict.cs2.form.wears). */
export const CS2_WEARS = ["any", "fn", "mw", "ft", "ww", "bs"] as const;
