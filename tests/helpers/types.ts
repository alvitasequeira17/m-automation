/**
 * Type definitions for the Utility Bill Pay API
 */

export enum InvoiceStatus {
    Unpaid = 'unpaid',
    Paid = 'paid',
    Expired = 'expired',
    Void = 'void',
}

export type PaymentStatus = 'pending' | 'confirmed' | 'failed';

export interface Invoice {
    id: string;
    customer_id: string;
    currency: string;
    amount_minor: number;
    due_date_iso: string;
    status: InvoiceStatus;
}

export interface CreateInvoiceRequest {
    id: string;
    customer_id: string;
    currency: string;
    amount_minor: number;
    due_date_iso: string;
    status?: InvoiceStatus.Unpaid | InvoiceStatus.Void;
}

export interface InvoiceListResponse {
    items: Invoice[];
    next_cursor: string | null;
}

export interface PaymentAttempt {
    id: string;
    invoice_id: string;
    created_at: string;
    status: PaymentStatus;
}

export interface CreatePaymentRequest {
    invoice_id: string;
}

export interface ErrorResponse {
    error: {
        code: string;
        message: string;
    };
}
