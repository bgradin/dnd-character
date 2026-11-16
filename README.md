# DnD Interactive Character Sheet

Forked from https://moonbyt3.github.io/dnd-character.

## Local Development

Use Node.js 24 (`nvm use` with nvm), then install dependencies with `yarn`.

To start the app, run `yarn dev`.

Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

Run the SSO/backend server at `http://localhost:5000`. Login and registration
open on that server and return to the app on port 3000; the development server
proxies `/api` requests to port 5000.

In production, the app runs at `https://dnd.gradinware.com` and uses
`https://www.gradinware.com` for login and registration. SSO receives the full
app URL (including its path, query, and fragment) as `returnUrl`. The SSO server
must allow this return origin and share its session with the app subdomain.

Build production assets with `yarn build`.
