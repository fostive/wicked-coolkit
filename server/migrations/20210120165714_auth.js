exports.up = async (db) => {
  await db.query(`
        CREATE TABLE auth (
            id character varying(250) PRIMARY KEY NOT NULL UNIQUE,
            access_token character varying(250) NOT NULL,
            refresh_token character varying(250) NOT NULL,
            instance_url character varying(250) NOT NULL
        );
    `);
};

exports.down = async (db) => {
  await db.query("DROP TABLE IF EXISTS auth");
};
