# Deployment Workflow

This project deploys to [Cloudflare Pages](https://pages.cloudflare.com/) using the `@cloudflare/next-on-pages` adapter.

## Branch Mapping

- `main` &rarr; Production build served on the custom domain (`https://jsontomodel.com`) and the Pages production URL (`https://jsontomodel-app.pages.dev`).
- `dev` &rarr; Dedicated development build served on a branch alias (for example `https://dev.jsontomodel-app.pages.dev`).
- Any other branch &rarr; Ephemeral preview builds accessible at `https://<branch-name>--jsontomodel-app.pages.dev`.

## Create the `dev` Branch Locally and Remotely

```bash
git checkout main
git pull origin main
git checkout -b dev
git push -u origin dev
```

> The `-u` flag wires the local branch to the remote branch so that `git push` and `git pull` work without extra arguments.

## Map the `dev` Branch to a Stable Preview URL

1. Sign in to the Cloudflare dashboard &rarr; Pages &rarr; **jsontomodel-app** project.
2. Open **Deployments** &rarr; **Branch builds** (or **Settings** &rarr; **Build & deploy** depending on UI version).
3. Under **Branch aliases**, add `dev` and set the alias hostname to `dev`.
   - Cloudflare will provision `https://dev.jsontomodel-app.pages.dev` automatically.
   - Optionally, attach a custom domain (e.g. `dev.jsontomodel.com`) in the **Custom domains** tab.

Once the alias is saved, every push to `dev` triggers a preview deployment that is promoted to the alias URL within a few seconds.

## Using the Environments

- Develop on `dev`, review your changes on `https://dev.jsontomodel-app.pages.dev`, and raise PRs from `dev` into `main`.
- Merge into `main` only when you are ready for the production build; Cloudflare will redeploy the production URL automatically.
- If you need environment-specific variables, define them in the Cloudflare dashboard under **Settings** &rarr; **Environment variables**. (Preview variables apply to `dev`; Production variables apply to `main`.)

## Troubleshooting

- If the build for the `dev` branch fails, open the deployment log from the Cloudflare dashboard to inspect the `npx @cloudflare/next-on-pages` output.
- Make sure the repository contains the latest `wrangler.toml`, as Cloudflare uses it for the preview functions runtime.
