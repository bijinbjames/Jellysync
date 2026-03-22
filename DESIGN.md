# Design System Document

## 1. Overview & Creative North Star: "The Private Screening"
The vision for this design system is to evoke the atmosphere of a high-end, private home cinema. We are moving away from the "utility-first" look of standard streaming platforms toward a **"High-End Editorial"** experience. 

The Creative North Star is **The Private Screening**: an intimate, immersive, and focused environment where the interface recedes to let the cinematography shine. We achieve this through "Atmospheric Depth"—using layered transparencies and tonal shifts rather than rigid lines or harsh borders. The layout should feel organic, utilizing intentional asymmetry in hero sections and generous white space (breathing room) to create a premium, unhurried pace.

---

## 2. Colors & Surface Philosophy
The palette is rooted in deep, obsidian tones, punctuated by ethereal bioluminescent accents.

### Core Palette (Material Design Tokens)
- **Primary (Muted Teal):** `#6ee9e0` | **Container:** `#4ecdc4`
- **Secondary (Soft Violet):** `#c8bfff` | **Container:** `#442bb5`
- **Surface (Deep Charcoal):** `#131313`
- **Surface Container Lowest:** `#0e0e0e` (For deep background immersion)
- **Surface Container Highest:** `#353534` (For elevated interactive elements)

### The "No-Line" Rule
To maintain the premium feel, **1px solid borders are strictly prohibited** for sectioning. Boundaries must be defined through:
1.  **Tonal Shifts:** Placing a `surface_container_low` card on a `surface` background.
2.  **Negative Space:** Using the Spacing Scale (e.g., `spacing.8`) to imply grouping.

### The Glass & Gradient Rule
Floating elements (modals, playback controls, navigation bars) must use **Glassmorphism**. 
- **Recipe:** Apply `surface_variant` at 60% opacity with a `backdrop-filter: blur(20px)`. 
- **Signature Glow:** Main Call-to-Actions (CTAs) should use a subtle linear gradient transitioning from `primary` to `primary_container` at a 135° angle to provide a "soulful" tactile depth.

---

## 3. Typography: Editorial Authority
We pair the technical precision of **Inter** with the geometric confidence of **Manrope**.

- **Display & Headlines (Manrope):** These are your "Editorial Voices." Use `display-lg` (3.5rem) for movie titles in hero states. Use intentional letter-spacing (-0.02em) to make large type feel "locked in" and expensive.
- **Body & Labels (Inter):** High-readability sans-serif for metadata.
- **The Hierarchy Rule:** Contrast is king. Pair a `headline-lg` title with a `label-md` uppercase subtitle in `secondary` (Violet) to create a sophisticated, tiered information architecture. 

*Always use `on_surface` (#e5e2e1) for primary text; never use pure #FFFFFF.*

---

## 4. Elevation & Depth: Tonal Layering
Traditional drop shadows are replaced by **Atmospheric Layering**.

- **The Layering Principle:** Stacking determines importance.
    - Level 0: `surface_container_lowest` (The "Floor")
    - Level 1: `surface` (Main Content Area)
    - Level 2: `surface_container_high` (Interactive Cards)
- **Ambient Shadows:** For floating elements like "Invite to Watch" modals, use a diffused shadow: `box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4)`. The shadow should feel like a soft occlusion of light, not a black smudge.
- **Ghost Borders:** If a boundary is required for accessibility, use `outline_variant` at **15% opacity**. This creates a "whisper" of a container that doesn't break the immersion.

---

## 5. Components & Primitive Styling

### Buttons (The "Jewel" Treatment)
- **Primary:** Gradient (`primary` to `primary_container`), `rounded-md` (1.5rem), high-contrast text (`on_primary_container`).
- **Tertiary/Ghost:** No container. Use `primary` text with a 2px stroke icon.
- **Interaction:** On press, scale down slightly (98%) to simulate physical depth.

### Cards & Content Lists
- **The "No Divider" Mandate:** Lists must never use horizontal lines. Use `spacing.4` (1.4rem) between items. 
- **Movie Posters:** Apply `rounded-lg` (2rem). Use a subtle inner-glow (1px white at 5% opacity) on the top edge to simulate "rim lighting."

### Synchronized Playback Controls
- **The "Glass Console":** Use a `surface_container_highest` background with 40% transparency and a heavy blur. 
- **Icons:** 2px stroke weight, `outline` token. Icons should be sized at 24px but live within a 48px touch target.

### Chips (Meta Tags)
- Use `surface_container_high` with `rounded-full`. 
- For "Live" or "Syncing" states, use `secondary` (Violet) text to denote active participation.

---

## 6. Do’s and Don’ts

### Do:
- **Use Asymmetry:** Place movie titles off-center in hero headers to create a more custom, editorial feel.
- **Embrace the Dark:** Keep 90% of the screen in the `surface` or `surface_container` range.
- **Maximize Content:** Let the movie poster or backdrops bleed into the status bar area behind a glassmorphic header.

### Don’t:
- **Don't use 100% Opaque Borders:** This shatters the "Private Screening" immersion.
- **Don't use Harsh Whites:** It causes eye strain in movie-watching environments. Use `on_surface` (#e5e2e1).
- **Don't Crowd the UI:** If a screen feels busy, increase the spacing from `spacing.4` to `spacing.8`. Premium design is about what you leave out.

---

## 7. Token Quick Reference

| Token Type | Value / Token | Usage |
| :--- | :--- | :--- |
| **Corner Radius** | `lg` (2rem) | Movie Posters, Large Containers |
| **Corner Radius** | `md` (1.5rem) | Buttons, Chips, Action Sheets |
| **Spacing** | `4` (1.4rem) | Standard gutter / Padding |
| **Spacing** | `8` (2.75rem) | Section breathing room |
| **Icon Weight** | 2pt Stroke | Consistent across all nav and playback UI |