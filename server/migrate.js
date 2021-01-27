const { Pool } = require("pg");
const { PGStorage } = require("@robotty/umzug-postgres-storage");
const Umzug = require("umzug");
const path = require("path");

const createUmzug = async (config) => {
  const dbPool = new Pool(config);
  const db = await dbPool.connect();

  return new Umzug({
    storage: new PGStorage(db, {
      tableName: "migrations",
      columnName: "id",
    }),
    migrations: {
      path: path.resolve(__dirname, "migrations"),
      params: [db],
    },
  });
};

module.exports = async (config) => {
  const umzug = await createUmzug(config);
  return umzug.up();
};

module.exports.down = async (config) => {
  const umzug = await createUmzug(config);
  return umzug.down();
};
