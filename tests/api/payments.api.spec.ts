import { test, expect } from '@playwright/test';
import { ApiClient } from '../helpers/api-client';
import {
  createInvoicePayload,
  getSuccessfulPaymentAmount,
  getFailingPaymentAmount,
} from '../helpers/test-data';
import { Invoice, PaymentAttempt, ErrorResponse, InvoiceStatus } from '../helpers/types';

/**
 * Payment Processing API Tests
 */

// test.describe('Payment API - Success Flow', () => {
//   let apiClient: ApiClient;
//
//   test.beforeEach(async ({ request }) => {
//     apiClient = new ApiClient(request);
//   });
//
//   test('should successfully pay invoice', async () => {
//     // Create invoice with amount that will succeed (not ending in 3 or 7)
//     const invoiceData = createInvoicePayload({
//       amount_minor: getSuccessfulPaymentAmount()
//     });
//     await apiClient.createInvoice(invoiceData);
//     console.log('invoice created:', invoiceData);
//
//     // Create payment attempt
//     const { status: createStatus, body: paymentBody } = await apiClient.createPayment(
//       invoiceData.id
//     );
//     console.log('payment body:', paymentBody);
//     expect(createStatus).toBe(201);
//     const payment = paymentBody as PaymentAttempt;
//     expect(payment.status).toBe('pending');
//     expect(payment.invoice_id).toBe(invoiceData.id);
//
//     // Confirm payment without mocking (should succeed based on amount)
//     const { status: confirmStatus, body: confirmedBody } = await apiClient.confirmPayment(
//       payment.id
//     );
//     console.log('confirmed:', confirmedBody);
//     expect(confirmStatus).toBe(200);
//     const confirmedPayment = confirmedBody as PaymentAttempt;
//     expect(confirmedPayment.status).toBe('confirmed');
//
//     // Verify invoice is now paid
//     const invoice = await apiClient.getInvoice(invoiceData.id) as Invoice;
//     console.log('invoice created:', invoice);
//     expect(invoice.status).toBe(InvoiceStatus.Paid);
//   });
//
//   test('should fail payment with amount ending in 3', async () => {
//     // Create invoice with amount ending in 3 (should fail)
//     const invoiceData = createInvoicePayload({
//       amount_minor: 12333 // $123.33
//     });
//
//     await apiClient.createInvoice(invoiceData);
//
//     // Create and confirm payment
//     const { body: paymentBody } = await apiClient.createPayment(invoiceData.id);
//     const payment = paymentBody as PaymentAttempt;
//     console.log(payment);
//
//     const { status: confirmStatus, body: confirmedBody } = await apiClient.confirmPayment(
//       payment.id
//     );
//     console.log('confirmed:', confirmedBody);
//
//     // Payment should fail
//     expect(confirmStatus).toBe(402);
//     const error = confirmedBody as ErrorResponse;
//     expect(error.error).toBeTruthy();
//
//     // Verify invoice is still unpaid
//     const invoice = await apiClient.getInvoice(invoiceData.id) as Invoice;
//     expect(invoice.status).toBe(InvoiceStatus.Unpaid);
//     console.log('invoice created:', invoice);
//   });
//
//   test('should fail payment with amount ending in 7', async () => {
//     // Create invoice with amount ending in 7 (should fail)
//     const invoiceData = createInvoicePayload({
//       amount_minor: 12777// $127.77
//     });
//     console.log('invoice created:', invoiceData);
//
//     await apiClient.createInvoice(invoiceData);
//
//     // Create and confirm payment
//     const { body: paymentBody } = await apiClient.createPayment(invoiceData.id);
//     const payment = paymentBody as PaymentAttempt;
//
//     const { status: confirmStatus } = await apiClient.confirmPayment(payment.id);
//
//     // Payment should fail
//     expect(confirmStatus).toBe(402);
//
//     // Verify invoice is still unpaid
//     const invoice = await apiClient.getInvoice(invoiceData.id) as Invoice;
//     expect(invoice.status).toBe(InvoiceStatus.Unpaid);
//   });
//
//   test('should track payment attempt lifecycle', async () => {
//     const invoiceData = createInvoicePayload({
//       amount_minor: getSuccessfulPaymentAmount()
//     });
//     await apiClient.createInvoice(invoiceData);
//
//     // Create payment - should be pending
//     const { body: createBody } = await apiClient.createPayment(invoiceData.id);
//     const payment = createBody as PaymentAttempt;
//     expect(payment.status).toBe('pending');
//     expect(payment.id).toBeTruthy();
//     expect(payment.created_at).toBeTruthy();
//
//     // Confirm payment - should be confirmed
//     const { body: confirmBody } = await apiClient.confirmPayment(payment.id);
//     const confirmedPayment = confirmBody as PaymentAttempt;
//     expect(confirmedPayment.status).toBe('confirmed');
//     expect(confirmedPayment.id).toBe(payment.id);
//   });
// });
//
// test.describe('Payment API - Mock Outcomes', () => {
//   let apiClient: ApiClient;
//
//   test.beforeEach(async ({ request }) => {
//     apiClient = new ApiClient(request);
//   });
//
//   test('should force success with X-Mock-Outcome header', async () => {
//     // Even with failing amount, mock header should override
//     const invoiceData = createInvoicePayload({
//       amount_minor: getFailingPaymentAmount()
//     });
//     await apiClient.createInvoice(invoiceData);
//
//     const { body: paymentBody } = await apiClient.createPayment(invoiceData.id);
//     const payment = paymentBody as PaymentAttempt;
//     console.log(payment);
//
//     // Force success with mock header
//     const { status, body } = await apiClient.confirmPayment(payment.id, 'success');
//     console.log('payment created:', payment);
//
//     expect(status).toBe(200);
//     const confirmedPayment = body as PaymentAttempt;
//     expect(confirmedPayment.status).toBe('confirmed');
//     console.log('confirmed:', confirmedPayment);
//   });
//
//   test('should force failure with X-Mock-Outcome header', async () => {
//     // Even with successful amount, mock header should override
//     const invoiceData = createInvoicePayload({
//       amount_minor: getSuccessfulPaymentAmount()
//     });
//     await apiClient.createInvoice(invoiceData);
//
//     const { body: paymentBody } = await apiClient.createPayment(invoiceData.id);
//     const payment = paymentBody as PaymentAttempt;
//     console.log(payment);
//
//     // Force failure with mock header
//     const { status } = await apiClient.confirmPayment(payment.id, 'fail');
//     expect(status).toBe(402);
//   });
// });
//
// test.describe('Payment API - Error Cases', () => {
//   let apiClient: ApiClient;
//
//   test.beforeEach(async ({ request }) => {
//     apiClient = new ApiClient(request);
//   });
//
//   test('should reject payment for incorrect invoice', async () => {
//     const { status, body } = await apiClient.createPayment('incorrect-invoice-id');
//
//     expect(status).toBe(404);
//     const error = body as ErrorResponse;
//     expect(error.error).toBeTruthy();
//   });
//
//   test('should reject payment for void invoice', async () => {
//     // Create void invoice
//     const invoiceData = createInvoicePayload({ status: InvoiceStatus.Void });
//     await apiClient.createInvoice(invoiceData);
//
//     // Try to pay void invoice
//     const { status, body } = await apiClient.createPayment(invoiceData.id);
//
//     expect(status).toBe(422);
//     const error = body as ErrorResponse;
//     expect(error.error).toBeTruthy();
//   });
//
//   test('should reject payment for already paid invoice', async () => {
//     // Create and pay invoice
//     const invoiceData = createInvoicePayload({
//       amount_minor: getSuccessfulPaymentAmount()
//     });
//     await apiClient.createInvoice(invoiceData);
//
//     // First payment - should succeed
//     const { body: payment1 } = await apiClient.createPayment(invoiceData.id);
//     await apiClient.confirmPayment((payment1 as PaymentAttempt).id);
//     console.log(payment1);
//     // Try to pay again
//     const { status, body } = await apiClient.createPayment(invoiceData.id);
//     console.log(status);
//     console.log(body);
//     expect(status).toBe(422);
//     const error = body as ErrorResponse;
//     expect(error.error).toBeTruthy();
//   });
//
//   test('should return 404 for incorrect payment confirmation', async ({ request }) => {
//     const response = await request.post('/payments/incorrect-payment-id/confirm');
//     expect(response.status()).toBe(404);
//   });
// });
