/**
 * Test data generators and utilities
 */

import { CreateInvoiceRequest, InvoiceStatus } from './types';

/**
 * Generate a unique ID with timestamp to avoid collisions in shared environment
 */
export function generateUniqueId(prefix: string = 'test'): string {
  return `${prefix}-${Date.now()}`;
}

/**
 * Generate a future date (default 7 days from now)
 */
export function getFutureDate(daysFromNow: number = 1): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString();
}

/**
 * Generate a past date (for expired invoices)
 */
export function getPastDate(daysAgo: number = 7): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString();
}

/**
 * Generate a date in October, a given number of days ago from today
 */
export function getPastDateInOctober(daysAgo: number = 7): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setMonth(9); // October (0-based index)
  return date.toISOString();
}

/**
 * Create a valid invoice payload
 */
export function createInvoicePayload(
  overrides: Partial<CreateInvoiceRequest> = {}
): CreateInvoiceRequest {
  return {
    id: generateUniqueId('inv'),
    customer_id: generateUniqueId('cust'),
    currency: 'USD',
    amount_minor: 10000, // $100.00
    due_date_iso: getFutureDate(),
    ...overrides,
  };
}

/**
 * Generate a payment amount that will succeed
 */
export function getSuccessfulPaymentAmount(): number {
  // $125.55 - ends in 5, should succeed
  return 12555;
}

/**
 * Generate a payment amount that will fail
 */
export function getFailingPaymentAmount(): number {
  // $123.33 - ends in 3, should fail
  return 12333;
}

/**
 * Format amount from minor units to display string
 * @param amountMinor - Amount in minor units (cents)
 * @param currency - Currency code
 */
export function formatAmount(amountMinor: number, currency: string = 'USD'): string {
  const major = amountMinor / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(major);
}

/**
 * Sets up test invoices for UI or integration tests.
 *
 * Creates invoices with specified statuses (Unpaid, Paid, Void) using the provided API client.
 * For paid invoices, a payment is created and confirmed.
 *
 * @param apiClient - The API client used to create invoices and payments.
 * @param invoices
 * @returns A promise resolving to an object containing the created invoice IDs:
 *   { unpaidInvoiceId, paidInvoiceId, voidInvoiceId }
 */
export async function setupTestInvoices(
    apiClient: any,
    invoices: { status: InvoiceStatus; amount?: number }[] = [
      { status: InvoiceStatus.Unpaid },
      { status: InvoiceStatus.Paid },
      { status: InvoiceStatus.Void }
    ]
) {
  const result: Record<string, string> = {};
  for (const invoice of invoices) {
    let payload: CreateInvoiceRequest;
    let key: string;

    switch (invoice.status) {
      case InvoiceStatus.Unpaid:
        payload = createInvoicePayload({ status: InvoiceStatus.Unpaid, ...(invoice.amount !== undefined && { amount_minor: invoice.amount }) });
        key = 'unpaidInvoiceId';
        break;
      case InvoiceStatus.Paid:
        payload = createInvoicePayload({ amount_minor: invoice.amount !== undefined ? invoice.amount : 12555, status: InvoiceStatus.Unpaid });
        key = 'paidInvoiceId';
        break;
      case InvoiceStatus.Void:
        payload = createInvoicePayload({ status: InvoiceStatus.Void, ...(invoice.amount !== undefined && { amount_minor: invoice.amount }) });
        key = 'voidInvoiceId';
        break;
      default:
        continue;
    }
    await apiClient.createInvoice(payload);
    if (invoice.status === InvoiceStatus.Paid) {
      const payment = await apiClient.createPayment(payload.id);
      if (payment.status === 201 && payment.body.id) {
        await apiClient.confirmPayment(payment.body.id);
      }
    }
    result[key] = payload.id;
    console.log(`${key}`, payload.id);
  }
  return result;
}