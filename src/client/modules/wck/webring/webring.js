import { LightningElement, api } from 'lwc';
import * as host from '../../../host';

export default class Webring extends LightningElement {
    name = null;
    description = null;
    error = null;
    loading = true;
    prevHref = null;
    nextHref = null;

    @api host = null;

    get success() {
        return !this.loading && !this.error;
    }

    connectedCallback() {
        this.fetchData();
    }

    async onLinkClick(e) {
        const site = e.target.getAttribute('href');
        const res = await fetch(`${host.api(this.host)}/webring?site=${site}`);

        const { prevWebsite, nextWebsite } = await res.json();

        this.prevHref = prevWebsite;
        this.nextHref = nextWebsite;
    }

    async fetchData() {
        this.loading = true;
        const res = await fetch(
            `${host.api(this.host)}/webring?site=${window.location.href}`
        );
        this.loading = false;

        if (!res.ok) {
            this.error = 'There was an error loading the webring.';
            return;
        }

        const {
            name,
            description,
            url,
            prevWebsite,
            nextWebsite
        } = await res.json();

        this.url = url;
        this.name = name;
        this.description = description;
        this.prevHref = prevWebsite;
        this.nextHref = nextWebsite;
    }
}
