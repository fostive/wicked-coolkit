import { LightningElement, api } from 'lwc';
import * as host from '../../../host';

const DIGIT_COUNT = 8;

export default class HitCounter extends LightningElement {
    digit1 = '?';
    digit2 = '?';
    digit3 = '?';
    digit4 = '?';
    digit5 = '?';
    digit6 = '?';
    digit7 = '?';
    digit8 = '?';

    @api host = null;

    connectedCallback() {
        this.postCount();
    }

    async postCount() {
        const [data, error] = await host.fetchInitial(
            this,
            `/hitCounter?site=${window.location.host}`,
            {
                method: 'POST'
            }
        );

        if (error) {
            this.renderCount('ERROR'.padEnd(DIGIT_COUNT, '!'));
            return;
        }

        this.renderCount(data.count);
    }

    renderCount(count) {
        const dataDigits = count.toString().split('').reverse();
        const allDigits = [...Array(DIGIT_COUNT)];

        allDigits.forEach((__, i) => {
            this[`digit${i + 1}`] = dataDigits[i] || '0';
        });
    }
}
