const compression = require('compression');
const helmet = require('helmet');
const express = require('express');
const cors = require('cors');
const jsforce = require('jsforce');
const pgp = require('pg-promise')();
const _sfQueries = require('./salesforce');
const _dbQueries = require('./db');
const migrate = require('./migrate');

const apiHandler = (fn) => async (req, res) => {
    try {
        const apiRes = await fn(req, res);
        return apiRes;
    } catch (e) {
        console.log(e);
        res.statusCode = 500;
        return res.json({ error: 'An unknown error occurred' });
    }
};

const bindMethods = (obj, ...params) =>
    Object.keys(obj).reduce((acc, key) => {
        acc[key] = (...args) => obj[key](...params, ...args);
        return acc;
    }, {});

module.exports = ({ pg: pgConfig, sf: sfConfig, app: appConfig }) => {
    const app = express();
    const pg = pgp(pgConfig);
    const sf = new jsforce.Connection({ loginUrl: sfConfig.url });
    const sfLogin = sf.login(sfConfig.username, sfConfig.password);

    const sfQueries = bindMethods(_sfQueries, sf);
    const dbQueries = bindMethods(_dbQueries, pg);

    const defaultCspDirectives = helmet.contentSecurityPolicy.getDefaultDirectives();

    app.use(
        helmet({
            contentSecurityPolicy: {
                directives: {
                    ...defaultCspDirectives,
                    'script-src': [
                        ...defaultCspDirectives['script-src'],
                        'unpkg.com'
                    ],
                    'img-src': [...defaultCspDirectives['img-src'], 'unpkg.com']
                }
            }
        })
    );

    app.use(compression());
    app.use(cors());

    app.get(
        '/api/hitCounter',
        apiHandler(async (req, res) => {
            const hits = await dbQueries.getHits(req.query.site);
            return res.json(hits);
        })
    );

    app.post(
        '/api/hitCounter',
        apiHandler(async (req, res) => {
            await dbQueries.incrementHits(req.query.site);
            const hits = await dbQueries.getHits(req.query.site);
            return res.json(hits);
        })
    );

    app.get(
        '/api/tradingCard',
        apiHandler(async (req, res) => {
            const contact = await sfQueries.getContact();

            const [img, stickers] = await Promise.all([
                sfQueries.getImage(contact.pictureId),
                sfQueries.getStickers(contact.id)
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
            const url = await sfQueries.getRandomWebringForSticker(
                req.query.id
            );
            res.redirect(url);
        })
    );

    app.get(
        '/api/webring',
        apiHandler(async (req, res) => {
            const webring = await sfQueries.getWebring();
            res.json(webring);
        })
    );

    app.get(
        '/api/webring/prev',
        apiHandler(async (req, res) => {
            const url = await sfQueries.getRandomWebringForContact();
            res.redirect(url);
        })
    );

    app.get(
        '/api/webring/next',
        apiHandler(async (req, res) => {
            const url = await sfQueries.getRandomWebringForContact();
            res.redirect(url);
        })
    );

    const start = () =>
        Promise.all([
            migrate(pgConfig),
            sfLogin,
            new Promise((resolve) => app.listen(appConfig.port, resolve))
        ]);

    return {
        start,
        app,
        sf,
        pg
    };
};
