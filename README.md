# Domain Offer Page Deployer

Deploy "Domain For Sale" pages to your unused Cloudflare domains with a built-in offer submission system.

## Prerequisites

- Node.js installed
- A Cloudflare account
- One or more domains on Cloudflare
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) installed

## Quick Start

1. Clone and install

```bash
git clone [repository-url]
cd [repository-name]
npm install
```

2. Login to Wrangler

```bash
npx wrangler login
```

3. Set up Turnstile

   - Visit [Cloudflare Dashboard](https://dash.cloudflare.com/?to=/:account/turnstile)
   - Create a new widget or use an existing one
   - Note down both the Site Key and Secret Key

4. Deploy your first domain

```bash
npm run create-domain
```

## Command Line Options

Speed up deployment by providing configuration options:

```bash
npm run create-domain \
  --kv-id your-kv-id \
  --admin-password your-password \
  --turnstile-site-key your-site-key \
  --turnstile-secret-key your-secret-key
```

| Option                   | Description                             |
| ------------------------ | --------------------------------------- |
| `--kv-id`                | Your Cloudflare KV namespace ID         |
| `--admin-password`       | Password for accessing admin dashboards |
| `--turnstile-site-key`   | Cloudflare Turnstile Site Key           |
| `--turnstile-secret-key` | Cloudflare Turnstile Secret Key         |

## Managing Multiple Domains

- All domains can share the same:
  - KV namespace
  - Admin password
  - Turnstile configuration
- Each domain gets its own configuration in `domains/`
- Run the script multiple times to add more domains

## Post-Deployment

After successful deployment:

1. Access your domain's sale page at `https://your-domain.com`
2. View the admin dashboard at `https://your-domain.com/admin`
3. Manage offers through the dashboard
4. Monitor visit statistics

## Updating Configuration

### Change Admin Password

```bash
npx wrangler secret put ADMIN_PASSWORD -c domains/your-domain/wrangler.toml
```

### Update Turnstile Secret

```bash
npx wrangler secret put TURNSTILE_SECRET_KEY -c domains/your-domain/wrangler.toml
```

## Notes

- DNS propagation may take up to 48 hours
- Turnstile protection helps prevent spam submissions
- All offers are stored in Cloudflare KV storage
- The admin dashboard shows:
  - Total offers
  - Highest offer
  - Average offer
  - Visit statistics
