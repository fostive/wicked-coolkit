require("dotenv").config();
const express = require("express");
const server = require("./server/index.js");

const { start, app } = server({
  loginUrl: process.env.SALESFORCE_URL,
  authUrl: process.env.SALESFORCE_AUTH_URL,
  pg: process.env.DATABASE_URL,
  __overrideHost: "wickedcoolkit.com",
});

app.use(express.static("./public"));

// The API redirects to /getting-started after auth but
// since we dont have that page when testing here
// go back to the index
app.get("/getting-started", (req, res) => res.redirect("/"));

start()
  .then(({ port }) =>
    console.log(
      `Server started on ${
        process.env.NODE_ENV === "production" ? "port " : "http://localhost:"
      }${port}`
    )
  )
  .catch((e) => {
    console.error("Server could not be started:", e);
  });
