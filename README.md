# TrainHog

A personal training app for Hogan and his clients. Clients follow the sessions Hogan sets, log how they went, and report pain straight back to him. Hogan sees everything in one inbox.

This is the **clickable foundation** for the call with Hogan. Every screen works and is wired together, but it runs on sample data held in memory. There is no sign-in or database yet, on purpose, so those can be built once Hogan has said what he wants.

## Run it

You need Node 20 or newer.

```bash
npm install
npx expo start
```

Then:

- **iPhone or iPad:** install **Expo Go** from the App Store and scan the QR code in the terminal.
- **Android:** install Expo Go from Google Play and scan the QR code.
- **Laptop:** press `w` in the terminal to open it in the browser.

To build the web version as static files: `npm run build:web` (output goes to `dist/`).

## Build the real iPhone app (TestFlight)

The app is set up for EAS (`eas.json`, bundle ID `com.trainhog.app`). On your own computer:

```bash
git clone https://github.com/Rarchie2/TrainHog.git
cd TrainHog
npm install
npx eas-cli@latest login
npx eas-cli@latest build --platform ios --profile production --auto-submit
```

The first run asks to create the Expo project, sign in to Apple and make the certificates; say yes to each. When it finishes, the build goes to App Store Connect and shows up in TestFlight after Apple's processing. Later builds only need the last command.

## Put it on your phone as a web app (no App Store needed)

The web app is live at **https://rarchie2.github.io/TrainHog/**.

- **iPhone:** open the link in Safari, tap Share, then **Add to Home Screen**.
- **Android:** open it in Chrome, tap the ⋮ menu, then **Install app** or **Add to Home screen**.

It then opens full screen with the TrainHog icon, like a normal app.

To update it: `npm run build:pages`, then push the `dist/` folder to the `gh-pages` branch.

## What's in it

One codebase covers phone, iPad and laptop. The layout changes with screen width:

| Width | Layout |
| --- | --- |
| Under 700 points (phone) | Bottom tabs |
| 700 to 1279 (iPad) | Side rail with icons and labels |
| 1280 and up (laptop, big iPad) | Full sidebar |

**Client app** (`src/app/(client)`)
- **Today:** today's session, Hogan's latest message, a check-in reminder, this week, categories and recent diary.
- **My sessions:** sessions grouped by category, with search, favourites and a session overview.
- **Workout** (`src/app/workout`): one exercise per screen, video placeholder, Hogan's notes, steps, easier and harder versions, big Done and Skip buttons, rest timer.
- **Check-in** (`src/app/checkin`): five faces, effort 1 to 10, what went well, what was hard, and a pain report with a tappable body map, severity, type and timing. Pain of 7 or more, or a red-flag answer, shows the 999 / NHS 111 safety message.
- **Diary:** month calendar, every session and check-in, free notes, and Hogan's replies.
- **Me:** Easy view, text and accessibility options, reminders, Face ID, privacy, and demo controls.
- **Easy view:** larger text, stronger outlines and a simpler Today screen with one big button per job. Switch it on in Me, or per client from Hogan's side.

**Hogan's dashboard** (`src/app/(trainer)/coach`)
- **Inbox:** pain reports pinned in red until seen, new check-ins with reply and seen buttons, who has gone quiet (with a nudge), who is due today, and pending invites.
- **Clients:** list with filters, add a client (sends a password-free invite), and a client page with profile, private notes, messaging, assigned sessions, effort trend and full history.
- **Sessions:** library by category and a session builder (pick exercises, set sets, reps and rest, assign to clients).

Everything is connected. If a client reports pain in the check-in, it appears at the top of Hogan's inbox straight away. If Hogan replies, the reply shows in the client's diary.

## Where things live

```
src/
  app/                 Screens (Expo Router: every file is a route)
    (client)/          Client tabs: Today, My sessions, Diary, Me
    (trainer)/coach/   Hogan's dashboard: Inbox, Clients, Sessions
    workout/[id].tsx   Exercise-by-exercise player
    checkin/[logId].tsx  Post-session check-in and pain report
  components/          Shared UI (Shell is the responsive navigation)
  data/
    types.ts           Data model from the spec
    sample.ts          Sample data (all names are made up)
    store.tsx          In-memory store; swap for the real backend
  theme/index.ts       Colours, fonts, sizes (white and blue)
  config.ts            App name
```

## Things to change after the call with Hogan

- [ ] His real session categories, sessions and exercises (`src/data/sample.ts`)
- [ ] His brand blue (`brand` in `src/theme/index.ts`) and logo
- [ ] The exact check-in questions (`src/app/checkin/[logId].tsx`)
- [ ] Whether check-ins alert him instantly or as a daily summary
- [ ] Whether he films his own videos or starts from a library

## Next build steps

1. Backend: Supabase (London region) with row-level security per trainer business, as in the spec. Replace `src/data/store.tsx` with real queries.
2. Sign-in: invite link, then magic link or SMS code. No passwords.
3. Video: Mux or Cloudflare Stream, with offline downloads.
4. Push notifications for pain reports (Expo push).
5. Voice notes with transcription.

The spec lives here: https://claude.ai/code/artifact/b8d39e71-2914-4b9b-8847-9da5e7cf50d1
