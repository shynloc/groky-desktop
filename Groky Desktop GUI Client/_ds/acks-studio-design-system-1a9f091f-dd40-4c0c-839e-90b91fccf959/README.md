# ACKS Studio Design System

## Company Overview

**ACKS Studio** (中文名：爱驰科驶 / AI驰科驶) is a multi-discipline technology and automotive studio based in Kunming, Yunnan, China.

- **Registered name:** 盘龙区爱驰科驶技术服务经营部（个体工商户）
- **Future entity:** 云南爱驰科驶科技有限公司
- **English name:** ACKS Studio / Aichikeshi Studio

### Core Business Lines

1. **Automotive Modification Products** — Air body kits, brake systems (Brembo), wheels (HRE), power upgrades, suspension/chassis kits. Partner brands include HKS, Brembo, HRE, Bell, Alpinestars, Stelio.
2. **AI Technology & Applications** — AI agent development, enterprise AI training and deployment.
3. **Software Development** — Custom software and technical services.

### Target Audience
- **B2C:** Age 20–40, gender-neutral, car enthusiasts
- **B2B:** Enterprise clients seeking AI solutions

### Sources Provided
- Codebase: `ACKSstudio/` (mounted via File System Access API — was empty at time of build)
- GitHub repo: `shynloc/acksstudio` (private, was empty at time of build)
- Brand intake form: `BRAND_INTAKE.md`

> ⚠️ Neither the codebase nor the GitHub repo contained files at the time this design system was built. All design decisions are based on brand intake + brand principles. Update this system once assets are available.

---

## CONTENT FUNDAMENTALS

### Tone & Voice
- **Direct and confident** — no fluff, no filler
- **Bilingual (中英双语)** — Chinese and English coexist naturally; neither is secondary
- **Professional but not stiff** — speaks to enthusiasts and engineers equally
- **No emoji** — clean, technical aesthetic
- **Casing:** English titles use Title Case for headings; sentence case for body copy
- **Person:** Use "你" (informal you) in Chinese; "you" in English — approachable, peer-to-peer
- **Numbers:** Always use numerals (not spelled out): "3 products", not "three products"

### Copy Examples (inferred from brand context)
- "改装你的驾驶体验" / "Modify Your Drive"
- "AI + 汽车 = 无限可能"
- "Professional-grade components. Everyday performance."
- "让 AI 为你的企业赋能"

---

## VISUAL FOUNDATIONS

### Color System — sampled from Dragon Logo
| Role | Name | Value |
|------|------|-------|
| Primary | ACKS Red / 龙红 | `#E31E24` |
| Red hover | Red Hover | `#FF3A41` |
| Red deep | Red Deep | `#B8181D` |
| Dark bg | ACKS Black | `#0A0A0A` |
| Light bg | ACKS White | `#FAFAFA` |
| Dark surface | Surface 1 | `#141414` |
| Dark surface 2 | Surface 2 | `#1E1E1E` |
| Border dark | Border Dark | `#2A2A2A` |
| Border light | Border Light | `#E5E5E5` |
| Text primary (dark) | FG1 Dark | `#FFFFFF` |
| Text secondary (dark) | FG2 Dark | `#A0A0A0` |
| Text primary (light) | FG1 Light | `#0A0A0A` |
| Text secondary (light) | FG2 Light | `#525252` |

The red is sampled directly from the dragon mark in the official logo — a punchy, saturated red that matches the aggressive automotive aesthetic.

### Typography
- **Display / Brand:** Space Grotesk — bold, geometric, slightly edgy; good for automotive + tech
- **Body:** DM Sans — clean, neutral, highly legible
- **Chinese:** Noto Sans SC — cross-platform, clean weight variety
- **Mono / Code:** JetBrains Mono — technical, used sparingly
- **Scale:** 12 / 14 / 16 / 20 / 24 / 32 / 48 / 64 / 80px

> ⚠️ No font files were provided. Google Fonts substitutions are used. If brand has proprietary fonts, provide TTF/OTF files and update `fonts/`.

### Spacing System
Base unit: **8px**
Scale: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96 / 128px

### Backgrounds & Surfaces
- **Dark mode primary:** Near-black `#0A0A0A` — deep, not pure black
- **Light mode primary:** Off-white `#FAFAFA` — never pure white
- **Surfaces:** Layered dark grays (`#141414`, `#1E1E1E`)
- **No gradients** as a primary motif — clean flat surfaces preferred
- **Subtle textures** possible for automotive feel (very fine noise, optional)

### Animation
- **Style:** Swift, precise — no bounciness; suits mechanical/tech aesthetic
- **Duration:** 150ms for micro (hover), 300ms for transitions, 500ms for page-level
- **Easing:** `cubic-bezier(0.16, 1, 0.3, 1)` — fast out, subtle overshoot
- **Hover states:** Slight brightness increase or red accent reveal
- **Press states:** Scale down slightly (`scale(0.97)`)

### Corner Radii
- **None/Sharp:** `0px` — used for hero sections, full-bleed elements
- **XS:** `4px` — badges, tags
- **SM:** `6px` — buttons, inputs
- **MD:** `8px` — cards, modals
- **LG:** `12px` — large panels
- **Full:** `9999px` — pill shapes (used rarely)

### Cards
- Dark mode: `background: #141414`, `border: 1px solid #2A2A2A`, `box-shadow: none`
- Light mode: `background: #FFFFFF`, `border: 1px solid #E5E5E5`, `box-shadow: 0 1px 3px rgba(0,0,0,0.08)`
- Corner radius: 8px
- No colored left-border accent

### Borders & Dividers
- Dark: `1px solid #2A2A2A`
- Light: `1px solid #E5E5E5`
- Accent: `1px solid #FF5C00` (used sparingly — active states, focus rings)

### Iconography
See ICONOGRAPHY section below.

### Imagery & Photography
- **Color vibe:** Dark, moody, desaturated — with red accent pops
- **Automotive imagery:** Low-angle shots, close-up details (brakes, wheels, aero)
- **AI/Tech imagery:** Abstract data visualization, circuit-like geometry
- No stock-photo cheerful aesthetic

### Transparency & Blur
- Backdrop blur used for overlays and nav on scroll: `backdrop-filter: blur(12px)`
- Background: `rgba(10,10,10,0.8)` for dark nav on scroll

---

## ICONOGRAPHY

- **Primary icon set:** Lucide Icons (CDN: `https://unpkg.com/lucide@latest`)
- **Style:** Line icons, 1.5px stroke weight, consistent 24×24 grid
- **Usage:** UI controls, navigation, feature indicators
- **No emoji** used as icons
- **No unicode substitutes**
- No proprietary icon font found (codebase was empty)

> If ACKS Studio has custom icons, provide SVG files and place in `assets/icons/`.

---

## FILE INDEX

| Path | Description |
|------|-------------|
| `README.md` | This file — brand overview and design foundations |
| `BRAND_INTAKE.md` | Original brand intake questionnaire |
| `colors_and_type.css` | CSS custom properties for all color + type tokens |
| `assets/` | Logos, icons, and visual assets |
| `preview/` | Design system preview cards (registered in DS tab) |
| `ui_kits/website/` | Marketing website UI kit |
| `ui_kits/webapp/` | Web application UI kit |
| `SKILL.md` | Agent skill definition for Claude Code |

---

## UI KITS

| Kit | Path | Surfaces |
|-----|------|---------|
| Marketing Website | `ui_kits/website/index.html` | Hero, Features, Pricing, About |
| Web Application | `ui_kits/webapp/index.html` | Login, Dashboard, Settings |
