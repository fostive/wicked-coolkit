import { LightningElement } from 'lwc';
import { apiUrl } from '../../../api';

export default class Webring extends LightningElement {
    name = null;
    description = null;

    prevHref = `${apiUrl()}/webring/prev`;
    nextHref = `${apiUrl()}/webring/next`;

    connectedCallback() {
        this.fetchData();
    }

    async fetchData() {
        const res = await fetch(`${apiUrl()}/webring`);
        const { name, description } = await res.json();

        this.name = name;
        this.description = description;
    }
}
