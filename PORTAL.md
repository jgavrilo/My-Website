# Admin Portal

A separate admin area for managing **clients** and their structured **workspace** (logins, systems dashboard, material folders, tools & website links). It is not linked from the public portfolio and is protected by admin login.

## Client workspace structure

Each client has a `workspace` object:

```ts
workspace: {
  logins: [],    // credentials (label, url, username, password, notes)
  systems: [],   // systems dashboard (name, status, url, description)
  folders: [],   // material folders, each with items[]
  links: [],     // tools and websites (name, url, kind)
}
```

See `lib/portal/types.ts` for full TypeScript definitions.

## Routes

| URL | Description |
|-----|-------------|
| `/portal/login` | Admin sign-in |
| `/portal` | Dashboard |
| `/portal/clients` | Client list and create |
| `/portal/clients/[id]` | Client detail and materials |

## Local setup

1. Copy environment variables:

   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` and set strong values for `PORTAL_ADMIN_PASSWORD` and `PORTAL_SESSION_SECRET`.

3. Run the dev server:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000/portal/login](http://localhost:3000/portal/login) and sign in.

Client data is stored in `data/clients.json` on the server.

## Deployment note

The public site is deployed to **GitHub Pages** as a static export. The admin portal uses **API routes** and **server-side auth**, so it requires a Node.js host (e.g. [Vercel](https://vercel.com), Railway, or a VPS). It will not work on GitHub Pages alone.

Options:

- Deploy the full Next.js app to Vercel (portfolio + portal on one domain).
- Keep GitHub Pages for the portfolio and host the portal on a separate subdomain with a Node deployment.

Do not commit `.env.local` or use default passwords in production.
