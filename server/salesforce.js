const fetch = require("node-fetch");
const { Base64Encode } = require("base64-stream");
const normalizeUrl = require("./normalizeUrl");
const jsforce = require("jsforce");

// Utils
const last = (arr) => arr[arr.length - 1];

const wrapArr = (arr, index, dir) => {
  const nextIndex = index + dir;
  if (nextIndex >= arr.length) {
    return arr[0];
  }
  if (nextIndex < 0) {
    return last(arr);
  }
  return arr[nextIndex];
};

const findWebringUrlIndex = (webring, url) => {
  return url ? webring.map(normalizeUrl).indexOf(normalizeUrl(url)) : -1;
};

// Custom errors that should be responded to differently on the client
class AuthError extends Error {
  constructor() {
    super(
      'The component could not make a connection to Salesforce. Please <a href="{{host}}/sf/auth?redirect_host={{host}}" target="_blank">authenticate</a> to continue setup.'
    );
    this.jsfErrorCode = "SF_AUTH";
    this.statusCode = 401;
  }
}

class SetupError extends Error {
  constructor(message, sf) {
    super(
      `The component could not fetch the data from Salesforce. Please <a href="${sf.instanceUrl}" target="_blank">enter your data</a> to continue setup.`
    );
    this.internalMessage = message;
    this.jsfErrorCode = "SF_SETUP";
    this.statusCode = 500;
  }
}

// JSForce methods
const getContact = async (sf) => {
  const c = await sf
    .query(
      `SELECT Id, Name, Email__c, Bio__c,
            Picture_Content_Version_ID__c, Feats_of_Strength__c,
            Main_Website__c, Twitter_Username__c, Instagram_Username__c, GitHub_Username__c, LinkedIn_Username__c, CodePen_Username__c
            FROM Card__c
            LIMIT 1`
    )
    .then(({ records }) => records[0]);

  if (!c.Id) {
    throw new SetupError("No cards could be found", sf);
  }

  return {
    id: c.Id,
    name: c.Name,
    email: c.Email__c,
    bio: c.Bio__c,
    pictureId: c.Picture_Content_Version_ID__c,
    strengths: c.Feats_of_Strength__c.split(",")
      .map((t) => t.trim())
      .filter(Boolean),
    website: c.Main_Website__c,
    twitter: c.Twitter_Username__c,
    instagram: c.Instagram_Username__c,
    github: c.GitHub_Username__c,
    linkedin: c.LinkedIn_Username__c,
    codepen: c.CodePen_Username__c,
  };
};

const getStickers = (sf, id) => {
  return sf
    .query(
      `SELECT Id, Name, Image_Alt_Text__c
            FROM Sticker__c
            WHERE Id IN
            (SELECT Sticker__c
            FROM Card_Sticker_Association__c
            WHERE Card__c = '${id}')`
    )
    .then(({ records }) => records)
    .then((stickers) =>
      stickers.map((sticker) => ({
        id: sticker.Id,
        path: sticker.Name,
        alt: sticker.Image_Alt_Text__c,
      }))
    );
};

const getImage = async (sf, imageId) => {
  const path = `/services/data/v50.0/sobjects/ContentVersion/${imageId}`;
  const [imageMeta, base64Image] = await Promise.all([
    sf.request(path),
    fetch(`${sf.instanceUrl}${path}/VersionData`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${sf.accessToken}`,
      },
    })
      .then((res) => {
        if (res.ok) {
          return res.body;
        }
        throw new Error(
          `Error fetching image data: ${res.status} ${res.statusText}`
        );
      })
      .then(
        (body) =>
          new Promise((resolve, reject) => {
            let data = "";
            body
              .pipe(new Base64Encode())
              .on("data", (d) => (data += d))
              .on("end", () => resolve(data))
              .on("error", reject);
          })
      ),
  ]);

  return `data:image/${imageMeta.FileType.toLowerCase()};base64,${base64Image}`;
};

const _getWebringWebsites = (sf, webringId) => {
  return sf
    .query(
      `SELECT URL__c, Name
            FROM Website__c
            WHERE Id IN
            (SELECT Website__c
            FROM Website_Webring_Association__c
            WHERE Webring__c = '${webringId}')
            ORDER BY CreatedDate`
    )
    .then(({ records }) => records)
    .then((websites) => {
      if (!websites.length) {
        throw new SetupError("No websites could be found in the webring", sf);
      }
      return websites.map((w) => w.URL__c);
    });
};

const getWebring = async (sf, currentWebsite) => {
  const webring = await sf
    .query(
      `SELECT Id, Name, Description__c
            FROM Webring__c
            LIMIT 1`
    )
    .then(({ records }) => records[0])
    .then(
      (w) =>
        w && {
          id: w.Id,
          name: w.Name,
          description: w.Description__c,
        }
    );

  if (!webring) {
    throw new SetupError("No webrings have been created", sf);
  }

  const websites = await _getWebringWebsites(sf, webring.id);
  const currentIndex = findWebringUrlIndex(websites, currentWebsite);
  const prevWebsite =
    currentIndex === -1 ? last(websites) : wrapArr(websites, currentIndex, -1);
  const nextWebsite =
    currentIndex === -1 ? websites[0] : wrapArr(websites, currentIndex, 1);

  return {
    name: webring.name,
    description: webring.description,
    prevWebsite,
    nextWebsite,
  };
};

const createHostField = async (sf) => {
  await sf.metadata.create("CustomField", [
    {
      fullName: "User.HerokuAppName__c",
      label: "Heroku App Name",
      type: "Text",
      length: 80,
    },
  ]);
};

const updateHost = async (sf, { userId, host }) => {
  await sf.sobject("User").update({
    Id: userId,
    HerokuAppName__c: host,
  });
};

// All query methods that will be exposed to the server
const methods = {
  getContact,
  getStickers,
  getImage,
  getWebring,
  updateHost,
};

module.exports.init = ({ loginUrl, authUrl }, db) => {
  let sf = null;

  const connect = (c) => {
    if (c && c.instanceUrl && c.accessToken) {
      sf = new jsforce.Connection({
        instanceUrl: c.instanceUrl,
        accessToken: c.accessToken,
      });
    }
  };

  const refresh = async () => {
    const auth = await db.getAuth();

    if (!auth || !auth.refreshToken) {
      throw new AuthError("No refresh token was found");
    }

    const params = new URLSearchParams();
    params.append("refresh_token", auth.refreshToken);
    params.append("login_url", loginUrl);

    const res = await fetch(`${authUrl}/refresh`, {
      method: "post",
      body: params,
    });

    if (!res.ok) {
      throw new AuthError(
        `Error refreshing token: ${res.status} ${res.statusText}`
      );
    }

    const refreshAuth = await res.json().then((d) => ({
      accessToken: d.access_token,
      instanceUrl: d.instance_url,
    }));

    await db.refreshAuth(refreshAuth);
    connect(refreshAuth);

    return {
      ...auth,
      ...refreshAuth,
    };
  };

  const login = async () => {
    connect(await db.getAuth());
    if (sf) {
      await createHostField(sf);
    }
  };

  const wrapApiMethod = (rawMethod) => async (...args) => {
    // try to login first
    if (sf === null) {
      await login();
    }

    const method = () => {
      // Check if sf instance has been created, if not throw an error
      if (sf === null) {
        throw new AuthError();
      }

      return rawMethod(sf, ...args);
    };

    return method()
      .catch((e) => {
        // If any API calls results in a refresh token error
        // attempt to refresh once
        if (e.errorCode === "INVALID_SESSION_ID") {
          return refresh();
        }

        throw e;
      })

      .then((res) => {
        // If refresh is successful, attempt api call again
        if (res && res.accessToken) {
          return method();
        }

        return res;
      })
      .catch((e) => {
        console.log("JSForce Error:", e);

        // These errors mean data has not been setup yet or is incorrect
        if (["INVALID_FIELD", "INVALID_TYPE"].includes(e.errorCode)) {
          throw new SetupError(e.message, sf);
        }

        throw e;
      });
  };

  return {
    ...Object.keys(methods).reduce((acc, key) => {
      acc[key] = wrapApiMethod(methods[key]);
      return acc;
    }, {}),
    login,
    connect,
    get connection() {
      return sf;
    },
  };
};
