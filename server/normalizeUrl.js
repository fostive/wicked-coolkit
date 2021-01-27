const normalizeUrl = require("normalize-url");

module.exports = (u) =>
  normalizeUrl(u, {
    stripHash: true,
    stripProtocol: true,
    sortQueryParameters: true,
    stripWWW: true,
    stripAuthentication: true,
  });
