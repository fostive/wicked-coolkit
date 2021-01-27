exports.up = async (db) => {
  // Reset auth since host and user id are required
  await db.query(`DELETE FROM auth`);
  await db.query(`
    ALTER TABLE auth 
    ADD host character varying(250) NOT NULL,
    ADD sf_user_id character varying(250) NOT NULL;
  `);
};

exports.down = async (db) => {
  await db.query(`
    ALTER TABLE auth
    DROP COLUMN host,
    DROP COLUMN sf_user_id;
  `);
};
