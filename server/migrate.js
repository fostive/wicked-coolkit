const { Pool } = require('pg');
const { PGStorage } = require('@robotty/umzug-postgres-storage');
const Umzug = require('umzug');
const path = require('path');

module.exports = async (config) => {
    const dbPool = new Pool(config);
    const db = await dbPool.connect();

    const umzug = new Umzug({
        storage: new PGStorage(db, {
            tableName: 'migrations',
            columnName: 'id'
        }),
        migrations: {
            path: path.resolve(__dirname, 'migrations'),
            params: [db]
        }
    });

    return umzug.up();
};
