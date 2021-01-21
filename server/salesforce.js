const fetch = require('node-fetch');
const { Base64Encode } = require('base64-stream');
const normalizeUrl = require('normalize-url');
const jsforce = require('jsforce');

const random = (arr) => arr[Math.floor(Math.random() * arr.length)];

const last = (arr) => arr[arr.length - 1];

const wrapArr = (arr, index, dir) => {
    const nextIndex = index + dir;
    if (nextIndex >= arr.length) {
        return arr[0];
    }
    if (nextIndex < 0) {
        return last(arr);
    }
    return arr[nextIndex];
};

const normalizeWebringUrl = (u) =>
    normalizeUrl(u, { stripHash: true, stripProtocol: true });

const findWebringUrlIndex = (webring, url) => {
    return url
        ? webring.map(normalizeWebringUrl).indexOf(normalizeWebringUrl(url))
        : -1;
};

const getContact = async (sf) => {
    const c = await sf
        .query(
            `SELECT Id, Name, Email, Bio__c, Picture_Content_Version_ID__c, Feats_of_Strength__c,
            Main_Website__c, Twitter_Username__c, Instagram_Username__c, GitHub_Username__c, LinkedIn_Username__c, CodePen_Username__c
            FROM Contact
            LIMIT 1`
        )
        .then(({ records }) => records[0]);

    const websiteUrl = await sf
        .query(
            `SELECT URL__c
            FROM Website__c
            WHERE Id = '${c.Main_Website__c}'`
        )
        .then(({ records }) => records[0].URL__c);

    return {
        id: c.Id,
        name: c.Name,
        email: c.Email,
        bio: c.Bio__c,
        pictureId: c.Picture_Content_Version_ID__c,
        strengths: c.Feats_of_Strength__c.split(',')
            .map((t) => t.trim())
            .filter(Boolean),
        website: websiteUrl,
        twitter: c.Twitter_Username__c,
        instagram: c.Instagram_Username__c,
        github: c.GitHub_Username__c,
        linkedin: c.LinkedIn_Username__c,
        codepen: c.CodePen_Username__c
    };
};

const getStickers = (sf, id) => {
    return sf
        .query(
            `SELECT Id, Name, Image_Alt_Text__c
        FROM Sticker__c
        WHERE Id IN
        (SELECT Sticker__c
        FROM Contact_Sticker_Association__c
        WHERE Contact__c = '${id}')`
        )
        .then(({ records }) => records)
        .then((stickers) =>
            stickers.map((sticker) => ({
                // TODO: use new column names for name and alt text
                id: sticker.Id,
                path: sticker.Name,
                alt: sticker.Image_Alt_Text__c
            }))
        );
};

const getImage = async (sf, imageId) => {
    const path = `/services/data/v50.0/sobjects/ContentVersion/${imageId}`;
    const [imageMeta, base64Image] = await Promise.all([
        sf.request(path),
        fetch(`${sf.instanceUrl}${path}/VersionData`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${sf.accessToken}`
            }
        })
            .then((res) => {
                if (res.ok) {
                    return res.body;
                }
                throw new Error(
                    `Error fetching image data: ${res.status} ${res.statusText}`
                );
            })
            .then(
                (body) =>
                    new Promise((resolve, reject) => {
                        let data = '';
                        body.pipe(new Base64Encode())
                            .on('data', (d) => (data += d))
                            .on('end', () => resolve(data))
                            .on('error', reject);
                    })
            )
    ]);

    return `data:image/${imageMeta.FileType.toLowerCase()};base64,${base64Image}`;
};

const _getWebringWebsites = (sf, webringId) => {
    return sf
        .query(
            `SELECT URL__c, Name
            FROM Website__c
            WHERE Id IN
            (SELECT Website__c
            FROM Website_Webring_Association__c
            WHERE Webring__c = '${webringId}')
            ORDER BY Name` // TODO: change this to a deterministic order field
        )
        .then(({ records }) => records.map((w) => w.URL__c));
};

const getRandomWebringForSticker = async (sf, stickerId) => {
    const webringId = await sf
        .query(
            `SELECT Id
            FROM Webring__c
            WHERE Sticker__c = '${stickerId}'`
        )
        .then(({ records }) => records[0].Id);

    const websites = await _getWebringWebsites(sf, webringId);

    return random(websites);
};

const getWebring = async (sf, currentWebsite) => {
    const contact = await getContact(sf);

    const webring = await sf
        .query(
            `SELECT Webring__r.Id, Webring__r.Name, Webring__r.Description__c
            FROM Contact
            WHERE Id = '${contact.id}'`
        )
        .then(({ records }) => records[0].Webring__r)
        .then((w) => ({
            id: w.Id,
            name: w.Name,
            description: w.Description__c
        }));

    const websites = await _getWebringWebsites(sf, webring.id);
    const currentIndex = findWebringUrlIndex(websites, currentWebsite);
    const prevWebsite =
        currentIndex === -1
            ? last(websites)
            : wrapArr(websites, currentIndex, -1);
    const nextWebsite =
        currentIndex === -1 ? websites[0] : wrapArr(websites, currentIndex, 1);

    return {
        url: contact.website,
        name: webring.name,
        description: webring.description,
        prevWebsite,
        nextWebsite
    };
};

// All query methods that will be exposed to the server
const methods = {
    getContact,
    getStickers,
    getImage,
    getWebring,
    getRandomWebringForSticker
};

// Custom errors that should be responded to differently on the client
class AuthError extends Error {
    constructor() {
        super(
            'A connection could not be made to the Salesforce instance. Please <a href="{{host}}/api/auth?redirect_host={{host}}" target="_blank">click here</a> to continue setup.'
        );
        this.errorCode = 'SF_AUTH';
        this.statusCode = 401;
    }
}

class RefreshError extends Error {
    constructor(message) {
        super('The Salesforce token could not be refreshed');
        this.internalMessage = message;
        this.errorCode = 'SF_AUTH_REFRESH';
        this.statusCode = 401;
    }
}

class SetupError extends Error {
    constructor(message, sf) {
        super(
            `The Salesforce instance has not been setup with data. Please <a href="${sf.instanceUrl}" target="_blank">click here</a> to continue setup.`
        );
        this.internalMessage = message;
        this.errorCode = 'SF_SETUP';
        this.statusCode = 500;
    }
}

module.exports.init = (sfConfig, db) => {
    let sf = null;

    const connect = (c) => {
        if (c && c.instanceUrl && c.accessToken) {
            sf = new jsforce.Connection({
                instanceUrl: c.instanceUrl,
                accessToken: c.accessToken
            });
        }
    };

    const refresh = async () => {
        const auth = await db.getAuth();

        const params = new URLSearchParams();
        params.append('refresh_token', auth.refreshToken);
        params.append('login_url', sfConfig.loginUrl);

        const res = await fetch(`${sfConfig.authUrl}/refresh`, {
            method: 'post',
            body: params
        });

        if (!res.ok) {
            throw new RefreshError(`${res.status} ${res.statusText}`);
        }

        const refreshAuth = await res.json().then((d) => ({
            accessToken: d.access_token,
            instanceUrl: d.instance_url
        }));

        await db.refreshAuth(refreshAuth);
        connect(refreshAuth);

        return {
            ...auth,
            ...refreshAuth
        };
    };

    const login = async () => connect(await db.getAuth());

    const wrapApiMethod = (rawMethod) => async (...args) => {
        // try to login first
        if (sf === null) {
            await login();
        }

        const method = () => {
            // Check if sf instance has been created, if not throw an error
            if (sf === null) {
                throw new AuthError();
            }

            return rawMethod(sf, ...args);
        };

        return method()
            .catch((e) => {
                // If any API calls results in a refresh token error
                // attempt to refresh once
                // TODO: fix this errorcode check
                if (e.errorCode === 'TOKEN_REFRESH') {
                    return refresh();
                }

                throw e;
            })

            .then((res) => {
                // If refresh is successful, attempt api call again
                if (res.accessToken) {
                    return method();
                }

                return res;
            })
            .catch((e) => {
                console.log('JSForce Error:', e);

                // These errors mean data has not been setup yet
                if (e.errorCode === 'INVALID_FIELD') {
                    // TODO: are there other salesfroce error codes that mean the data has not been setup properly?
                    throw new SetupError(e.message, sf);
                }

                throw e;
            });
    };

    return {
        ...Object.keys(methods).reduce((acc, key) => {
            acc[key] = wrapApiMethod(methods[key]);
            return acc;
        }, {}),
        login,
        connect
    };
};
