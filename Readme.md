# NestQuestors

A rental marketplace for bachelors in India. Renters describe the home they want in plain words, see which homes welcome bachelors, save favourites, and message owners directly.

## Features

**For renters**
- **Smart search:** turns "2BHK furnished in Pune under 25k" into filters and shows what it understood. It uses rules written for this app.
- **AI assistant:** chat in plain language. With an OpenAI key it searches live listings through tool calling. Without a key it falls back to smart search.
- **Map search:** browse price pins, move the map to search that area, or look near your location.
- **Stay types:** full homes, private rooms, shared rooms and PG.
- **Fair rent check:** compares each rent with similar homes in the city.
- **Move-in cost:** adds up rent, deposit and maintenance before you visit.
- **Visits:** request a date and time, and the owner confirms or declines.
- **Compare:** up to 3 homes side by side.
- **Saved searches:** get notified when a new home matches.
- **Recommendations:** ranks homes in your preferred city from what you saved and viewed.
- **Rent insights:** average rent by size and area for each city.

**For owners**
- Create, edit and delete rentals with photos, a map pin, amenities, house rules and offers.
- Respond to messages and visit requests from the dashboard.
- Track views, saves, messages and visits for each listing.

## Tech stack

React 18, Vite, Redux Toolkit, Tailwind CSS, Leaflet, OpenStreetMap, Node.js, Express, MongoDB geospatial queries, Mongoose, OpenAI Responses API, JWT cookies, Zod, Helmet, Playwright.

## Run locally

You need Node.js 20 or newer. MongoDB and Cloudinary are optional for local development.

```bash
npm run setup
npm run dev
```

Open http://localhost:5173. The first run creates 1,200 demo rentals, and the sign-in page has Owner and Renter demo buttons.

Local data is stored in `.data/`, and uploads in `api/uploads/`. To use your own services, copy `.env.example` to `.env` and fill it in.

## AI assistant

Add your key to a `.env` file in the project root. Never commit this file.

```bash
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-6-astra
```

Restart the server after changing it. The key stays on the server and is never sent to the browser.

## Tests

```bash
npm test            # API, search and recommendation tests
npm run build       # needed once before the browser test
npm run test:e2e    # two-user flow in Chrome
```

## Deploy

Set `MONGO` and `JWT_SECRET` in the environment. Add the Cloudinary variables too, because most hosts wipe local files on each deploy. Add `OPENAI_API_KEY` to enable the AI assistant. The public OpenStreetMap tile server suits demos; use a commercial tile provider for heavy traffic.

```bash
npm install --omit=dev
npm run build
npm start
```

The server hosts the built client on one port. Production starts empty. For a portfolio demo, set `SEED_DEMO=true` to add 1,200 clearly labelled demo rentals. The site shows a banner, and the demo owner gets a random password.
