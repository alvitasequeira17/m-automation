import {Locator, Page} from '@playwright/test';
import {DEFAULT_WAIT_TIMEOUT} from "../helpers/constants";

/**
 * Page Object for the Create Invoice Modal/Form
 */
export class CreateInvoiceModal {
    readonly page: Page;
    readonly modal: Locator;
    readonly idInput: Locator;
    readonly customerIdInput: Locator;
    readonly amountInput: Locator;
    readonly currencyInput: Locator;
    readonly dueDateInput: Locator;
    readonly submitButton: Locator;
    readonly cancelButton: Locator;

    constructor(page: Page) {
        this.page = page;

        this.modal = page.getByTestId('create-modal');

        this.idInput = page.getByTestId('create-id');
        this.customerIdInput = page.getByTestId('create-customer')
        this.amountInput = page.getByTestId('create-amount')
        this.currencyInput = page.getByTestId('create-currency')
        this.dueDateInput = page.getByTestId('create-due')

        this.submitButton = page.getByTestId('create-submit');
        this.cancelButton = page.getByRole('button', {name: /cancel/i});
    }

    async waitForModal() {
        await this.modal.waitFor({state: 'visible', timeout: DEFAULT_WAIT_TIMEOUT});
    }

    async fillInvoiceForm(data: {
        id: string;
        customerId: string;
        amount: number;
        currency?: string;
        dueDate?: string;
    }) {
        await this.idInput.fill(data.id);
        await this.customerIdInput.fill(data.customerId);

        // Amount might be in dollars or cents - try to handle both
        const amountValue = data.amount >= 100 ? (data.amount / 100).toString() : data.amount.toString();
        await this.amountInput.fill(amountValue);

        if (data.currency) {
            await this.currencyInput.fill(data.currency);
        }

        if (data.dueDate) {
            const placeholder = await this.dueDateInput.getAttribute('placeholder');
            let dateValue = data.dueDate;
            if (placeholder && placeholder.includes('YYYY-MM-DDTHH:mm')) {
                // Format as YYYY-MM-DDTHH:mm
                dateValue = data.dueDate.substring(0, 16);
            }
            await this.dueDateInput.fill(dateValue);
        }
    }

    async submit() {
        await this.submitButton.click();
    }

    async cancel() {
        await this.cancelButton.click();
    }

    async createInvoice(data: {
        id: string;
        customerId: string;
        amount: number;
        currency?: string;
        dueDate?: string;
    }) {
        await this.waitForModal();
        await this.fillInvoiceForm(data);
        await this.submit();
    }

    async isVisible(): Promise<boolean> {
        return await this.modal.isVisible();
    }
}
