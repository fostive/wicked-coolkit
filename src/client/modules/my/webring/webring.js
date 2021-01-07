import { LightningElement, api } from 'lwc';
import DEFAULT_HOST from '../../../host';

export default class Webring extends LightningElement {
    name = null;
    description = null;
    error = null;
    loading = true;

    @api host = DEFAULT_HOST;

    get prevHref() {
        return `${this.host}/api/webring/prev`;
    }

    get nextHref() {
        return `${this.host}/api/webring/next`;
    }

    get success() {
        return !this.loading && !this.error;
    }

    connectedCallback() {
        this.fetchData();
    }

    async fetchData() {
        this.loading = true;
        const res = await fetch(`${this.host}/api/webring`);
        this.loading = false;

        if (!res.ok) {
            this.error = 'There was an error loading the webring.';
            return;
        }

        const { name, description } = await res.json();

        this.name = name;
        this.description = description;
    }
}
