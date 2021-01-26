require('dotenv').config();
const express = require('express');
const server = require('./server/index.js');

const { start, app } = server({
    loginUrl: process.env.SALESFORCE_URL,
    authUrl: process.env.SALESFORCE_AUTH_URL,
    pg: process.env.DATABASE_URL
});

app.use(express.static('./public'));

start()
    .then(({ port }) =>
        console.log(
            `Server started on ${
                process.env.NODE_ENV === 'production'
                    ? 'port '
                    : 'http://localhost:'
            }${port}`
        )
    )
    .catch(console.error);
