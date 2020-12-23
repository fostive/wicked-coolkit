const compression = require('compression');
const helmet = require('helmet');
const express = require('express');
const knexConfig = require('./knexfile');
const config = require('getconfig');
const cors = require('cors');
const path = require('path');
const jsforce = require('jsforce');

const pg = require('knex')({
    client: 'pg',
    ...knexConfig[config.getconfig.env]
});

const sf = new jsforce.Connection({
    // you can change loginUrl to connect to sandbox or prerelease env.
    loginUrl: 'https://test.salesforce.com'
});

const HOST = config.host.name;
const PORT = config.host.port;
const DIST_DIR = './dist';

const app = express();
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.static(DIST_DIR));

const random = (arr) => arr[Math.floor(Math.random() * arr.length)];

const apiHandler = (fn) => async (req, res) => {
    try {
        const apiRes = await fn(req, res);
        return apiRes;
    } catch (e) {
        console.log(e);
        res.statusCode = 500;
        res.json({ error: 'An unknown error occurred' });
    }
};

app.get(
    '/api/hitCounter',
    apiHandler(async (req, res) => {
        const hits = await pg
            .select('site', 'count')
            .from('hit_counter')
            .where({ site: req.query.site })
            .first();

        return res.json(hits);
    })
);

app.get(
    '/api/tradingCard',
    apiHandler(async (req, res) => {
        // TODO: add codepen, link, img, strengths to schema
        // Image_src__c
        // Codepen_URL__c
        // Link_URL__c
        // Image_src__c
        // Strengths__c (array or a separate association)
        const contact = await sf
            .query(
                `SELECT Id, Name, Email, Bio__c, Twitter_URL__c, Instagram_URL__c, GitHub_URL__c, LinkedIn_URL__c
                FROM Contact
                LIMIT 1`
            )
            .then(({ records }) => records[0]);

        const stickers = await sf
            .query(
                `SELECT Id, Name, Image_URL__c
                FROM Sticker__c
                WHERE Id IN
                (SELECT Sticker__c
                FROM Contact_Sticker_Association__c
                WHERE Contact__c = '${contact.Id}')`
            )
            .then(
                ({ records }) => records,
                // TODO: this fails for now so just return a static list of stickers
                (err) => {
                    console.log(err);
                    return [
                        { src: 'design', id: 1 },
                        { src: 'css', id: 2 },
                        { src: 'dogs', id: 3 },
                        { src: 'flags', id: 4 },
                        { src: 'puzzles', id: 5 },
                        { src: 'film&tv', id: 6 },
                        { src: 'music', id: 7 },
                        { src: 'baking', id: 8 },
                        { src: 'visual-arts', id: 9 },
                        { src: 'tabletop-games', id: 10 },
                        { src: 'performing-arts', id: 11 },
                        { src: 'html', id: 12 }
                    ];
                }
            );

        return res.json({
            name: contact.Name,
            email: contact.Email,
            img:
                contact.Image_src__c ||
                './resources/images/trading-card-placeholder.jpg',
            strengths: contact.Strengths__c || [
                'CSS',
                'HTML',
                'design',
                'illustration',
                'obscure trivia'
            ],
            bio: contact.Bio__c,
            link: contact.Link_URL__c,
            twitter: contact.Twitter_URL__c,
            codepen: contact.Codepen_URL__c,
            instagram: contact.Instagram_URL__c,
            github: contact.GitHub_URL__c,
            linkedin: contact.LinkedIn_URL__c,
            stickers
        });
    })
);

app.get(
    '/api/sticker',
    apiHandler(async (req, res) => {
        const webringId = await sf
            .query(
                `SELECT Id
                FROM Webring__c
                WHERE Sticker = '${req.query.id}'`
            )
            .then(({ records }) => records[0].Id);

        const randomWebsite = await sf
            .query(
                `SELECT Id, Name, URL__c
                FROM Website__c
                WHERE Id IN
                (SELECT Website__c
                FROM Website_Webring_Association__c
                WHERE Webring__c = '${webringId}')`
            )
            .then(({ records }) => random(records));

        res.redirect(randomWebsite.URL__c);
    })
);

app.get(
    '/api/webring',
    apiHandler(async (req, res) => {
        res.json({
            name: 'My cool webring!',
            description: 'This is a webring about cool stuff and other things!'
        });
    })
);

const randomWebring = apiHandler(async (req, res) => {
    const contact = await sf
        .query(
            `SELECT Id
            FROM Contact
            LIMIT 1`
        )
        .then(({ records }) => records[0]);

    const randomWebsite = await sf
        .query(
            `SELECT Id, Name, URL__c
            FROM Website__c
            WHERE Contact__c = '${contact.Id}'`
        )
        .then(({ records }) => random(records));

    res.redirect(randomWebsite.URL__c);
});

app.get('/api/webring/prev', randomWebring);
app.get('/api/webring/next', randomWebring);

app.post(
    '/api/hitCounter',
    apiHandler(async (req, res) => {
        await pg
            .increment('count')
            .from('hit_counter')
            .where({ site: req.query.site });

        const hits = await pg
            .select('site', 'count')
            .from('hit_counter')
            .where({ site: req.query.site })
            .first();

        return res.json(hits);
    })
);

app.use('*', (req, res) => {
    res.sendFile(path.resolve(DIST_DIR, 'index.html'));
});

const setupDb = async () => {
    await Promise.all(
        config.sites.map((site) =>
            pg('hit_counter')
                .insert({ site, count: 0 })
                .onConflict('site')
                .ignore()
        )
    );
};

const setupSalesforce = async () => {
    const result = await sf.login(
        config.salesforce.username,
        config.salesforce.password
    );

    // TODO: save token to database
    console.log({
        accessToken: sf.accessToken,
        instanceUrl: sf.instanceUrl,
        ...result
    });
};

const main = async () => {
    await Promise.all([setupSalesforce(), setupDb()]);
    app.listen(PORT, () => {
        console.log(`✅  API Server started: http://${HOST}:${PORT}/`);
    });
};

main().catch(console.error);
