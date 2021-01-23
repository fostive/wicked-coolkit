const compression = require('compression');
const helmet = require('helmet');
const express = require('express');
const cors = require('cors');
const deepmerge = require('deepmerge');
const pgp = require('pg-promise')();
const { init: sfInit } = require('./salesforce');
const _db = require('./db');
const migrate = require('./migrate');

const bindMethods = (obj, ...params) =>
    Object.keys(obj).reduce((acc, key) => {
        acc[key] = (...args) => obj[key](...params, ...args);
        return acc;
    }, {});

module.exports = ({
    pg: pgConfig,
    sf: sfConfig,
    app: appConfig,
    helmet: helmetConfig = {}
}) => {
    const app = express();
    const db = bindMethods(_db, { ...pgp, db: pgp(pgConfig) });
    const sf = sfInit(sfConfig, db);

    const apiHandler = (fn) => async (req, res) => {
        try {
            const apiRes = await fn(req, res);
            return apiRes;
        } catch (e) {
            // Handle errors from the JSForce library by showing the specific message
            if (e.jsfErrorCode) {
                res.statusCode = e.statusCode || 500;
                return res.json({
                    message: e.message,
                    code: e.jsfErrorCode
                });
            }

            console.error('API Error:', e);
            res.statusCode = 500;
            return res.json({ error: 'An error occurred' });
        }
    };

    if (process.env.NODE_ENV === 'production') {
        app.use(
            helmet(
                deepmerge(
                    {
                        contentSecurityPolicy: {
                            directives: deepmerge(
                                helmet.contentSecurityPolicy.getDefaultDirectives(),
                                {
                                    'script-src': ['unpkg.com'],
                                    'img-src': ['unpkg.com']
                                }
                            )
                        }
                    },
                    helmetConfig
                )
            )
        );
    }

    app.use(compression());
    app.use(cors());

    app.get(
        '/api/hitCounter',
        apiHandler(async (req, res) => {
            const hits = await db.getHits(req.query.site);
            return res.json(hits);
        })
    );

    app.post(
        '/api/hitCounter',
        apiHandler(async (req, res) => {
            await db.incrementHits(req.query.site);
            const hits = await db.getHits(req.query.site);
            return res.json(hits);
        })
    );

    app.get(
        '/api/tradingCard',
        apiHandler(async (req, res) => {
            const contact = await sf.getContact();

            const [img, stickers] = await Promise.all([
                sf.getImage(contact.pictureId),
                sf.getStickers(contact.id)
            ]);

            return res.json({
                ...contact,
                img,
                stickers
            });
        })
    );

    app.get(
        '/api/sticker',
        apiHandler(async (req, res) => {
            const url = await sf.getRandomWebringForSticker(req.query.id);
            res.redirect(url);
        })
    );

    app.get(
        '/api/webring',
        apiHandler(async (req, res) => {
            const webring = await sf.getWebring(req.query.site);
            res.json(webring);
        })
    );

    app.get('/api/auth', (req, res) => {
        res.redirect(
            `${sfConfig.authUrl}/connect?redirect_uri=${req.query.redirect_host}/api/auth-redirect&login_url=${sfConfig.loginUrl}`
        );
    });

    app.get('/api/auth-redirect', async (req, res) => {
        const {
            access_token: accessToken,
            refresh_token: refreshToken,
            instance_url: instanceUrl
        } = req.query;

        if (!accessToken || !refreshToken || !instanceUrl) {
            throw new Error('Error during Salesforce auth');
        }

        sf.connect({
            instanceUrl,
            accessToken
        });

        await db.saveAuth({
            instanceUrl,
            accessToken,
            refreshToken
        });

        res.redirect('/');
    });

    app.get('/api/setup', (req, res) => {
        const instanceUrl = sf && sf.connection && sf.connection.instanceUrl;
        res.redirect(
            instanceUrl || `/api/auth?redirect_host=${req.query.redirect_host}`
        );
    });

    const start = async () => {
        await migrate(pgConfig);
        await sf.login();
        await new Promise((resolve) => app.listen(appConfig.port, resolve));
    };

    return {
        start,
        app,
        sf,
        db
    };
};
