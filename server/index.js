const compression = require("compression");
const helmet = require("helmet");
const express = require("express");
const cors = require("cors");
const deepmerge = require("deepmerge");
const pgp = require("pg-promise")();
const { init: sfInit } = require("./salesforce");
const _db = require("./db");
const migrate = require("./migrate");

const bindMethods = (obj, ...params) =>
  Object.keys(obj).reduce((acc, key) => {
    acc[key] = (...args) => obj[key](...params, ...args);
    return acc;
  }, {});

module.exports = ({
  pg: _pgConfig,
  loginUrl = "https://login.salesforce.com",
  authUrl = "https://wickedcoolkit-oauth.herokuapp.com",
  stickerWebringUrl = "https://wicked-coolkit-webring.herokuapp.com/sticker",
  port = process.env.PORT || 3002,
  helmet: helmetConfig = {},
  __overrideHost,
}) => {
  const pgConfig =
    typeof _pgConfig === "string" ? { connectionString: _pgConfig } : _pgConfig;

  if (!pgConfig || !pgConfig.connectionString) {
    throw new Error(
      `Must specify a \`pg\` connection string. Received ${_pgConfig}`
    );
  }

  if (!Object.prototype.hasOwnProperty.call(pgConfig, "ssl")) {
    pgConfig.ssl = pgConfig.connectionString.match(/\blocalhost\b/)
      ? false
      : { rejectUnauthorized: false };
  }

  const app = express();
  const db = bindMethods(_db, { ...pgp, db: pgp(pgConfig) });
  const sf = sfInit({ loginUrl: loginUrl, authUrl: authUrl }, db);

  const apiHandler = (fn) => async (req, res) => {
    try {
      const apiRes = await fn(req, res);
      return apiRes;
    } catch (e) {
      // Handle errors from the JSForce library by showing the specific message
      if (e.jsfErrorCode) {
        res.statusCode = e.statusCode || 500;
        return res.json({
          message: e.message,
          code: e.jsfErrorCode,
        });
      }

      console.error("API Error:", e);
      res.statusCode = 500;
      return res.json({ error: "An error occurred" });
    }
  };

  if (process.env.NODE_ENV === "production") {
    app.use(
      helmet(
        deepmerge(
          {
            contentSecurityPolicy: {
              directives: deepmerge(
                helmet.contentSecurityPolicy.getDefaultDirectives(),
                {
                  "script-src": ["unpkg.com"],
                  "img-src": ["unpkg.com"],
                }
              ),
            },
          },
          helmetConfig
        )
      )
    );
  }

  app.use(compression());
  app.use(cors());

  app.get(
    "/api/hitCounter",
    apiHandler(async (req, res) => {
      const hits = await db.getHits(req.query.site);
      return res.json(hits);
    })
  );

  app.post(
    "/api/hitCounter",
    apiHandler(async (req, res) => {
      await db.incrementHits(req.query.site);
      const hits = await db.getHits(req.query.site);
      return res.json(hits);
    })
  );

  app.get(
    "/api/tradingCard",
    apiHandler(async (req, res) => {
      const contact = await sf.getContact();

      const [img, stickers] = await Promise.all([
        sf.getImage(contact.pictureId),
        sf.getStickers(contact.id),
      ]);

      return res.json({
        ...contact,
        img,
        stickers,
      });
    })
  );

  app.get(
    "/api/sticker",
    apiHandler(async (req, res) => {
      res.redirect(`${stickerWebringUrl}/${req.query.name}`);
    })
  );

  app.get(
    "/api/webring",
    apiHandler(async (req, res) => {
      const webring = await sf.getWebring(req.query.site);
      res.json(webring);
    })
  );

  app.get("/api/auth", (req, res) => {
    res.json({ auth: !!sf.connection });
  });

  app.get("/sf/auth", (req, res) => {
    res.redirect(
      `${authUrl}/connect?redirect_uri=${req.query.redirect_host}/sf/auth-callback&login_url=${loginUrl}`
    );
  });

  app.get("/sf/auth-callback", async (req, res) => {
    const {
      access_token: accessToken,
      refresh_token: refreshToken,
      instance_url: instanceUrl,
      redirect_uri: redirectUri,
      user_id: userId,
    } = req.query;

    if (!accessToken || !refreshToken || !instanceUrl) {
      res.redirect("/getting-started?auth_error=true");
      return;
    }

    await sf.connect({
      instanceUrl,
      accessToken,
    });

    const host = new URL("/", redirectUri).host;

    await Promise.all([
      db.saveAuth({
        instanceUrl,
        accessToken,
        refreshToken,
        host,
        userId,
      }),
      // This host is a special last-day hack
      // to allow for our card at wickedcoolkitapi.herokuapp.com to
      // redirect somewhere else when it gets loaded as part
      // of a sticker webring
      sf.updateHost({ userId, host: __overrideHost || host }),
    ]);

    res.redirect("/getting-started?auth_success=true");
  });

  const pages = {
    card: "/lightning/n/Trading_Card",
    webring: "/lightning/n/Webring",
    theme: "/lightning/setup/ThemingAndBranding/home",
    import: "/lightning/setup/DataManagementDataImporter/home",
  };

  app.get("/sf/setup", (req, res) => {
    const instanceUrl = sf && sf.connection && sf.connection.instanceUrl;
    const { redirect_host, page } = req.query;
    const instancePage = pages[page] || pages.card;
    res.redirect(
      instanceUrl
        ? instanceUrl + instancePage
        : `/sf/auth?redirect_host=${redirect_host}`
    );
  });

  const start = async () => {
    await migrate(pgConfig);
    await sf.login();
    await new Promise((resolve) => app.listen(port, resolve));
    return { port };
  };

  return {
    start,
    app,
    sf,
    db,
  };
};
