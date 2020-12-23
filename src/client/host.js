const PRODUCTION = window.location.host.indexOf('localhost') === -1;
export default PRODUCTION
    ? `${window.location.protocol}//${window.location.host}`
    : `http://localhost:3002`;
