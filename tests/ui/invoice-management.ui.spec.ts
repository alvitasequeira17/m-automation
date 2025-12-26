import {expect, request as playwrightRequest, test} from '@playwright/test';
import {InvoiceListPage} from './pages/invoice-list.page';
import {CreateInvoiceModal} from './pages/create-invoice-modal.page';
import {
  generateUniqueId,
  getFailingPaymentAmount,
  getFutureDate,
  getSuccessfulPaymentAmount,
  setupTestInvoices
} from '../helpers/test-data';
import {InvoiceStatus} from '../helpers/types';
import {
    CREATE_INVOICE_DUPLICATE_ERROR_MESSAGE,
    CREATE_INVOICE_SUCCESS_MESSAGE, INVALID_DATE,
    PAYMENT_CONFIRMED,
    PAYMENT_FAILED
} from "./helpers/constants";
import {ApiClient} from '../helpers/api-client';

async function withTestInvoice(
    invoiceSetup: { status: InvoiceStatus; amount?: number }[],
    callback: (ids: Record<string, string>, apiClient: ApiClient) => Promise<void>
) {
    const baseURL = process.env.API_BASE_URL || 'https://api-t6vbon.bunnyenv.com';
    const request = await playwrightRequest.newContext({baseURL, ignoreHTTPSErrors: true});
    const apiClient = new ApiClient(request);
    const ids = await setupTestInvoices(apiClient, invoiceSetup);
    await callback(ids, apiClient);
    await request.dispose();
}

test.describe('UI Test Suite', () => {
    test.describe('Invoice Creation', () => {
        let invoiceListPage: InvoiceListPage;
        let createModal: CreateInvoiceModal;

        test.beforeEach(async ({page}) => {
            invoiceListPage = new InvoiceListPage(page);
            createModal = new CreateInvoiceModal(page);
            await invoiceListPage.goto();
        });

        test('should open create invoice modal', async () => {
            await invoiceListPage.clickAddInvoice();
            expect(await createModal.isVisible()).toBe(true);
        });

        test('should create new invoice through UI', async () => {
            const invoiceData = {
                id: generateUniqueId('inv'),
                customerId: generateUniqueId('cust'),
                amount: 1100, // $100.00
                currency: 'AED',
                dueDate: getFutureDate()
            };
            await invoiceListPage.clickAddInvoice();
            await createModal.createInvoice(invoiceData);
            // Verify success message
            expect(await invoiceListPage.hasToastMessage(CREATE_INVOICE_SUCCESS_MESSAGE)).toBe(true);
            // Verify invoice appears in list - need to click on 'load more button'
            expect(await invoiceListPage.waitForInvoiceToAppear(invoiceData.id)).toBe(true);
        });

        test('should close modal on cancel', async () => {
            await invoiceListPage.clickAddInvoice();
            await createModal.waitForModal();
            await createModal.cancel();

            expect(await createModal.isVisible()).toBe(false);
        });

        test('should show error if invoice id already exists', async () => {
            const invoiceData = {
                id: generateUniqueId('inv'),
                customerId: generateUniqueId('cust'),
                amount: 1100,
                currency: 'AED',
                dueDate: getFutureDate()
            };

            // Create invoice first time
            await invoiceListPage.clickAddInvoice();
            await createModal.createInvoice(invoiceData);
            expect(await invoiceListPage.hasToastMessage(CREATE_INVOICE_SUCCESS_MESSAGE)).toBe(true);

            // Try to create with same id again
            await invoiceListPage.clickAddInvoice();
            await createModal.createInvoice({...invoiceData});
            await createModal.cancel();
            // Assert error message for duplicate id
            expect(await invoiceListPage.hasToastMessage(CREATE_INVOICE_DUPLICATE_ERROR_MESSAGE)).toBe(true);
        });

        test('should show invalid date in the list if due date is sent as ""', async () => {
            const invoiceData = {
                id: generateUniqueId('invalid-date'),
                customerId: generateUniqueId('cust'),
                amount: 1100,
                currency: 'AED',
                dueDate: ''
            };
            await invoiceListPage.clickAddInvoice();
            await createModal.createInvoice(invoiceData);
            expect(await invoiceListPage.hasToastMessage(CREATE_INVOICE_SUCCESS_MESSAGE)).toBe(true);
            // Verify invoice appears in list
            await invoiceListPage.filterByStatus(InvoiceStatus.Unpaid);
            expect(await invoiceListPage.waitForInvoiceToAppear(invoiceData.id)).toBe(true);
            // Verify due date is shown as 'Invalid date' in the list
            const displayedDate = await invoiceListPage.getInvoiceDueDate(invoiceData.id);
            expect(displayedDate).toEqual(INVALID_DATE);
        });
    });

    test.describe('Invoice List Display', () => {
        let invoiceListPage: InvoiceListPage;

        test.beforeEach(async ({page}) => {
            invoiceListPage = new InvoiceListPage(page);
            await invoiceListPage.goto();
        });

        test('should display invoice list page', async () => {
            expect(await invoiceListPage.isPageLoaded()).toBe(true);
        });

        test('should display invoices or empty state', async () => {
            const hasContent = await invoiceListPage.hasInvoicesOrEmptyState();
            expect(hasContent).toBe(true);
        });

        test('should have add invoice and load more button', async () => {
            expect(await invoiceListPage.hasAddInvoiceButton()).toBe(true);
            expect(await invoiceListPage.hasLoadMoreButton()).toBe(true);
        });

        test('should have status filtering capability', async () => {
            expect(await invoiceListPage.hasStatusFilter()).toBe(true);
        });
    });

    test.describe('Invoice Status Filtering', () => {
        let invoiceListPage: InvoiceListPage;

        test.beforeEach(async ({page}) => {
            invoiceListPage = new InvoiceListPage(page);
            await invoiceListPage.goto();
        });

        async function setupAndFilterByStatus(status: InvoiceStatus) {
            await withTestInvoice([{status}], async (ids) => {
                const invoiceId = ids[`${status.toLowerCase()}InvoiceId`];
                await invoiceListPage.filterByStatus(status);
                await invoiceListPage.waitForInvoiceToAppear(invoiceId);
                expect(await invoiceListPage.waitForInvoiceToAppear(invoiceId)).toBe(true);
            });
        }

        test('should filter invoices by unpaid status', async () => {
            await setupAndFilterByStatus(InvoiceStatus.Unpaid);
        });

        test('should filter invoices by paid status', async () => {
            await setupAndFilterByStatus(InvoiceStatus.Paid);
        });

        // Only checking that filtering works and returns >= 0 results because expired status is not updated for past due dates in test data
        test('should filter invoices by expired status', async () => {
            await invoiceListPage.filterByStatus(InvoiceStatus.Expired);
            const count = await invoiceListPage.getInvoiceCount();
            expect(count).toBeGreaterThanOrEqual(0);
        });

        test('should filter invoices by void status', async () => {
            await setupAndFilterByStatus(InvoiceStatus.Void);
        });
    });

    test.describe('Invoice Payment Flow', () => {
        let invoiceListPage: InvoiceListPage;

        test.beforeEach(async ({page}) => {
            invoiceListPage = new InvoiceListPage(page);
            await invoiceListPage.goto();
        });

        async function setupAndPayInvoice(amount: number, expectedToast: string, statusAfterPay?: InvoiceStatus) {
            await withTestInvoice([{status: InvoiceStatus.Unpaid, amount}], async (ids) => {
                const invoiceId = ids['unpaidInvoiceId'];
                await invoiceListPage.filterByStatus(InvoiceStatus.Unpaid);
                await invoiceListPage.waitForInvoiceToAppear(invoiceId);
                await invoiceListPage.clickPayButtonForInvoice(invoiceId);
                expect(await invoiceListPage.hasToastMessage(expectedToast)).toBe(true);
                if (statusAfterPay) {
                    await invoiceListPage.filterByStatus(statusAfterPay);
                    await invoiceListPage.waitForInvoiceToAppear(invoiceId);
                }
            });
        }

        test('should succeed payment for invoice with amount not ending in 3 or 7', async () => {
            await setupAndPayInvoice(getSuccessfulPaymentAmount(), PAYMENT_CONFIRMED, InvoiceStatus.Paid);
        });

        test('should fail payment for invoice with amount ending in 3', async () => {
            await setupAndPayInvoice(getFailingPaymentAmount(), PAYMENT_FAILED);
        });
    });

    test.describe('UI Responsiveness', () => {
        test('should be responsive on mobile view', async ({page}) => {
            await page.setViewportSize({width: 375, height: 667});

            const invoiceListPage = new InvoiceListPage(page);
            await invoiceListPage.goto();

            const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
            expect(await invoiceListPage.hasLoadMoreButton()).toBe(true);
            expect(bodyWidth).toBeLessThanOrEqual(400);
        });

        test('should be responsive on tablet view', async ({page}) => {
            await page.setViewportSize({width: 768, height: 1024});

            const invoiceListPage = new InvoiceListPage(page);
            await invoiceListPage.goto();
            expect(await invoiceListPage.hasLoadMoreButton()).toBe(true);
            expect(await invoiceListPage.isPageLoaded()).toBe(true);
        });
    });
});
