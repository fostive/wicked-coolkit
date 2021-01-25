import { LightningElement, api } from 'lwc';
import * as host from '../../../host';

export default class Webring extends LightningElement {
    name = null;
    description = null;
    loading = true;
    prevHref = null;
    nextHref = null;

    @api host = null;

    get success() {
        return !this.loading && !this.error;
    }

    _error = null;
    get error() {
        return this._error;
    }

    set error(e) {
        this._error = e;
        // eslint-disable-next-line @lwc/lwc/no-inner-html
        this.template.querySelector('.error-message').innerHTML = e || '';
    }

    connectedCallback() {
        this.fetchData();
    }

    async onLinkClick(e) {
        const [data] = await host.fetchData(
            this,
            `/webring?site=${e.target.getAttribute('href')}`
        );

        if (data) {
            this.prevHref = data.prevWebsite;
            this.nextHref = data.nextWebsite;
        }
    }

    async fetchData() {
        const [data, error] = await host.fetchInitial(
            this,
            `/webring?site=${window.location.href}`
        );

        if (error) {
            this.error = error;
            return;
        }

        this.name = data.name;
        this.description = data.description;
        this.prevHref = data.prevWebsite;
        this.nextHref = data.nextWebsite;
    }
}
