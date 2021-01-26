# wicked-coolkit

A fun, nostalgic web toolkit built on Heroku and Salesforce. Check out [wickedcoolkit.com](https://wickedcoolkit.com) for instructions on how to create your own.

This repo contains the `wicked-coolkit` package, which is both the Lightning Web Components and the accompanying API routes.

## Local Dev

Start simple by running `npm run watch`. This will start the project with a local development server.

Run `npm run build && npm run serve` to serve a production version of the built files.

Run `npm run dist` to package all the code and assets for publishing to npm.

All web components are within the [`client/modules`](./client/modules) folder. The Express server and related database and Salesforce routes can be found in the [`server`](./server) folder.

When running locally (and testing against a local database and Salesforce scratch org), you can create a `.env` file with the following variables:

```sh
DATABASE_URL=postgres://localhost:5432/heroku-wicked-coolkit
SALESFORCE_URL=https://test.salesforce.com
```
