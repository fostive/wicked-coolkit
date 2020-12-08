const compression = require('compression');
const helmet = require('helmet');
const express = require('express');
const knexConfig = require('./knexfile');
const config = require('getconfig');
const cors = require('cors');
const path = require('path');
const pg = require('knex')({
    client: 'pg',
    ...knexConfig[config.getconfig.env]
});

const HOST = process.env.HOST || 'localhost';
const PORT = process.env.PORT || 3002;
const DIST_DIR = './dist';

const app = express();
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.static(DIST_DIR));

app.get('/api/hitCounter', async (req, res) => {
    const hits = await pg
        .select('site', 'count')
        .from('hit_counter')
        .where({ site: req.query.site })
        .first();

    res.json({ ...hits });
});

app.post('/api/hitCounter', async (req, res) => {
    await pg
        .increment('count')
        .from('hit_counter')
        .where({ site: req.query.site });

    const hits = await pg
        .select('site', 'count')
        .from('hit_counter')
        .where({ site: req.query.site })
        .first();

    res.json({ ...hits });
});

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

app.listen(PORT, async () => {
    await setupDb();
    console.log(`✅  API Server started: http://${HOST}:${PORT}/`);
});