import { LightningElement, api } from 'lwc';
import DEFAULT_HOST from '../../../host';

export default class Webring extends LightningElement {
    name = null;
    description = null;

    @api host = DEFAULT_HOST;

    get prevHref() {
        return `${this.host}/api/webring/prev`;
    }

    get nextHref() {
        return `${this.host}/api/webring/next`;
    }

    connectedCallback() {
        this.fetchData();
    }

    async fetchData() {
        const res = await fetch(`${this.host}/api/webring`);
        const { name, description } = await res.json();

        this.name = name;
        this.description = description;
    }
}
