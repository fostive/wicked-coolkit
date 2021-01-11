exports.up = async (db) => {
    await db.query(`
        CREATE TABLE hit_counter (
            id SERIAL PRIMARY KEY,
            site character varying(250) NOT NULL UNIQUE,
            count integer NOT NULL DEFAULT 0
        );
    `);
};

exports.down = async (db) => {
    await db.query('DROP TABLE IF EXISTS hit_counter');
};
