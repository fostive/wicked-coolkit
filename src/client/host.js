const isLocal = () => window.location.hostname === 'localhost';

const getHost = (host) => {
    const protocol = isLocal() ? 'http' : 'https';
    return `${protocol}://${host || window.location.host}`;
};

export const api = (host) => {
    return `${getHost(host)}/api`;
};

export const sticker = (s) =>
    `https://unpkg.com/wicked-coolkit/dist/stickers/svg/${s}.svg`;

const fetchApi = (instance, path, options) =>
    fetch(api(instance.host) + path, options);

export const fetchData = async (...args) => {
    const res = await fetchApi(...args);
    try {
        const data = await res.json();
        return res.ok ? [data, null] : [null, data];
    } catch (e) {
        return [null, { message: res.statusText || 'An error occurred' }];
    }
};

export const fetchInitial = async (instance, path, options) => {
    instance.loading = true;

    let data = null;
    let error = null;

    try {
        const [resData, resError] = await fetchData(instance, path, options);
        if (resError) {
            // An error with a code means we should show the message
            error = resError.code ? resError.message : 'An error occurred';
            error = error.replace(/\{\{host\}\}/g, getHost(instance.host));
        } else {
            data = resData;
        }
    } catch (e) {
        error = 'An error occurred';
    }

    instance.loading = false;

    return [data, error];
};
