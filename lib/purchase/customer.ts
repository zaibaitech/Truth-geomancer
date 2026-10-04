// Customer details collected before a Paystack checkout. Pure and
// client-safe: the form uses it for instant feedback, and the checkout route
// runs the same function as the authority — the browser's check is a
// convenience, never the gate.
export interface CustomerDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export type CustomerField = keyof CustomerDetails;
export type CustomerErrors = Partial<Record<CustomerField, string>>;

const NAME_MAX = 60;

export function normalisePhone(raw: string): string {
  return raw.replace(/[\s\-().]/g, '');
}

export function validateCustomerDetails(
  input: Partial<Record<CustomerField, unknown>>,
): { ok: true; value: CustomerDetails } | { ok: false; errors: CustomerErrors } {
  const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
  const firstName = str(input.firstName);
  const lastName = str(input.lastName);
  const email = str(input.email);
  const phone = normalisePhone(str(input.phone));

  const errors: CustomerErrors = {};
  if (!firstName) errors.firstName = 'Enter your first name.';
  else if (firstName.length > NAME_MAX) errors.firstName = 'That first name is too long.';
  if (!lastName) errors.lastName = 'Enter your last name.';
  else if (lastName.length > NAME_MAX) errors.lastName = 'That last name is too long.';
  // Deliberately permissive — Paystack's own checkout is the real deliverability check.
  if (!email) errors.email = 'Enter your email address.';
  else if (!/^[^\s@]+@[^\s@]+$/.test(email) || email.length > 254) errors.email = 'That email address does not look right.';
  if (!phone) errors.phone = 'Enter your phone number.';
  else if (!/^\+?\d{7,15}$/.test(phone)) errors.phone = 'Enter a valid phone number, e.g. +233 24 123 4567.';

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, value: { firstName, lastName, email, phone } };
}
