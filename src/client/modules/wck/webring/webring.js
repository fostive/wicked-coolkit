import { LightningElement, api } from 'lwc';
import * as host from '../../../host';

export default class Webring extends LightningElement {
    name = null;
    description = null;
    error = null;
    loading = true;

    @api host = host.devHost;

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
        if (host.isValid(this.host)) {
            this.fetchData();
        } else {
            this.loading = false;
            this.error = 'Please specify the host property on your component.';
        }
    }

    async fetchData() {
        this.loading = true;
        const res = await fetch(`${host.api(this.host)}/webring`);
        this.loading = false;

        if (!res.ok) {
            this.error = 'There was an error loading the webring.';
            return;
        }

        const { name, description, link } = await res.json();

        this.link = link;
        this.name = name;
        this.description = description;
    }
}
