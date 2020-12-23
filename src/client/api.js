// eslint-disable-next-line no-confusing-arrow
export const apiUrl = () =>
    window.PRODUCTION
        ? `${window.location.protocol}//${window.location.host}/api`
        : `http://localhost:3002/api`;
