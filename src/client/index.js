import { createElement } from 'lwc';
import MyApp from 'wck/app';

const app = createElement('wck-app', { is: MyApp });
// eslint-disable-next-line @lwc/lwc/no-document-query
document.querySelector('#main').appendChild(app);
