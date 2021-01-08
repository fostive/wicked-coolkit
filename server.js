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
    loginUrl: config.salesforce.url
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
        const contact = await sf
            .query(
                `SELECT Id, Name, Email, Bio__c, Picture_Content_Version_ID__c, Feats_of_Strength__c, Main_Website__c, Twitter_Username__c, Instagram_Username__c, GitHub_Username__c, LinkedIn_Username__c, CodePen_Username__c
                FROM Contact
                LIMIT 1`
            )
            .then(({ records }) => records[0]);

        const [imageMeta, imageBlob, stickers, website] = await Promise.all([
            sf
                .request(
                    `/services/data/v50.0/sobjects/ContentDocument/${contact.Picture_Content_Version_ID__c}/LatestPublishedVersion`
                )
                .catch(() => ({ FileType: 'png' })),
            sf
                .request(
                    `/services/data/v50.0/sobjects/ContentDocument/${contact.Picture_Content_Version_ID__c}/LatestPublishedVersion/VersionData`
                )
                .catch(
                    () =>
                        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAAaGVYSWZNTQAqAAAACAAEAQYAAwAAAAEAAgAAARIAAwAAAAEAAQAAASgAAwAAAAEAAgAAh2kABAAAAAEAAAA+AAAAAAADoAEAAwAAAAEAAQAAoAIABAAAAAEAAAABoAMABAAAAAEAAAABAAAAAHvdGMUAAALgaVRYdFhNTDpjb20uYWRvYmUueG1wAAAAAAA8eDp4bXBtZXRhIHhtbG5zOng9ImFkb2JlOm5zOm1ldGEvIiB4OnhtcHRrPSJYTVAgQ29yZSA1LjQuMCI+CiAgIDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+CiAgICAgIDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIiCiAgICAgICAgICAgIHhtbG5zOnRpZmY9Imh0dHA6Ly9ucy5hZG9iZS5jb20vdGlmZi8xLjAvIgogICAgICAgICAgICB4bWxuczpleGlmPSJodHRwOi8vbnMuYWRvYmUuY29tL2V4aWYvMS4wLyI+CiAgICAgICAgIDx0aWZmOlBob3RvbWV0cmljSW50ZXJwcmV0YXRpb24+MjwvdGlmZjpQaG90b21ldHJpY0ludGVycHJldGF0aW9uPgogICAgICAgICA8dGlmZjpPcmllbnRhdGlvbj4xPC90aWZmOk9yaWVudGF0aW9uPgogICAgICAgICA8dGlmZjpDb21wcmVzc2lvbj4xPC90aWZmOkNvbXByZXNzaW9uPgogICAgICAgICA8dGlmZjpSZXNvbHV0aW9uVW5pdD4yPC90aWZmOlJlc29sdXRpb25Vbml0PgogICAgICAgICA8ZXhpZjpQaXhlbFlEaW1lbnNpb24+MTwvZXhpZjpQaXhlbFlEaW1lbnNpb24+CiAgICAgICAgIDxleGlmOkNvbG9yU3BhY2U+MTwvZXhpZjpDb2xvclNwYWNlPgogICAgICAgICA8ZXhpZjpQaXhlbFhEaW1lbnNpb24+MTwvZXhpZjpQaXhlbFhEaW1lbnNpb24+CiAgICAgIDwvcmRmOkRlc2NyaXB0aW9uPgogICA8L3JkZjpSREY+CjwveDp4bXBtZXRhPgrdUqUcAAAADUlEQVQIHWPYf/bufwAIIQNpUz6zkQAAAABJRU5ErkJggg=='
                ),

            sf
                .query(
                    `SELECT Id, Name, Image_URL__c
            FROM Sticker__c
            WHERE Id IN
            (SELECT Sticker__c
            FROM Contact_Sticker_Association__c
            WHERE Contact__c = '${contact.Id}')`
                )
                .then(({ records }) => records),
            sf
                .query(
                    `SELECT URL__c
            FROM Website__c
            WHERE Id = '${contact.Main_Website__c}'`
                )
                .then(({ records }) => records[0])
        ]);

        return res.json({
            name: contact.Name,
            email: contact.Email,
            bio: contact.Bio__c,
            img: `data:image/${imageMeta.FileType};base64,${imageBlob}`,
            strengths: contact.Feats_of_Strength__c.split(',')
                .map((t) => t.trim())
                .filter(Boolean),
            link: website.URL__c,
            twitter: contact.Twitter_Username__c,
            codepen: contact.Codepen_Username__c,
            instagram: contact.Instagram_Username__c,
            github: contact.GitHub_Username__c,
            linkedin: contact.LinkedIn_Username__c,
            stickers: stickers.map((sticker) => ({
                id: sticker.Id,
                path: sticker.Image_URL__c,
                name: sticker.Name
            }))
        });
    })
);

app.get(
    '/api/sticker',
    apiHandler(async (req, res) => {
        try {
            const webringId = await sf
                .query(
                    `SELECT Id
                FROM Webring__c
                WHERE Sticker__c = '${req.query.id}'`
                )
                .then(({ records }) => records[0].Id);

            const randomWebsite = await sf
                .query(
                    `SELECT URL__c
                FROM Website__c
                WHERE Id IN
                (SELECT Website__c
                FROM Website_Webring_Association__c
                WHERE Webring__c = '${webringId}')`
                )
                .then(({ records }) => random(records));

            res.redirect(randomWebsite.URL__c);
        } catch (e) {
            res.json({
                error:
                    'There are either no webrings or websites for that sticker'
            });
        }
    })
);

app.get(
    '/api/webring',
    apiHandler(async (req, res) => {
        const contact = await sf
            .query(
                `SELECT Main_Website__c
                FROM Contact
                LIMIT 1`
            )
            .then(({ records }) => records[0]);

        const website = await sf
            .query(
                `SELECT URL__c
                FROM Website__c
                WHERE Id = '${contact.Main_Website__c}'`
            )
            .then(({ records }) => records[0]);

        // TODO: fix this with the correct query
        // https://github.com/crcastle/weirdos-salesforce-app/issues/4
        res.json({
            link: website.URL__c,
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
            `SELECT URL__c
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
        const updated = await pg
            .increment('count')
            .from('hit_counter')
            .where({ site: req.query.site });

        if (updated === 0) {
            await pg('hit_counter').insert({ site: req.query.site, count: 1 });
        }

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
    await setupSalesforce();
    app.listen(PORT, () => {
        console.log(`✅  API Server started: http://${HOST}:${PORT}/`);
    });
};

main().catch(console.error);
