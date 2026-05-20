# DrivePlay Worker — Setup (5 minuta)

## 1. Instaliraj Wrangler

```bash
npm install -g wrangler
wrangler login
```

## 2. Kreiraj KV namespace

```bash
cd worker
wrangler kv namespace create DP_KV
```

Kopiraj `id` iz outputa i zalijepi ga u `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "DP_KV"
id = "abc123..."   # ← tvoj id ovdje
```

## 3. Postavi API ključ (tajni, nikad u kod)

```bash
wrangler secret put API_KEY
```

Upiši bilo koji string koji ćeš koristiti kao lozinku, npr. `driveplay-2025-xyz`.

## 4. Deploy

```bash
wrangler deploy
```

Output će biti nešto kao:
```
https://driveplay-api.yourname.workers.dev
```

## 5. Poveži dashboard i kiosk

U `dashboard.html` i `game_demo-2.html` pronađi ove dvije linije (blizu vrha `<script>`) i popuni:

```javascript
const CF_WORKER = 'https://driveplay-api.yourname.workers.dev';
const CF_KEY    = 'driveplay-2025-xyz';   // samo u dashboard.html
```

U `game_demo-2.html` nema `CF_KEY` — čitanje je javno, pisanje nije.

---

## Raspberry Pi kiosk mode

SSH na Pi pa pokreni (jednom, kao systemd service):

```bash
# Instaliraj Chromium ako već nije
sudo apt install chromium-browser -y

# Pokreni kiosk (zamijeni SCREEN_ID pravim ID-om iz dashboarda)
chromium-browser \
  --kiosk \
  --noerrdialogs \
  --disable-infobars \
  --no-first-run \
  --enable-features=OverlayScrollbar \
  "https://tvoj-hosting.pages.dev/game_demo-2.html?screen=SCREEN_ID"
```

### Hosting HTML fajlova besplatno (Cloudflare Pages)

```bash
# Iz root foldera driveplay/
npx wrangler pages deploy . --project-name driveplay
```

URL će biti: `https://driveplay.pages.dev`

---

## Frekvencija sinkronizacije

| Akcija | Latencija |
|--------|-----------|
| Dashboard save → Cloud | < 1s |
| Cloud → Kiosk (poll) | max 15s |

Za brže: promijeni `CF_POLL_MS = 5000` u game_demo-2.html (5s).
Pazi na free tier: 20 kioska × 5s = 345k req/dan (iznad 100k limita → $5/mj plan).
Sa 15s polling: ~58k/dan → ostaje u free tiers.
