# Design System Document

## 1. Overview & Creative North Star: "The Tactile Archivist"

This design system is engineered to transform inventory management from a mundane chore into a premium, editorial experience. While the functional goal is efficiency, the visual goal is **The Tactile Archivist**. This philosophy rejects the cluttered, line-heavy aesthetic of legacy Japanese enterprise software in favor of a "Soft-Minimalist" approach.

We move beyond the "grid of boxes" by using **intentional asymmetry**, high-contrast typography, and depth through tonal layering. The interface should feel like a series of high-end stationery sheets organized on a clean, architectural desk. It is reliable and familiar, yet possesses a "soul" through subtle gradients and the total absence of harsh structural lines.

---

## 2. Colors: Tonal Depth & The "No-Line" Rule

Our palette is anchored in professional grays and vibrant, sun-soaked oranges. However, the sophistication lies in how these colors are layered, not just applied.

### The "No-Line" Rule
**Explicit Instruction:** Do not use 1px solid borders to section off content. Traditional borders create visual "noise" that fatigues the user. 
- **Boundaries** must be defined solely through background color shifts. Use `surface-container-low` for a section background and `surface-container-lowest` for the cards sitting within it.
- If a visual break is required, use generous white space or a subtle shift from `surface` to `surface-variant`.

### Surface Hierarchy & Nesting
Treat the UI as physical layers. Use the following tiers to define importance:
- **Level 0 (Base):** `surface` (#f8f9fa) – The foundation.
- **Level 1 (Sub-Sections):** `surface-container-low` (#f3f4f5) – Secondary grouping.
- **Level 2 (Cards/Active Content):** `surface-container-lowest` (#ffffff) – This is your primary "paper" for data.
- **Level 3 (Pop-overs/Modals):** `surface-container-highest` (#e1e3e4) – Highest prominence.

### The "Glass & Gradient" Rule
To elevate the app above "standard" tools:
- **Glassmorphism:** For floating navigation bars or filter drawers, use `surface` at 80% opacity with a `backdrop-blur` of 12px.
- **Signature Gradients:** For primary CTAs (e.g., "Add Inventory"), use a linear gradient: `primary` (#865300) to `primary-container` (#f59d0a). This adds a "jewel" quality to the action buttons.

---

## 3. Typography: Editorial Clarity

The typography system prioritizes the legibility of Japanese characters while introducing a modern, editorial rhythm using **Inter** for numerals/Latin and **Plus Jakarta Sans** for high-impact displays.

- **Display & Headlines:** Use `display-md` and `headline-lg` (Plus Jakarta Sans) with tight letter-spacing (-0.02em). This conveys authority and a premium feel.
- **Title & Body:** `title-md` and `body-md` (Inter/Japanese Sans-Serif) should maintain a generous line-height (1.6) to ensure the dense information typical of inventory systems remains breathable.
- **Data Tables:** Numerical data should always use `body-md` with tabular-lining font features to ensure columns of figures align perfectly for quick scanning.

---

## 4. Elevation & Depth: Tonal Layering

We convey hierarchy through light and shadow, not ink.

### The Layering Principle
Never place a shadow on a flat background. Only use shadows when an element "floats" above the stack (like a modal or a floating action button). Otherwise, use **Tonal Lift**:
- A `surface-container-lowest` card sitting on a `surface-container-low` background creates a natural edge that is easier on the eye than a shadow.

### Ambient Shadows
When a floating effect is required (e.g., a detail drawer):
- **Shadow Token:** Large blur (24px - 32px), 4-6% opacity.
- **Tinting:** The shadow must be tinted with the `on-surface` color (#191c1d) to ensure it looks like a natural occlusion of light rather than a gray smudge.

### The "Ghost Border" Fallback
If accessibility requirements demand a container edge (e.g., in high-contrast modes), use a **Ghost Border**: 
- `outline-variant` (#d9c3ad) at **15% opacity**. This provides a guide for the eye without breaking the "No-Line" Rule.

---

## 5. Components

### Buttons
- **Primary:** Gradient (`primary` to `primary-container`), `DEFAULT` (8px) roundness. White text (`on-primary`). Use for the main "Record" or "Update" actions.
- **Secondary:** `surface-container-highest` background with `on-secondary-container` text. Subtle and sophisticated.
- **Tertiary:** No background. `primary` text. Use for "Cancel" or "Back."

### Cards & Lists
- **Rule:** Forbid divider lines. 
- **Execution:** Separate list items using 8px of vertical spacing. Each item should sit on a `surface-container-lowest` tile. For data density, use a subtle 4px vertical margin and alternate background colors slightly (zebra striping using `surface` and `surface-container-low`).

### Input Fields
- **Style:** Understated. Use `surface-container-low` as the fill color. 
- **Focus State:** 2px "Ghost Border" using `primary` at 40% opacity. Avoid heavy glow effects.
- **Errors:** Use `tertiary` (#b4271d) for text and a 5% opacity `tertiary-container` fill for the field.

### Specialized Inventory Components
- **Status Chips:** Use `full` (9999px) roundness. "In Stock" uses `primary-fixed-dim` backgrounds; "Low Stock" uses `tertiary-fixed` backgrounds. 
- **Quantity Scrubber:** A custom horizontal slider for quick inventory counts, utilizing the `primary-container` color for the track.

---

## 6. Do's and Don'ts

### Do
- **Do** use generous white space (24px+) between major functional blocks.
- **Do** use `primary-container` (#f59d0a) sparingly to draw the eye only to the single most important action on the screen.
- **Do** align Japanese text to a strict baseline grid to maintain the "Professional" personality.

### Don't
- **Don't** use 100% black (#000000). Use `secondary` (#333333) or `on-surface` (#191c1d) for all text to reduce ocular strain.
- **Don't** use "Drop Shadows" on cards. Rely on background color shifts first.
- **Don't** use hard corners. Always stick to the `DEFAULT` (8px) or `md` (12px) scale to maintain a "Reliable" and approachable feel.
- **Don't** use "Alert Red" for anything other than critical errors. Use the Orange `primary` for warnings to keep the UI from feeling "angry."