# Movie Tracker

Track the movies you want to see in theaters and whether any screenings are available.
Vite · React 19 · TypeScript · Tailwind v4 on the front, a Node (Hono) API + scraper on the back,
PostgreSQL for the data, all in Docker.

## Run it with Docker

```bash
cp .env.example .env             # then set POSTGRES_PASSWORD (a first run without it fails with a clear message)
docker compose up --build -d     # the app is on http://localhost:8787
docker compose logs -f api       # watch the syncs
docker compose down              # stop (your data stays in the `db-data` volume)
```

Three services, one private network:

| service | image | role | reachable from outside |
|---|---|---|---|
| `web` | nginx (unprivileged) | serves the built web app, proxies `/api` to `api` | yes, port `8787` |
| `api` | Node | REST API, AlloCiné scraper, daily cron | no |
| `db` | PostgreSQL 17 | all the data, including ticket files | no |

Start-up is ordered by health checks (`db` → `api` → `web`). The API creates and migrates the schema itself
(`server/store/postgres/migrations.ts`), runs as a non-root user and shuts down cleanly on `SIGTERM`. nginx resolves
the API at request time, so restarting or redeploying `api` alone needs no restart of `web`.

### Configuration

Set these in `.env` (see `.env.example`):

| variable | default | |
|---|---|---|
| `POSTGRES_PASSWORD` | *(required)* | password of the database |
| `WEB_PORT` | `8787` | port the app is served on |
| `SCRAPE_CRON` | `0 4 * * *` | daily sync, cron syntax |
| `SCRAPE_TIMEZONE` | `Europe/Paris` | timezone of the cron and of "today" |
| `SCRAPE_DELAY_MS` | `1200` | pause between two requests to AlloCiné |
| `ALLOCINE_FETCH_SHOWTIMES` | `true` | `false` = never touch the showtimes endpoint (see below) |

Further `api` settings (compose does not expose them; add them under `api.environment` if you need them):
`SCRAPE_STALE_HOURS` (24: sync at start-up if the last good sync is older), `ALLOCINE_MAX_CITIES` (30),
`SCRAPER_USER_AGENT`. There is no date limit: every city is followed day by day until AlloCiné has no later showtime.

### Before putting it on the internet

- **There is no login.** Anyone who can open the URL can add/remove movies and trigger syncs. Put it behind your
  platform's auth (reverse proxy basic auth, Cloudflare Access, a VPN…) or add authentication to `server/app.ts`.
- Terminate **HTTPS** at your proxy / platform (nginx here speaks plain HTTP).
- Use a real `POSTGRES_PASSWORD` and back up the `db-data` volume (or `pg_dump`) if the data matters to you.

### ⚠️ About AlloCiné's terms

AlloCiné's `robots.txt` disallows `/_/` for all crawlers, and that is where the showtimes JSON lives; the city list
(`/seance/…`) is not disallowed. Their terms of use also restrict automated extraction. This project is meant for
personal use at a low rate (one request every ~1.2 s, a handful of films, once a day), but whoever runs it is
responsible for that. Set `ALLOCINE_FETCH_SHOWTIMES=false` to stay on the allowed pages only (no hours, existing
screenings are left untouched).

## The three tabs

**Finder** (`/`) shows whether the movies on your watch list have screenings, per city and cinema.
**Planner** (`/planner`) is where you choose: every upcoming finder screening and every ticket on one timeline.
**Tickets** (`/tickets`) keeps track of the screenings you booked.

- **Planner:** each screening is *plan it* (it becomes a **tentative** ticket), then *book* (it becomes a booked
  ticket, which then shows in the tickets tab, where you add the QR code and seats). A screening that clashes with
  a ticket you hold is hatched (it can still be planned); one that only clashes with something you are considering is
  paler. *Hide clashes* leaves them out. A tentative ticket is an ordinary ticket with `status = tentative`, so the
  tickets tab and its clash checks only ever see what is booked. The finder also has a *plan it* button, and hides
  screenings that are already booked or planned.
- **End times:** a screening's end is the film's length (read from its AlloCiné page) plus 15 minutes of ads.

- A ticket stores its own copy of the details (title, cinema, time, room, seats…). It does not point at a finder
  screening, because those are replaced on every sync, so you can add a ticket for anything, finder or not.
- **From the finder:** each screening has an *I booked this* button that opens the ticket form pre-filled. Screenings
  you already hold a ticket for show *booked*.
- **Overlaps:** a ticket's slot runs from its start time to the end time printed on it (2 h 15 if there is no end
  time, and for finder screenings, which have none). Two tickets **overlap** if their slots intersect. Back-to-back screenings in the same cinema are
  fine, and so is a short gap between two cinemas: only a real overlap is a clash. The warning shows on the
  tickets themselves (a pink strip along the bottom of the card),
  in the ticket panel, while you fill in the form, and on finder screenings that would clash with a ticket you
  already have. There is no separate summary box.
- **Ticket file:** attach the QR screenshot or PDF (png, jpeg, webp or pdf, 8 MB max); *show ticket* opens it large
  to scan at the door. Files are stored in the database (`ticket_files`), so one backup covers everything.
- Past tickets move to a collapsed *past tickets* section.

## How screenings get here

```
AlloCiné ──scraper──▶ sync service ──▶ PostgreSQL ──▶ /api/tracker ──▶ React app
              ▲            ▲
         daily cron    "refresh" button · adding a movie · changing cities · stale-at-boot catch-up
```

1. **Cities** — `https://www.allocine.fr/seance/film-<id>/` lists the cities where the film plays ("Par ville").
2. **Showtimes** — for each chosen city and each day with showtimes, the scraper reads the JSON behind the city page.
   Cities already covered by a parent city ("Paris 5e" ⊂ "Paris") are skipped and showtimes are de-duplicated.
3. Each movie's screenings are **replaced atomically** after a successful scrape. If a scrape fails, the previous
   screenings are kept and the issue is shown in the UI.

Syncs run one at a time; a request made while one is running (changing cities, adding a movie) is queued.

- Add a movie by pasting its AlloCiné link (or film id): title, cover and director are fetched automatically.
- Covers can be chosen or replaced in every dialog that shows a poster (add movie, edit movie, add/edit ticket):
  png, jpeg or webp up to 5 MB. Uploads are stored by content hash (`covers` table) and served immutable from
  `/api/covers/<sha256>`. The pencil in the movie panel edits a movie's title and cover.
- Remove a movie with the trash button in its panel.
- **Cities** are a global setting shared by every movie (pin button above the grid). The picker offers the cities seen
  so far on your movies' AlloCiné pages; with none chosen, every city is scraped (capped). AlloCiné's search is
  proximity-based, so choosing "Paris" also returns neighbouring cinemas; each shows under its own city.
- The movie panel groups screenings by city, then by cinema.

## Develop

```bash
npm install
npm run dev        # web on http://localhost:5173 (proxies /api), API on :8787, both with hot reload
npm test           # unit tests (vitest)
npm run scrape     # one-off sync from the terminal
npm run build      # typecheck + web build + server bundle;  npm start  runs the production build
```

Without `DATABASE_URL`, the API stores everything in a JSON file under `data/`: handy for a quick local run, and what the
unit tests use. Set `DATABASE_URL=postgres://…` to use PostgreSQL. Both implementations pass the same contract tests
(`server/store/repositoryContract.ts`); the PostgreSQL ones run against a real database when `TEST_DATABASE_URL` is set:

```bash
docker run -d --rm --name pg-test -p 55432:5432 -e POSTGRES_PASSWORD=test postgres:17-alpine
TEST_DATABASE_URL=postgres://postgres:test@localhost:55432/postgres npm test
docker stop pg-test
```

## Architecture

```
shared/        types + AlloCiné link parsing used by both sides
server/
  scraper/     httpClient (polite, retries), urls, parsers (pure, tested on fixtures), allocineScraper
  services/    syncService (single-flight + queue, progress, per-movie isolation), movieService
  store/       TrackerRepository + TicketImageStore interfaces; postgres/ (pool, migrations, repository, files)
               and a JSON-file fallback; seed
  app.ts       HTTP routes   scheduler.ts  cron + catch-up   container.ts  composition root
docker/        nginx.conf, security-headers.conf
src/
  types/ lib/ (pure, tested: overlap detection, drafts, grouping)  services/trackerApi.ts (HTTP client)
  context/     TrackerDataProvider: loads movies + tickets once, shared by both tabs
  hooks/       useTrackerData, useTicketData, useMovieTracker / useTicketsPage (compose a whole page), …
  pages/       MovieTrackerPage, TicketsPage — wiring only
  components/  ui/ layout/ movies/ cities/ detail/ tickets/ — presentational
```

API: `GET /api/health` · `GET /api/tracker` · `GET /api/sync` · `POST /api/refresh` · `POST /api/movies` ·
`DELETE /api/movies/:id` · `PUT /api/settings` (`{ cityIds: number[] }`) ·
`GET|POST /api/tickets` · `PUT|DELETE /api/tickets/:id` · `PUT|GET|DELETE /api/tickets/:id/image`

The original static HTML prototypes are in `prototypes/`.
