import { LightningElement } from 'lwc';
import { apiUrl } from '../../../api';

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

    connectedCallback() {
        this.postCount();
    }

    async fetchCount() {
        const res = await fetch(
            `${apiUrl()}/hitCounter?site=${window.location.host}`
        );
        const { count } = await res.json();
        this.renderCount(count);
    }

    async postCount() {
        const res = await fetch(
            `${apiUrl()}/hitCounter?site=${window.location.host}`,
            {
                method: 'POST'
            }
        );
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
