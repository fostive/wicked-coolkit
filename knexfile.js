// Update with your config settings.

const Config = require('getconfig');

module.exports = {
    development: {
        client: 'postgresql',
        connection: Config.db
    },
    production: {
        client: 'postgresql',
        connection: Config.db,
        pool: {
            min: 2,
            max: 10
        },
        migrations: {
            tableName: 'knex_migrations'
        },
        ssl: {
            rejectUnauthorized: false
        }
    }
};
