import { LightningElement } from 'lwc';

export default class App extends LightningElement {
    authUrl = `/api/auth?redirect_host=${window.location.protocol}//${window.location.host}`;
}
