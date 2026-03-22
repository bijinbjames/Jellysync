# Google Stitch UI Design Prompt — JellySync

## App Overview

Design a complete, modern, clean mobile-first UI for **JellySync** — a cross-platform synchronized movie-watching app built for Jellyfin media servers. The app lets users watch movies together in real-time with synced playback and always-on voice chat. Platforms: Android (primary), iOS, and Web.

**Design Philosophy:**
- The screen is sacred — the movie owns every pixel during playback. Zero unnecessary UI.
- Radical simplicity — two actions on launch, everything reachable in 1-2 taps.
- Dark theme throughout (media app, used at night). Use a deep charcoal/near-black background (#0D0D0D to #1A1A2E) with soft accent colors (muted teal #4ECDC4 or soft violet #7B68EE as the primary accent). No harsh whites.
- Rounded corners, generous padding, subtle glassmorphism/frosted glass effects on overlays.
- Typography: clean sans-serif (Inter, SF Pro, or similar). Large, confident headings. High contrast text on dark backgrounds.
- Micro-interactions and smooth transitions — everything should feel fluid and alive.
- Minimal chrome, maximum content. No clutter, no feature bloat visible in the UI.
- The app should feel intimate and personal — this is for movie nights with loved ones, not a corporate product.

---

## Screen-by-Screen Specifications

### Screen 1: Login / First-Time Setup

**Purpose:** First-time users connect to their Jellyfin server and authenticate.

**Layout:**
- Centered card layout on a dark gradient background.
- App logo at the top — a simple, elegant wordmark "JellySync" with a subtle play-button or sync icon integrated into the typography. Keep the logo minimal and modern.
- Below the logo, a short tagline: "Watch together." in a muted/secondary text color.
- Three input fields stacked vertically inside a slightly elevated card with soft rounded corners:
  1. **Server URL** — placeholder: "https://your-jellyfin-server.com" — with a globe/link icon on the left.
  2. **Username** — placeholder: "Username" — with a user icon on the left.
  3. **Password** — placeholder: "Password" — with a lock icon on the left, eye toggle on the right to show/hide.
- Input fields: dark-filled (#1E1E2E or similar), subtle border on focus using the accent color, rounded corners (12px).
- Below inputs: a full-width **"Connect"** button — accent color background, bold white text, large touch target (56px height), rounded (14px).
- Below the button: a small "Learn more about Jellyfin" text link in muted color.

**States:**
- Default (empty fields)
- Focused (active input highlighted with accent border glow)
- Loading (button shows a subtle spinner, inputs disabled)
- Error (red-tinted border on the failing field, error message below in soft red: "Could not connect to server" or "Invalid credentials")

---

### Screen 2: Home Screen

**Purpose:** The primary hub. Two actions only: Create Room or Join Room.

**Layout:**
- Top section: a subtle greeting area — "Hey, Bijin" in medium weight text, left-aligned. Below it, very small muted text showing the connected server name (e.g., "Connected to media.bijin.dev"). A small avatar/profile icon in the top-right corner that opens settings.
- Center of the screen: two large, prominent, equally-sized action cards stacked vertically with generous spacing between them:
  1. **"Create Room"** card — accent-colored gradient background (teal-to-dark or violet-to-dark), a large icon (a "+" or a room/screen icon), bold white text "Create Room", and a short subtitle underneath: "Pick a movie and invite others". Rounded corners (20px), subtle shadow/elevation.
  2. **"Join Room"** card — slightly different treatment, perhaps a bordered/outlined card on the dark background (no fill, just an accent-colored border), with a door/enter icon, bold text "Join Room", and subtitle: "Enter a code or tap a link". Same rounded corners and size.
- Both cards should be large enough to be bold visual targets — approximately 45% of the screen height each (minus the header area), or at least 140px tall each.
- Bottom of screen: a small, subtle "Recent Rooms" section if the user has history (Phase 2 placeholder — for now, just show the two cards).

**Feel:** The home screen should feel like opening an app that knows exactly what you want. No navigation bar, no tabs, no hamburger menu. Just two clear choices.

---

### Screen 3: Join Room

**Purpose:** Enter a 6-character room code to join a session.

**Layout:**
- Top: back arrow (left) and screen title "Join Room" centered.
- Center: a **6-character code input** — designed as 6 individual rounded square boxes in a row (like OTP/verification code inputs). Each box is ~52x56px, dark filled, accent border on focus. Characters appear large and bold (24px+ monospace) as the user types.
- Auto-caps, alphanumeric only. The input auto-advances to the next box on each keystroke.
- Below the code input: a full-width **"Join"** button — same style as the Connect button (accent background, bold text, 56px height). The button becomes active/highlighted only when all 6 characters are entered.
- Below the button: a divider line with "or" text centered on it (like "——— or ———").
- Below the divider: a muted text line — "Tap a shared link to join instantly" — informing users about the deep link alternative.
- Keyboard should auto-open when this screen appears.

**States:**
- Empty (6 empty boxes, Join button muted/disabled)
- Partially filled (some boxes filled, button still disabled)
- Complete (all 6 filled, button becomes active with accent color)
- Loading (button shows spinner after tap)
- Error (boxes flash red briefly, error text: "Room not found. Check the code and try again.")

---

### Screen 4: Library Browser (Movie Selection)

**Purpose:** Host browses their Jellyfin library and picks a movie.

**Layout:**
- Top bar: back arrow (left), "Select a Movie" title (center), and a search icon (right) that expands into a search bar when tapped.
- Below the top bar: a horizontal scrollable row of **category/filter chips** — "All", "Recently Added", "Favorites", "Collections", etc. The active chip is filled with the accent color; inactive chips are outlined/muted.
- Main content: a **grid of movie posters** — 3 columns on mobile, responsive. Each poster card:
  - Movie poster image (2:3 aspect ratio), rounded corners (12px).
  - Below the poster: movie title (bold, white, 14px, truncated to 1 line) and year (muted, 12px).
  - On tap: navigates to the Movie Detail sheet.
- Smooth scroll, lazy-loaded images with a subtle shimmer/skeleton placeholder while loading.
- Pull-to-refresh supported.

**Search expanded state:**
- The search icon expands into a full-width text input in the top bar.
- Results filter in real-time as the user types.
- "No results" state: a muted icon and text centered in the grid area.

---

### Screen 5: Movie Detail Bottom Sheet

**Purpose:** Confirm movie selection before starting/swapping playback.

**Layout:**
- A bottom sheet that slides up over the library browser (the library is dimmed/blurred behind it).
- Sheet height: ~60% of screen.
- Top of sheet: a **backdrop/fanart image** from the movie, spanning the full width of the sheet with a gradient fade to the dark background at the bottom of the image.
- Below the image:
  - **Movie title** — large, bold, white (22px).
  - **Metadata row** — year, runtime (e.g., "2h 14m"), rating (e.g., "PG-13") — all in muted text, separated by dots.
  - **Overview/synopsis** — 3-4 lines of body text in muted white/gray, with a "Read more" expansion toggle if it overflows.
  - **Action button** — full-width, accent colored:
    - If creating a room: **"Start Watching"**
    - If swapping mid-session: **"Switch to This Movie"**
  - Below the button: a "Cancel" text link in muted color.

---

### Screen 6: Room Lobby (Waiting / Share)

**Purpose:** Room is created, host sees the code and shares it while waiting for participants.

**Layout:**
- Clean, centered layout.
- Top: movie poster thumbnail (small, ~80x120px, rounded) with the movie title and year beside it. This confirms what's queued up.
- Center (hero area):
  - Large text: "Your Room Code" in muted/secondary color.
  - The **6-character code** displayed HUGE — monospaced, bold, letter-spaced, ~48-64px font. Each character slightly separated. Use the accent color for the code text.
  - Below the code: a **"Share"** button — pill-shaped, accent-colored, with a share icon. Tapping opens the native share sheet with the deep link and code.
  - Below the share button: a **"Copy Code"** text button in muted style for quick clipboard copy. Show a brief "Copied!" toast animation on tap.
- Below center:
  - A subtle **participant list area** — shows "Waiting for others to join..." in muted text with a gentle pulsing dot animation. As participants join, their names appear here as small pills/chips (e.g., "Bijin (Host)" and "Amina" with a subtle join animation).
  - Each participant chip shows a tiny mic icon indicating voice is connected.
- Bottom: a **"Start Movie"** button — appears disabled/muted until at least one other participant joins. Once someone joins, it becomes active (accent color). The host taps this to begin playback for everyone.
- Also at bottom-right: a small muted "Cancel Room" text link.

**Transitions:**
- When "Start Movie" is tapped, the screen transitions into the full-screen player with a smooth fade/zoom animation.

---

### Screen 7: Full-Screen Player (Watching State)

**Purpose:** The core experience — watching the movie together with voice chat.

**Layout — Default (Controls Hidden):**
- 100% full-screen video. No status bar, no navigation bar, no UI elements whatsoever. Pure cinematic black with the movie filling the screen (letterboxed if needed).
- Voice chat audio is mixed underneath the movie audio — there are NO visual indicators of voice. No avatars, no waveforms, no "speaking" indicators. The voice is ambient, like being in the same room.
- Subtitles (if enabled) appear as standard bottom-center text with a semi-transparent dark background pill behind the text.

**Layout — Controls Visible (tap to reveal):**
- A single tap anywhere on the screen reveals controls. They auto-hide after 4 seconds of inactivity.
- **Top overlay bar** (gradient from dark/transparent at top):
  - Left: back/exit button (chevron or X icon).
  - Center: movie title (subtle, muted text, 14px).
  - Right: three small icons in a row:
    - Subtitles icon (CC) — toggles subtitles on/off. Highlighted when active.
    - Volume/audio icon — opens the Voice & Volume panel (Screen 8).
    - Overflow/more icon (three dots) — opens additional options.
- **Bottom overlay bar** (gradient from dark/transparent at bottom):
  - A **seek bar / progress bar** — thin line, accent-colored for played portion, muted for remaining. A circular scrubber handle. On drag, show a timestamp tooltip above the thumb.
  - Below the seek bar: current time (left) and remaining time (right) in small muted text.
  - Center: large **play/pause button** (circular, 56px, semi-transparent frosted background). Skip back 10s and skip forward 10s buttons flanking it (smaller, 40px).
- **Mute/unmute floating button** — a small circular mic icon button anchored to the bottom-right corner of the screen, always semi-visible (even when other controls are hidden). Subtle, low-opacity (40%) when mic is on, more visible when muted (mic-off icon, slightly red-tinted). Single tap to toggle. This is the only persistent UI element during playback.

**Buffering State:**
- When any participant buffers: the video pauses, and a centered loading spinner appears with small text below: "Syncing with everyone..." in muted white. The spinner uses the accent color. This is intentionally calm — not alarming.

**Stepped Away State:**
- When a participant steps away: a very subtle, small pill notification slides in at the top: "[Name] stepped away" — auto-pause happens. When they return: "[Name] is back" — auto-resume after 2 seconds. These pills are translucent dark with white text, and auto-dismiss.

---

### Screen 8: Voice & Volume Panel (Bottom Sheet Overlay)

**Purpose:** Control voice chat volume per participant and overall audio mix.

**Layout:**
- A bottom sheet that slides up over the player (player is dimmed slightly behind it). Sheet height: ~40-50% of screen.
- **Section 1: Movie Volume**
  - Label: "Movie Volume"
  - A horizontal slider — accent colored track, circular thumb. Full width.
- **Section 2: Voice Chat**
  - Label: "Voice Chat" with a master volume slider below it.
  - Then a list of **per-participant volume rows**:
    - Each row: participant name (left), a horizontal volume slider (right). E.g., "Amina ——o———"
    - If participant is muted, show a small "muted" badge next to their name.
  - Each row is separated by a subtle divider.
- Bottom of sheet: a "Done" text button or the sheet is dismiss-on-swipe-down.
- All sliders should feel smooth and responsive, with the accent color for the filled portion.

---

### Screen 9: Host Playback Permissions (Bottom Sheet or Modal)

**Purpose:** Host configures what controls participants can use.

**Layout:**
- Accessed from the overflow/more menu on the player controls.
- A compact bottom sheet or modal card.
- Title: "Playback Permissions"
- A list of toggle rows:
  - "Others can Play/Pause" — toggle switch (on by default)
  - "Others can Seek" — toggle switch (off by default)
- Each row: label text (left), toggle (right). Toggles use accent color when on, muted when off.
- Small explanatory text below: "Only the host can always control playback."
- Dismiss by swiping down or tapping outside.

---

### Screen 10: Mid-Session Library Browser

**Purpose:** Host swaps the movie without leaving the room.

**Layout:**
- Same as Screen 4 (Library Browser), but presented as a full-screen overlay on top of the paused player.
- Top bar has an "X" close button (left) instead of a back arrow, and the title says "Switch Movie".
- Selecting a movie opens the Movie Detail sheet (Screen 5) with the "Switch to This Movie" button.
- On confirmation, the overlay closes, the new movie loads, and playback begins for everyone.
- During this browsing, voice chat remains active — participants can hear the host and discuss what to watch.

---

### Screen 11: Settings / Profile Screen

**Purpose:** View connection info, manage session, log out.

**Layout:**
- Accessed by tapping the profile/avatar icon on the Home Screen (top-right).
- Slides in as a full screen or large bottom sheet.
- **Profile Section:**
  - User avatar (generic icon or initials circle, accent colored) + username displayed large.
  - Below: server URL in muted text, truncated if long.
  - Connection status indicator: small green dot + "Connected" text.
- **Settings List:**
  - "Default Subtitles" — toggle (if on, subtitles auto-enable when joining a room)
  - "Microphone Default" — toggle (on by default — mic auto-enables when joining)
  - Other future settings can go here.
- **Bottom:**
  - "Log Out" button — outlined/bordered in a muted red/warning color. Not accent colored — this is a destructive action, visually distinct.
- Back/close navigation at top.

---

### Screen 12: Deep Link Landing (Web)

**Purpose:** When someone taps a JellySync deep link on web and isn't logged in.

**Layout:**
- A centered card on a full-page dark gradient background (similar to login).
- JellySync logo at top.
- Message: "You've been invited to a watch room!"
- The **room code** displayed prominently (large, accent colored, monospaced).
- Below: "Log in to join" — with the login form (same as Screen 1) directly below or a "Log In" button that navigates to login.
- If the user is already logged in: skip this screen entirely and drop them directly into the room.

---

### Screen 13: Empty/Error States

**Design these states:**
- **No Movies Found** (library is empty): centered illustration (a simple line-art TV with a "?" on it) + text: "No movies found on your server" + muted subtext: "Make sure your Jellyfin library has content."
- **Connection Lost** (during playback): a full-screen overlay on the player — dark translucent backdrop, centered icon (a broken chain or disconnected plug), text: "Connection lost" + subtext: "Trying to reconnect..." with a subtle spinner. Auto-dismiss when reconnected.
- **Room Closed** (room ended while user was away): centered message — "This room has ended" + "Return Home" button.
- **Invalid Deep Link**: "This link is no longer valid. The room may have ended." + "Go Home" button.

---

## Component Design System Notes

**Buttons:**
- Primary: accent color fill, white bold text, 56px height, 14px rounded corners.
- Secondary: transparent/outlined with accent border, accent text, same size.
- Text/Tertiary: no background, muted or accent colored text, used for "Cancel", "Learn more", etc.

**Cards:**
- Dark elevated cards (#1A1A2E on #0D0D0D background), 20px rounded corners, subtle shadow or 1px border (#2A2A3E).

**Input Fields:**
- Dark fill (#1E1E2E), 12px rounded corners, left icon, accent border on focus.

**Toggles:**
- Rounded pill-style switches. Accent color when on, muted gray when off.

**Bottom Sheets:**
- Dark background matching the card color, rounded top corners (24px), drag handle bar centered at top (small rounded rectangle, 40x4px, muted color).

**Icons:**
- Outlined/stroke style, not filled. 24px size for standard use, 20px for compact. Consistent 2px stroke weight.

**Transitions:**
- Screens slide in from right, sheets slide up from bottom, modals fade in with scale.
- Controls on the player fade in/out smoothly (200ms).
- Participant joins/leaves have a subtle slide + fade animation.

---

## Screen Flow Summary

```
Login → Home → Create Room → Library Browser → Movie Detail → Room Lobby → Player
                 Join Room → (enter code) → Player
Home → Settings
Player → Voice/Volume Panel
Player → Host Permissions
Player → Mid-Session Library → Movie Detail → Player (swap)
Deep Link → (auto-join if logged in) → Player
Deep Link → (login required) → Login → Player
```

---

## Final Notes for Generation

- Design all screens at **mobile-first (390x844px / iPhone 14 size)** with a dark theme.
- Use **consistent spacing**: 16px standard padding, 24px section spacing, 32px large section spacing.
- The overall vibe is: **Netflix meets Discord meets a cozy living room.** Premium, dark, intimate, effortless.
- No ads, no upsells, no onboarding carousels, no tutorials. The app should be self-evident.
- Prioritize the player experience (Screen 7) — this is where users spend 95% of their time. It must feel invisible.
- Generate all screens as a connected flow so the full user journey is visible.
