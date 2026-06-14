# Tender Saathi

A Sites-ready customer portal for:

- showing customers what tender and order work the service manages
- opening a login/sign up panel
- generating a demo customer ID on sign up
- showing a customer-wise tender and order dashboard
- switching the public site and dashboard between English and Hindi
- exporting dashboard data to Excel from the browser
- assigning a separate folder link to every tender
- surfacing growth analysis, alerts, team tasks, and competitor quote signals

## Stack

- `vinext` + Next.js app router
- Cloudflare Worker-compatible Sites output
- Cloudflare D1 schema scaffolded in `db/schema.ts`
- Browser-side Excel export via `xlsx`

## Local commands

```bash
npm install
npm run dev
npm run build
npm run db:generate
```

## Current implementation

- `app/page.tsx` renders the dashboard
- `app/components/customer-portal.tsx` contains the customer-facing UI, English/Hindi toggle, public pages, auth drawer, dashboard, add-tender form, tables, folder view, analytics, alerts, and team board
- `lib/tender-data.ts` supplies seeded customer, tender, order, and table-column data
- API-readiness content and internal API routes have been removed for the current simple flow

## Current flow

- Public pages cover home, features, growth analysis, plans, and resources.
- English/Hindi language toggle is available in the upper corner and stays active after login.
- Login or sign up opens from the side drawer.
- Sign up creates a demo unique customer ID.
- Dashboard shows live, upcoming, working, filed, and missed tender counts.
- Tenders can be added by tender number and optional PDF upload.
- Each tender gets a separate folder path.
- Orders show contract, BG, courier, and CRAC columns.
- Analysis shows pipeline value, fit score, quote gap, competitor signals, and recommended actions.
- Alerts and team views show due-date, BG, EMD, pre-bid, and task follow-up items.

## Persistence shape

`.openai/hosting.json` now declares D1 as `DB`. The schema includes:

- `customers`
- `customer_tenders`
- `customer_orders`
- `tender_files`

That gives the next build a durable place to store real customer accounts, tender records, order records, and file links.
