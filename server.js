const express = require('express');
const config = require('getconfig');
const server = require('./server/index.js');

const { start, app } = server({
    sf: config.salesforce,
    pg: config.db,
    app: {
        port: config.host.port
    }
});

app.use(express.static('./dist'));
app.use('*', (req, res) => {
    res.sendFile(require('path').resolve('./dist', 'index.html'));
});

start()
    .then(() =>
        console.log(
            `Server started: http://${config.host.name}:${config.host.port}/`
        )
    )
    .catch(console.error);
