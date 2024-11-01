# Domain Offer Page Deployer

Deploy "Domain For Sale" pages to your unused Cloudflare domains with a built-in offer submission system.

## Prerequisites

- Node.js installed
- A Cloudflare account
- One or more domains on Cloudflare
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) installed

## Setup

1. Clone this repository

```bash
git clone [repository-url]
cd [repository-name]
```

2. Install dependencies

```bash
npm install
```

3. Login to Wrangler

```bash
npx wrangler login
```

4. Set up Turnstile
   - Visit [Cloudflare Dashboard](https://dash.cloudflare.com/?to=/:account/turnstile)
   - Click "Add Site" to create a new widget
   - Note down both the Site Key and Secret Key

## Deploying to Your Domains

Run the domain creation script:

```bash
npm run create-domain
```

The script will guide you through:

1. Setting up an admin password (for accessing the admin dashboard)
2. Creating or using an existing KV namespace
3. Configuring your domain
4. Setting up Turnstile protection
5. Deploying to Cloudflare Workers

### Optional: Batch Setup

You can speed up deployment for multiple domains by providing the KV namespace ID and admin password as arguments:

```bash
npm run create-domain --kv-id your-kv-id --admin-password your-password
```

## Post-Deployment

After deployment:

- Your domain will show a "For Sale" page
- Potential buyers can submit offers through the protected form
- Access the admin dashboard at `https://your-domain.com/admin`
- Review and manage offers through the admin dashboard

## Managing Multiple Domains

- All domains can share the same KV namespace and admin password
- Each domain gets its own configuration in the `domains/` directory
- Offers for each domain are stored separately in KV storage

## Updating Admin Password

To change the admin password for a specific domain:

```bash
npx wrangler secret put ADMIN_PASSWORD -c domains/your-domain/wrangler.toml
```

## Notes

- DNS propagation may take up to 48 hours
- Turnstile protection helps prevent spam submissions
- All offers are stored in Cloudflare KV storage
- The admin dashboard is protected by the password you set during setup
