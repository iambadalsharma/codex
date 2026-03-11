# Tender Pulse Desk

Yeh project ek lightweight tender discovery aur bid management dashboard hai jo public CPPP tender listings ko keyword ke basis par search karta hai.

## Features

- Multiple keywords ke saath live tender search
- Excel-compatible CSV export for search results
- Selected bids ke liye stage-wise management
- Har tracked bid ka complete activity history
- Browser local storage mein quick persistence

## Free Deployment Recommendation

`Cloudflare Pages` sabse practical free option hai kyunki:

- frontend globally available rehta hai
- serverless functions sleep-based shared hosting jaisa behave nahi karte
- static assets aur lightweight API proxy ek hi project mein deploy ho jata hai

Important: truly dedicated "24x7 private server" free plan par milna realistic nahi hota. Is app ka frontend hamesha accessible rahega, aur tender search request aane par serverless function turant run hoga.

## Deploy Steps

1. Is project ko GitHub repo mein push kijiye.
2. Cloudflare Pages account mein login kijiye.
3. `Create a project` -> `Connect to Git`.
4. Apna repo select kijiye.
5. Build settings mein:
   - Framework preset: `None`
   - Build command: blank
   - Build output directory: `/`
6. Deploy kijiye. `functions/api/tenders.js` automatically Pages Function ki tarah kaam karega.

## Current Data Source

- Public CPPP / ePublishing tender search page: [https://eprocure.gov.in/epublish/app](https://eprocure.gov.in/epublish/app)

## Limitations

- Source portal ki structure change hui to parsing update karni padegi.
- Tracker abhi browser-local hai, isliye multi-user login/database included nahi hai.
- Agar aap chahen to next phase mein login system + cloud database + reminders bhi add kiye ja sakte hain.
