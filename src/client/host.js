const isLocal = () => window.location.host === 'localhost:3001';

export const api = (host) => {
    const protocol = isLocal() ? 'http' : 'https';
    return `${protocol}://${host || window.location.host}/api`;
};

export const sticker = (s) => {
    return isLocal()
        ? `/stickers/svg/${s}.svg`
        : `https://unpkg.com/wicked-coolkit/dist/stickers/svg/${s}.svg`;
};
