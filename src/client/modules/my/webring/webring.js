import { LightningElement, api } from 'lwc';

export default class Webring extends LightningElement {
    name = null;
    description = null;

    @api host = '';

    get prevHref() {
        return `${this.host}/webring/prev`;
    }

    get nextHref() {
        return `${this.host}/webring/next`;
    }

    connectedCallback() {
        this.fetchData();
    }

    async fetchData() {
        const res = await fetch(`${this.host}/webring`);
        const { name, description } = await res.json();

        this.name = name;
        this.description = description;
    }
}
