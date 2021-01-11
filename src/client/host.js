export const devHost = 'localhost:3002';

export const isValid = (host) =>
    window.location.hostname === 'localhost' || host !== devHost;

export const api = (host) => `http${host !== devHost ? 's' : ''}://${host}/api`;

export const sticker = (s) => {
    return window.location.hostname === 'localhost'
        ? `/stickers/svg/${s}.svg`
        : `https://unpkg.com/wicked-coolkit/stickers/svg/${s}.svg`;
};
