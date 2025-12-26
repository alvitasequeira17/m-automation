import { APIRequestContext } from '@playwright/test';
import {
  Invoice,
  CreateInvoiceRequest,
  InvoiceListResponse,
  PaymentAttempt,
  ErrorResponse,
} from './types';

/**
 * API Client for Utility Bill Pay system
 * Provides methods for interacting with the REST API endpoints
 * Includes error handling and response validation
 */
export class ApiClient {
  constructor(private request: APIRequestContext) {}

  /**
   * Health check endpoint
   */
  async healthCheck(): Promise<boolean> {
    const response = await this.request.get('/health');
    return response.ok();
  }

  /**
   * List invoices with optional filtering
   * @param status - Filter by invoice status
   * @param limit - Maximum number of invoices to return
   * @param cursor - Pagination cursor
   */
  async listInvoices(
    status?: string,
    limit?: number,
    cursor?: string
  ): Promise<InvoiceListResponse> {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (limit) params.append('limit', limit.toString());
    if (cursor) params.append('cursor', cursor);

    const response = await this.request.get(`/invoices?${params.toString()}`);
    return response.json();
  }

  /**
   * Get a specific invoice by ID
   */
  async getInvoice(id: string): Promise<Invoice | ErrorResponse> {
    const response = await this.request.get(`/invoices/${id}`);
    return response.json();
  }

  /**
   * Create a new invoice
   */
  async createInvoice(data: CreateInvoiceRequest): Promise<{
    response: any;
    status: number;
    body: Invoice | ErrorResponse
  }> {
    const response = await this.request.post('/invoices', {
      data,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const body = await response.json();
    return { response, status: response.status(), body };
  }

  /**
   * Create a payment attempt for an invoice
   * @param invoiceId - invoice ID to pay
   * @param idempotencyKey - Optional key to ensure idempotency of the payment attempt
   */
  async createPayment(invoiceId: string, idempotencyKey?: string) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;

    const response = await this.request.post('/payments', {
      data: { invoice_id: invoiceId },
      headers,
    });

    const body = await response.json();
    return { response, status: response.status(), body };
  }

  /**
   * Confirm a payment attempt
   * @param paymentId - payment ID
   * @param mockOutcome - Override the default payment outcome ('success' or 'fail')
   */
  async confirmPayment(
      paymentId: string,
      mockOutcome?: 'success' | 'fail'
  ): Promise<{
    response: any;
    status: number;
    body: PaymentAttempt | ErrorResponse
  }> {
    const response = await this.request.post(`/payments/${paymentId}/confirm`, {
      headers: mockOutcome ? { 'X-Mock-Outcome': mockOutcome } : {},
    });

    const body = await response.json();
    return { response, status: response.status(), body };
  }
}

