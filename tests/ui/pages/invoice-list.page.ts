import {Locator, Page} from '@playwright/test';
import {ADD_INVOICE_BUTTON, DEFAULT_WAIT_TIMEOUT, LOAD_MORE_BUTTON, PAGE_TITLE} from '../helpers/constants';

/**
 * Page Object for the Invoice List/Dashboard page
 */
export class InvoiceListPage {
    readonly page: Page;
    readonly addInvoiceButton: Locator;
    readonly statusFilter: Locator;
    readonly invoiceRows: Locator;
    readonly pageHeading: Locator;
    readonly emptyState: Locator;
    private loadMoreButton: Locator;
    private message: Locator;
    private statusFilterLabel: Locator;

    constructor(page: Page) {
        this.page = page;

        // Locators
        this.addInvoiceButton = page.getByTestId('add-invoice');
        this.statusFilter = page.getByTestId('filter-status');
        this.statusFilterLabel = page.getByText("Status filter:");
        this.invoiceRows = page.locator('[data-testid^="invoice-row-"], tr[data-invoice-id], .invoice-item, table tr').filter({hasNotText: /Status|Amount/});
        this.pageHeading = this.pageHeading = page.getByRole('heading', {level: 1});
        this.emptyState = page.getByText(/no invoice|empty|no data/i);
        this.message = page.getByTestId('toast-message');
        this.loadMoreButton = page.getByTestId('load-more');

    }

    async goto() {
        await this.page.goto('/');
        await this.page.waitForLoadState('networkidle').catch(() => {
        });
    }

    async isPageLoaded(): Promise<boolean> {
        await this.pageHeading.waitFor({state: 'visible', timeout: DEFAULT_WAIT_TIMEOUT});
        const headingText = await this.pageHeading.textContent();
        return headingText?.trim() === PAGE_TITLE;
    }

    async hasInvoicesOrEmptyState(): Promise<boolean> {
        const invoiceCount = await this.invoiceRows.count();
        const emptyStateCount = await this.emptyState.count();
        return invoiceCount > 0 || emptyStateCount > 0;
    }

    async hasAddInvoiceButton(): Promise<boolean> {
        await this.addInvoiceButton.waitFor({state: 'visible', timeout: DEFAULT_WAIT_TIMEOUT});
        const headingText = await this.addInvoiceButton.textContent();
        return headingText?.trim() === ADD_INVOICE_BUTTON;
    }

    async hasLoadMoreButton(): Promise<boolean> {
        await this.loadMoreButton.waitFor({state: 'visible', timeout: DEFAULT_WAIT_TIMEOUT});
        const buttonText = await this.loadMoreButton.textContent();
        return buttonText?.trim() === LOAD_MORE_BUTTON;
    }

    async hasStatusFilter(): Promise<boolean> {
        const labelVisible = await this.statusFilterLabel.isVisible();
        const filterVisible = await this.statusFilter.isVisible();
        return labelVisible && filterVisible;
    }

    async clickAddInvoice() {
        const button = this.addInvoiceButton;
        await button.waitFor({state: 'visible', timeout: DEFAULT_WAIT_TIMEOUT});
        await button.click();
    }

    async filterByStatus(status: string) {
        await this.statusFilter.selectOption(status);
    }

    async getInvoiceCount(): Promise<number> {
        return await this.invoiceRows.count();
    }

    async clickPayButtonForInvoice(invoiceId: string): Promise<void> {
        const invoiceRow = this.page.locator(`[data-testid="invoice-row-${invoiceId}"]`);
        const payButton = invoiceRow.locator('button', {hasText: /pay/i});
        if (await payButton.count() > 0) {
            await payButton.first().click();
        }
    }

    async hasToastMessage(expected: string): Promise<boolean> {
        const text = await this.message.textContent();
        return text?.trim() === expected;
    }

    async waitForInvoiceToAppear(invoiceId: string): Promise<boolean> {
        const selector = `text=${invoiceId}`;
        const pollInterval = 500;
        const endTime = Date.now() + DEFAULT_WAIT_TIMEOUT;

        while (Date.now() < endTime) {
            if (await this.page.locator(selector).count() > 0) {
                return true;
            }
            if (await this.loadMoreButton.isVisible().catch(() => false)) {
                await this.loadMoreButton.waitFor({state: 'attached', timeout: pollInterval});
                await this.loadMoreButton.click().catch(() => {
                });
            }
            await this.page.waitForTimeout(pollInterval);
        }
        return await this.page.locator(selector).count() > 0;
    }

    async getInvoiceDueDate(invoiceId: string): Promise<string | null> {
        // Find the row by data-testid
        const invoiceRow = this.page.locator(`[data-testid="invoice-row-${invoiceId}"]`);
        const row = (await invoiceRow.count()) > 0
            ? invoiceRow
            : this.page.locator(`tr[data-invoice-id="${invoiceId}"]`);
        const cells = await row.locator('td').allTextContents();
        const dueDate = cells[2]?.trim() || null;
        return dueDate;
    }

    async isPayButtonDisabled(invoiceId: string): Promise<boolean> {
        const invoiceRow = this.page.locator(`[data-testid="invoice-row-${invoiceId}"]`);
        const payButton = invoiceRow.locator('button', {hasText: /pay/i});
        return await payButton.first().isDisabled();
    }
}
