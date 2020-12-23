import { createElement } from 'lwc';
import Dev from 'my/dev';
import MyApp from 'my/app';

let AppComponent = { is: MyApp };
if (window.location.search === '?dev') {
    AppComponent = { is: Dev };
}

const app = createElement('my-app', AppComponent);
// eslint-disable-next-line @lwc/lwc/no-document-query
document.querySelector('#main').appendChild(app);
