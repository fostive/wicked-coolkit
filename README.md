# wicked-coolkit

A fun, nostalgic web toolkit built on Heroku and Salesforce. Check out [wickedcoolkit.com](https://wickedcoolkit.com) for instructions on how to create your own.

This repo contains the `wicked-coolkit` package, which is both the Lightning Web Components and the accompanying API routes.

## Developing

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

## Publishing

You can use the [`np` package](https://www.npmjs.com/package/np) to make publishing easier. Install the package and then you can run:

```
np [patch | minor | major] --no-cleanup --no-tests
```

This will publish and open a GitHub release draft.

Once published [wickedcoolkit.com](https://github.com/fostive/wickedcoolkit.com) and [wicked-coolkit-user][wicked-coolkit-user] should be deployed with the new version so that any new changes are deployed automatically instead of waiting for CDN changes to propagate via `unpkg`.

### Updating

If you are updating this package in your repo, you can check out the [releases](https://github.com/fostive/wicked-coolkit/releases) to see what's changed. This repo adheres to semver so it should be safe to update except between major versions.

If you are updating your repo that you deployed via [wicked-coolkit-user][wicked-coolkit-user] to a new major version, you'll want to make sure that the installed version of `wicked-coolkit` matches that version in the script tags on your page.

So if in your repo you run `npm install` to get the latest version and you get `2.0.4`, you'll need to go to your site and make sure your script tags reference that version in the src `unpkg.com/wicked-coolkit@^2.0.4`.

```
> npm install wicked-coolkit@latest

+ wicked-coolkit@2.0.4
updated 1 package and audited 584 packages in 4.525s
```

```html
<script
  type="module"
  async
  src="https://unpkg.com/wicked-coolkit@^2.0.4/dist/webring.js"
></script>
```

If you don't know what version you have installed, you can go to `/getting-started` on your server and it will show you the correct code to copy and paste into your site.

[wicked-coolkit-user]: https://github.com/fostive/wickedcoolkit.com
