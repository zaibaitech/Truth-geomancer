import { describe, expect, it } from 'vitest';
import { validateCustomerDetails } from './customer';

const good = { firstName: ' Ama ', lastName: 'Mensah', email: 'a@b.co', phone: '+233 (24) 123-4567' };

describe('validateCustomerDetails', () => {
  it('trims and normalises', () => {
    expect(validateCustomerDetails(good)).toEqual({
      ok: true,
      value: { firstName: 'Ama', lastName: 'Mensah', email: 'a@b.co', phone: '+233241234567' },
    });
  });
  it('reports every missing field', () => {
    const r = validateCustomerDetails({});
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.errors).sort()).toEqual(['email', 'firstName', 'lastName', 'phone']);
  });
  it('rejects non-string input and bad phone/email', () => {
    expect(validateCustomerDetails({ ...good, firstName: 5 }).ok).toBe(false);
    expect(validateCustomerDetails({ ...good, phone: '12' }).ok).toBe(false);
    expect(validateCustomerDetails({ ...good, email: 'nope' }).ok).toBe(false);
  });
});
