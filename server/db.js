const normalizeUrl = require("./normalizeUrl");

// Hardcode user id for now since there is only one user per server
const USER_ID = "DEFAULT_USER";

module.exports.getHits = async ({ db }, site) => {
  const hits = await db.oneOrNone(
    "SELECT count from hit_counter WHERE site = $1",
    [normalizeUrl(site)]
  );
  return hits || { count: 0 };
};

module.exports.incrementHits = async ({ db }, site) => {
  const updated = await db.result(
    "UPDATE hit_counter SET count = count + 1 WHERE site = $1",
    [normalizeUrl(site)]
  );

  if (updated.rowCount === 0) {
    await db.none("INSERT INTO hit_counter(site, count) VALUES($1, $2)", [
      site,
      1,
    ]);
  }
};

module.exports.getAuth = async ({ db }) => {
  const auth = await db.oneOrNone(
    "SELECT access_token, refresh_token, instance_url FROM auth WHERE id = $1",
    [USER_ID]
  );

  return (
    auth && {
      accessToken: auth.access_token,
      refreshToken: auth.refresh_token,
      instanceUrl: auth.instance_url,
    }
  );
};

module.exports.saveAuth = async (
  { db, helpers },
  { accessToken, refreshToken, instanceUrl, host, userId }
) => {
  const authCs = new helpers.ColumnSet(
    [
      "id",
      "access_token",
      "instance_url",
      "refresh_token",
      "host",
      "sf_user_id",
    ],
    { table: "auth" }
  );

  const data = {
    id: USER_ID,
    access_token: accessToken,
    refresh_token: refreshToken,
    instance_url: instanceUrl,
    host,
    sf_user_id: userId,
  };

  const query = `${helpers.insert(data, authCs)}
        ON CONFLICT(id) DO UPDATE SET 
        ${authCs.assignColumns({ from: "EXCLUDED", skip: "id" })}`;

  await db.none(query);
};

module.exports.refreshAuth = async ({ db }, { accessToken, instanceUrl }) => {
  await db.none(
    `UPDATE auth SET access_token = $1, instance_url = $2 WHERE id = $3`,
    [accessToken, instanceUrl, USER_ID]
  );
};
