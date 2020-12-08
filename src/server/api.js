const compression = require('compression');
const helmet = require('helmet');
const express = require('express');
const knexConfig = require('../../knexfile');
const config = require('getconfig');
const cors = require('cors');
const pg = require('knex')({
    client: 'pg',
    ...knexConfig[config.getconfig.env]
});

const app = express();
app.use(helmet());
app.use(compression());
app.use(cors());

const HOST = process.env.HOST || 'localhost';
const PORT = process.env.PORT || 3002;

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

app.listen(PORT, () =>
    console.log(`✅  API Server started: http://${HOST}:${PORT}/`)
);
