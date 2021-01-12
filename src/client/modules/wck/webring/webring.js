import { LightningElement, api } from 'lwc';
import * as host from '../../../host';

export default class Webring extends LightningElement {
    name = null;
    description = null;
    error = null;
    loading = true;

    @api host = null;

    get prevHref() {
        return `${host.api(this.host)}/webring/prev`;
    }

    get nextHref() {
        return `${host.api(this.host)}/webring/next`;
    }

    get success() {
        return !this.loading && !this.error;
    }

    connectedCallback() {
        this.fetchData();
    }

    async fetchData() {
        this.loading = true;
        const res = await fetch(`${host.api(this.host)}/webring`);
        this.loading = false;

        if (!res.ok) {
            this.error = 'There was an error loading the webring.';
            return;
        }

        const { name, description, url } = await res.json();

        this.url = url;
        this.name = name;
        this.description = description;
    }
}
