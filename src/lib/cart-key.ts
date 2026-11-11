/** One cart line per product and chosen option, e.g. "12" or "12:3". Shared by the client cart and the server quote. */
export const cartKey = (productId: number, variantId?: number | null) =>
  variantId ? `${productId}:${variantId}` : String(productId);
