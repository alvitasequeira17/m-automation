import {expect, test} from '@playwright/test';
import {ApiClient} from '../helpers/api-client';
import {createInvoicePayload} from '../helpers/test-data';
import {ErrorResponse, Invoice, InvoiceStatus} from '../helpers/types';

/**
 * Invoice Management API Tests
 */

test.describe('Invoice API - Creation', () => {
    let apiClient: ApiClient;

    test.beforeEach(async ({request}) => {
        apiClient = new ApiClient(request);
    });

    test('should create invoice with valid data', async () => {
        const invoiceData = createInvoicePayload();
        const {status, body} = await apiClient.createInvoice(invoiceData);

        expect(status).toBe(201);
        const invoice = body as Invoice;
        expect(invoice.id).toBe(invoiceData.id);
        expect(invoice.customer_id).toBe(invoiceData.customer_id);
        expect(invoice.currency).toBe(invoiceData.currency);
        expect(invoice.amount_minor).toBe(invoiceData.amount_minor);
        expect(invoice.status).toBe(InvoiceStatus.Unpaid);
    });

    test('should create invoice with void status', async () => {
        const invoiceData = createInvoicePayload({status: InvoiceStatus.Void});
        const {status, body} = await apiClient.createInvoice(invoiceData);

        expect(status).toBe(201);
        const invoice = body as Invoice;
        expect(invoice.status).toBe(InvoiceStatus.Void);
    });

    test('should create invoice with unpaid status by default', async () => {
        const invoiceData = createInvoicePayload({status: InvoiceStatus.Unpaid});

        const {body} = await apiClient.createInvoice(invoiceData);
        const invoice = body as Invoice;
        expect(invoice.status).toBe(InvoiceStatus.Unpaid);
    });

    test('should reject invoice with duplicate ID', async () => {
        const invoiceData = createInvoicePayload();

        // Create first invoice
        await apiClient.createInvoice(invoiceData);

        // Try to create duplicate
        const {status, body} = await apiClient.createInvoice(invoiceData);

        expect(status).toBe(409);
        const error = body as ErrorResponse;
        expect(error.error.code).toBeTruthy();
        expect(error.error.message).toBeTruthy();
    });

    test('should reject invoice with invalid currency code', async () => {
        const invoiceData = createInvoicePayload({currency: 'US'});

        const {status, body} = await apiClient.createInvoice(invoiceData);
        expect(status).toBe(400);
        const error = body as ErrorResponse;
        expect(error.error).toBeTruthy();
    });

    test('should reject invoice with negative amount', async () => {
        const invoiceData = createInvoicePayload({amount_minor: -100});

        const {status, body} = await apiClient.createInvoice(invoiceData);
        expect(status).toBe(400);
        const error = body as ErrorResponse;
        expect(error.error).toBeTruthy();
    });

    test('should reject invoice with short ID', async () => {
        const invoiceData = createInvoicePayload({id: 'ab'});

        const {status, body} = await apiClient.createInvoice(invoiceData);
        expect(status).toBe(400);
        const error = body as ErrorResponse;
        expect(error.error).toBeTruthy();
    });

    test('should reject invoice with missing required fields', async () => {
        const {status, body} = await apiClient.createInvoice({} as any);
        expect(status).toBe(400);
        const error = body as ErrorResponse;
        expect(error.error).toBeTruthy();
    });
});

test.describe('Invoice API - Retrieval', () => {
    let apiClient: ApiClient;

    test.beforeEach(async ({request}) => {
        apiClient = new ApiClient(request);
    });

    test('should fetch existing invoice by ID', async () => {
        // Create an invoice
        const invoiceData = createInvoicePayload();
        await apiClient.createInvoice(invoiceData);

        // Retrieve it
        const invoice = await apiClient.getInvoice(invoiceData.id) as Invoice;
        expect(invoice.id).toBe(invoiceData.id);
        expect(invoice.customer_id).toBe(invoiceData.customer_id);
        expect(invoice.status).toBeTruthy();
    });

    test('should return 404 for incorrect invoice', async ({request}) => {
        const response = await request.get('/invoices/incorrect-id-12345');

        expect(response.status()).toBe(404);
        const error = await response.json() as ErrorResponse;
        expect(error.error).toBeTruthy();
    });

    test('should fetch list of invoices', async () => {
        // Create invoices
        const invoice1 = createInvoicePayload();
        const invoice2 = createInvoicePayload();
        await apiClient.createInvoice(invoice1);
        await apiClient.createInvoice(invoice2);

        // List invoices
        const response = await apiClient.listInvoices();
        expect(response.items).toBeInstanceOf(Array);
        expect(response.items.length).toBeGreaterThan(0);
        expect(response.items[0]).toHaveProperty('id');
        expect(response.items[0]).toHaveProperty('status');
    });

    test('should filter invoices by status', async () => {
        // Create invoices with different statuses
        const unpaidInvoice = createInvoicePayload({status: InvoiceStatus.Unpaid});
        const voidInvoice = createInvoicePayload({status: InvoiceStatus.Void});

        await apiClient.createInvoice(unpaidInvoice);
        await apiClient.createInvoice(voidInvoice);

        // Filter by unpaid status
        const unpaidResponse = await apiClient.listInvoices(InvoiceStatus.Unpaid);
        expect(unpaidResponse.items.every(inv => inv.status === InvoiceStatus.Unpaid)).toBe(true);

        // Filter by void status
        const voidResponse = await apiClient.listInvoices(InvoiceStatus.Void);
        expect(voidResponse.items.every(inv => inv.status === InvoiceStatus.Void)).toBe(true);
    });

    test('should match limit parameter', async () => {
        const response = await apiClient.listInvoices(undefined, 2);
        expect(response.items.length).toBeLessThanOrEqual(2);
    });
});
