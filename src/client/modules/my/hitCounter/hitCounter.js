import { LightningElement, api } from 'lwc';
import DEFAULT_HOST from '../../../host';

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

    @api host = DEFAULT_HOST;

    connectedCallback() {
        this.postCount();
    }

    async postCount() {
        const res = await fetch(
            `${this.host}/api/hitCounter?site=${window.location.host}`,
            {
                method: 'POST'
            }
        );

        if (!res.ok) {
            this.renderCount('ERROR!!!');
            return;
        }

        const { count } = await res.json();
        this.renderCount(count);
    }

    renderCount(count) {
        const dataDigits = count.toString().split('').reverse();
        const allDigits = [...Array(DIGIT_COUNT)];

        allDigits.forEach((__, i) => {
            this[`digit${i + 1}`] = dataDigits[i] || '0';
        });
    }
}
