import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  datetime,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  varchar,
} from "drizzle-orm/mysql-core";

// Explicit BIGINT UNSIGNED AUTO_INCREMENT: drizzle's serial() emits "serial AUTO_INCREMENT",
// which MariaDB rejects. Foreign keys reference this as bigint unsigned.
const id = () => bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey();

const timestamps = {
  createdAt: datetime("created_at", { mode: "date" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime("updated_at", { mode: "date" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`)
    .$onUpdate(() => new Date()),
};

/** Local mirror of Clerk users, keyed by Clerk user ID. */
export const users = mysqlTable("users", {
  id: varchar("id", { length: 64 }).primaryKey(),
  email: varchar("email", { length: 255 }).notNull(),
  displayName: varchar("display_name", { length: 120 }),
  imageUrl: varchar("image_url", { length: 512 }),
  ...timestamps,
});

export const categories = mysqlTable("categories", {
  id: id(),
  slug: varchar("slug", { length: 80 }).notNull().unique(),
  name: varchar("name", { length: 120 }).notNull(),
  /** Serbian (default) copy; *En columns hold the English translation. */
  description: varchar("description", { length: 255 }),
  descriptionEn: varchar("description_en", { length: 255 }),
  /** Portrait cover art (4:5), shown on category cards. */
  imageUrl: varchar("image_url", { length: 512 }),
  /** Square thumbnail, shown in the marketplace category switcher. */
  thumbUrl: varchar("thumb_url", { length: 512 }),
  sortOrder: int("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  ...timestamps,
});

export const products = mysqlTable(
  "products",
  {
    id: id(),
    categoryId: bigint("category_id", { mode: "number", unsigned: true })
      .notNull()
      .references(() => categories.id),
    slug: varchar("slug", { length: 120 }).notNull().unique(),
    /** Serbian (default) copy; *En columns hold the English translation (falls back to Serbian). */
    name: varchar("name", { length: 200 }).notNull(),
    nameEn: varchar("name_en", { length: 200 }),
    description: text("description"),
    descriptionEn: text("description_en"),
    instructions: text("instructions"),
    instructionsEn: text("instructions_en"),
    imageUrl: varchar("image_url", { length: 512 }),
    /** Price in the smallest currency unit (e.g. cents / para). */
    priceMinor: int("price_minor").notNull(),
    currency: varchar("currency", { length: 3 }).notNull().default("RSD"),
    deliveryType: mysqlEnum("delivery_type", ["automatic", "manual"]).notNull(),
    /** Which contact fields the customer must supply for manual fulfillment. */
    requiredContactFields: varchar("required_contact_fields", { length: 255 }),
    /** Stock for manual products; automatic products derive stock from unassigned codes. */
    manualStock: int("manual_stock"),
    sortOrder: int("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    ...timestamps,
  },
  (t) => [index("products_category_idx").on(t.categoryId)],
);

/** Pre-loaded digital codes for automatic delivery. A code is assigned to at most one order. */
export const productCodes = mysqlTable(
  "product_codes",
  {
    id: id(),
    productId: bigint("product_id", { mode: "number", unsigned: true })
      .notNull()
      .references(() => products.id),
    code: text("code").notNull(),
    orderId: bigint("order_id", { mode: "number", unsigned: true }).unique(),
    assignedAt: datetime("assigned_at", { mode: "date" }),
    ...timestamps,
  },
  (t) => [index("product_codes_available_idx").on(t.productId, t.orderId)],
);

export const orders = mysqlTable(
  "orders",
  {
    id: id(),
    userId: varchar("user_id", { length: 64 })
      .notNull()
      .references(() => users.id),
    productId: bigint("product_id", { mode: "number", unsigned: true })
      .notNull()
      .references(() => products.id),
    amountMinor: int("amount_minor").notNull(),
    currency: varchar("currency", { length: 3 }).notNull(),
    /** Storefront language at checkout — emails are sent in it. */
    locale: varchar("locale", { length: 2 }).notNull().default("sr"),
    status: mysqlEnum("status", [
      "pending",
      "paid",
      "processing",
      "delivered",
      "cancelled",
      "failed",
      "refunded",
    ])
      .notNull()
      .default("pending"),
    stripeCheckoutSessionId: varchar("stripe_checkout_session_id", { length: 255 }).unique(),
    stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 255 }),
    paidAt: datetime("paid_at", { mode: "date" }),
    deliveredAt: datetime("delivered_at", { mode: "date" }),
    ...timestamps,
  },
  (t) => [index("orders_user_idx").on(t.userId), index("orders_status_idx").on(t.status)],
);

/** Contact details a customer submits for a manually fulfilled order. Never passwords. */
export const fulfillmentDetails = mysqlTable("fulfillment_details", {
  id: id(),
  orderId: bigint("order_id", { mode: "number", unsigned: true })
    .notNull()
    .unique()
    .references(() => orders.id),
  discordUsername: varchar("discord_username", { length: 100 }),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 40 }),
  instagram: varchar("instagram", { length: 100 }),
  notes: text("notes"),
  ...timestamps,
});

/** Contact form submissions — stored so nothing is lost if email delivery fails. */
export const contactMessages = mysqlTable("contact_messages", {
  id: id(),
  name: varchar("name", { length: 120 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  message: text("message").notNull(),
  isHandled: boolean("is_handled").notNull().default(false),
  ...timestamps,
});

/** Processed Stripe webhook event IDs, so retries and duplicates never fulfill twice. */
export const stripeEvents = mysqlTable("stripe_events", {
  id: varchar("id", { length: 255 }).primaryKey(),
  type: varchar("type", { length: 100 }).notNull(),
  processedAt: datetime("processed_at", { mode: "date" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export type Category = typeof categories.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderStatus = Order["status"];
export type DeliveryType = Product["deliveryType"];
