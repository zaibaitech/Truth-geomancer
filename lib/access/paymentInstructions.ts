// Payment-instruction catalogue (Prompt 28, Phase 4). A single, server-safe
// source of truth for "what does a buyer see before they submit a payment
// reference" — never hard-coded per-component, so a real bank/mobile-money/
// wallet detail only ever needs to be edited in ONE place once the author
// supplies it.
//
// Every string below is a clearly-marked placeholder. No bank name, account
// number, phone number, wallet address, price, fee, or currency is invented
// here — Prompt 25 never defined a price for any product, and none is
// invented now. This module has no secret, no credential, and no network
// call, so it is safe to import from client code (the purchase form reads
// it directly to render instructions before the user submits anything).
import { PRODUCT_CATALOGUE } from './products';

export interface ProductPaymentInstructions {
  productId: string;
  /** Short heading shown above the instructions block. */
  title: string;
  /** The actual payment instructions. Placeholder until the author
   * supplies real payment details (bank, mobile money, wallet, etc). */
  instructions: string;
  /** What counts as a valid "payment reference" for this product — guidance
   * only, never validated/parsed by the server beyond non-empty. */
  referenceGuidance: string;
  /** What the user should submit alongside the reference. */
  whatToSubmit: string;
}

const PLACEHOLDER_INSTRUCTIONS =
  'Payment instructions will be provided here. Contact the author to arrange payment, then return to this page and submit the payment reference you received.';

const PLACEHOLDER_REFERENCE_GUIDANCE =
  'The transaction ID, confirmation code, or reference number your payment method gave you.';

const PLACEHOLDER_WHAT_TO_SUBMIT =
  'Your payment reference, plus any note that will help confirm the payment belongs to you.';

/** Built from PRODUCT_CATALOGUE — never a second, separately maintained
 * product list (Prompt 28, Phase 14). Every product gets the same
 * placeholder text today; a real entry replaces one product's row here
 * without touching this module's shape or any of its callers. */
export const PRODUCT_PAYMENT_INSTRUCTIONS: Record<string, ProductPaymentInstructions> = Object.fromEntries(
  PRODUCT_CATALOGUE.map((product) => [
    product.id,
    {
      productId: product.id,
      title: `${product.name} — Payment Instructions`,
      instructions: PLACEHOLDER_INSTRUCTIONS,
      referenceGuidance: PLACEHOLDER_REFERENCE_GUIDANCE,
      whatToSubmit: PLACEHOLDER_WHAT_TO_SUBMIT,
    },
  ]),
);

export function getPaymentInstructions(productId: string): ProductPaymentInstructions | undefined {
  return PRODUCT_PAYMENT_INSTRUCTIONS[productId];
}
