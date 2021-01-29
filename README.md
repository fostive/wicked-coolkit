# wicked-coolkit

A fun, nostalgic web toolkit built on Heroku and Salesforce. Check out [wickedcoolkit.com](https://wickedcoolkit.com) for instructions on how to create your own.

This repo contains the `wicked-coolkit` package, which is both the Lightning Web Components and the accompanying API routes.

## Developing

### Local Dev

Start by running `npm run watch`. This will start a watcher to compile the Lightning Web Components and a watcher for the API server.

Run `npm run build && npm run serve` to serve a production version of the built files.

Run `npm run dist` to package all the code and assets for publishing to npm. This is also run automatically when running `npm publish`.

All web components are within the [`client/modules`](./client/modules) folder. The Express server and related database and Salesforce routes can be found in the [`server`](./server) folder.

When running locally (and testing against a local database or Salesforce scratch org), you can create a `.env` file with the following variables:

```sh
DATABASE_URL=postgres://localhost:5432/heroku-wicked-coolkit
SALESFORCE_URL=https://test.salesforce.com
```

### Publishing

You can use the [`np` package](https://www.npmjs.com/package/np) to make publishing easier. Install the package and then you can run:

```
np [patch | minor | major] --no-cleanup --no-tests
```

This will publish and open a GitHub release draft.

Once published [wickedcoolkit.com](https://github.com/fostive/wickedcoolkit.com) and [wicked-coolkit-user][wicked-coolkit-user] should be run with `npm install wicked-coolkit@latest` and deployed with the new version. This will force any new changes to be updated automatically instead of waiting for CDN changes to propagate via `unpkg`.

### Updating

If you are updating this package in your repo, you can check out the [releases](https://github.com/fostive/wicked-coolkit/releases) to see what's changed. This repo adheres to semver so it should be safe to update except between major versions.

If you deployed to Heroku you can run the following to checkout the latest code and deploy it. The only prerequisite is that you [install the Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli).

```sh
git clone git@github.com:fostive/wicked-coolkit-user.git
cd wicked-coolkit-user
heroku git:remote --app=YOUR_HEROKU_APP_NAME
git push heroku main
```

### Breaking Changes

If you are updating your repo that you deployed via [wicked-coolkit-user][wicked-coolkit-user] to a new major version, you'll want to make sure that the installed version of `wicked-coolkit` matches that version in the script tags on your page.

So if in your repo has `2.0.4` installed, you'll want to update any Hit Counter and Webring `<script>` tags on your sites so that the `src` contains `wicked-coolkit@^2.0.4`.

The easiest way to find out what version you have installed is to go to `/getting-started` on your server and it will show you the correct code to copy and paste into your site.

Here's an example script tag for the Webring that is pulling in version 2.0.4.

```html
<script
  type="module"
  async
  src="https://unpkg.com/wicked-coolkit@^2.0.4/dist/webring.js"
></script>
```

[wicked-coolkit-user]: https://github.com/fostive/wickedcoolkit.com
