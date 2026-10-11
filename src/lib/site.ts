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
