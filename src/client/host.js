const isLocal = () => window.location.host === 'localhost:3001';

const getHost = (host) => {
    const protocol = isLocal() ? 'http' : 'https';
    return `${protocol}://${host || window.location.host}`;
};

export const api = (host) => {
    return `${getHost(host)}/api`;
};

export const sticker = (s) => {
    return isLocal()
        ? `/stickers/svg/${s}.svg`
        : `https://unpkg.com/wicked-coolkit/dist/stickers/svg/${s}.svg`;
};

export const fetchData = (instance, path, options) =>
    fetch(api(instance.host) + path, options);

export const fetchInitial = async (instance, path, options) => {
    instance.loading = true;

    let data = null;
    let error = null;

    try {
        const res = await fetchData(instance, path, options);
        if (!res.ok) {
            const resError = await res.json();
            // An error with a code means we should show the message
            error = resError.code ? resError.message : 'An error occurred';
            error = error.replace(/\{\{host\}\}/g, getHost(instance.host));
        } else {
            data = await res.json();
        }
    } catch (e) {
        console.log(e);
        error = 'An error occurred';
    }

    instance.loading = false;

    return { data, error };
};
