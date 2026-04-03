# Design System Strategy: The Digital Vault

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Digital Vault."** 

In an inventory context, security and precision are paramount. However, we are moving beyond the utilitarian "spreadsheet" aesthetic to create a high-end editorial experience. This system treats inventory items like artifacts in a gallery—valuable, protected, and clearly illuminated against a vast, dark void. 

To break the "template" look, we utilize **intentional asymmetry**. Layouts should favor generous negative space on one side to anchor heavy data on the other. We eschew the rigid 12-column grid in favor of a layered, depth-first approach where information "floats" at various altitudes, using the contrast between the deep navy abyss and electric cyan pulses to guide the eye.

## 2. Colors & Tonal Depth
This system relies on the interplay of shadows and light to define space, rather than structural lines.

*   **Primary & Secondary Roles:** The `primary_container` (#0d1b2a) and `secondary_container` (#3e4960) serve as the foundation of our "vault." They provide a cooler, architectural weight that feels more sophisticated than pure black.
*   **The "No-Line" Rule:** Designers are strictly prohibited from using 1px solid borders to define sections. All separation must be achieved through background color shifts. A `surface_container_low` (#1d1b1c) element sitting on a `surface` (#151314) background is sufficient to denote a boundary.
*   **Surface Hierarchy & Nesting:** Think of the UI as a series of stacked sheets of dark, polished basalt. Use the `surface_container` scale to create depth:
    *   **Level 0 (Base):** `surface_dim` (#151314)
    *   **Level 1 (Sections):** `surface_container_low` (#1d1b1c)
    *   **Level 2 (Cards/Interaction):** `surface_container_high` (#2c292a)
*   **The "Glass & Gradient" Rule:** To achieve a premium feel, floating menus or navigation bars must use **Glassmorphism**. Apply `surface_bright` at 60% opacity with a 20px backdrop blur. 
*   **Signature Textures:** For primary CTAs and high-level analytics, use a subtle linear gradient transitioning from `primary` (#bac8dc) to `primary_container` (#0d1b2a) at a 135-degree angle. This adds a "machined metal" luster.

## 3. Typography: Editorial Precision
We use **Inter** not just for legibility, but as a brand signifier. 

*   **Display & Headline:** Use `display-lg` (3.5rem) for hero inventory counts or total asset values. This creates a bold, editorial focal point. Pair these large numbers with `label-sm` (0.6875rem) in all-caps with 10% letter spacing for a high-tech, "scanned" aesthetic.
*   **The Contrast Play:** High-end design thrives on contrast. Pair a massive `headline-lg` title with a very small, high-density `body-sm` description. This hierarchy signals that the system is powerful enough to handle both the "big picture" and the "minute detail."
*   **Functional Labels:** `label-md` and `label-sm` should be used for technical metadata (SKUs, timestamps). Use the `on_tertiary_container` color (#008eab) for these labels to make them feel like active digital readouts.

## 4. Elevation & Depth: Tonal Layering
Traditional drop shadows are too "web 2.0." We use **Ambient Glows** and **Tonal Stacking**.

*   **The Layering Principle:** Depth is achieved by placing a `surface_container_lowest` (#100e0f) card inside a `surface_container_highest` (#373435) wrapper. This "recessed" look feels more like a physical dashboard.
*   **Ambient Shadows:** When an element must float (e.g., a modal), use an ultra-diffused shadow: `box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4)`. The shadow should have a slight tint of `primary_container` to ensure it integrates with the navy palette.
*   **The "Ghost Border" Fallback:** If a container requires more definition for accessibility, use a **Ghost Border**. This is a 1px stroke using `outline_variant` (#44474c) at **15% opacity**. It should be barely visible—a "whisper" of a line.

## 5. Components
*   **Buttons:** 
    *   *Primary:* Gradient fill (Primary to Primary Container), `12px` (0.75rem) roundedness, white text.
    *   *Secondary:* Glass effect using `surface_container_high` with a 10% `outline`.
*   **Input Fields:** No top, left, or right borders. Use a slightly darker `surface_container_lowest` fill. Upon focus, animate a 2px bottom border using `tertiary` (#4cd6fb) with a subtle outer glow (neon effect).
*   **Inventory Cards:** Strictly no dividers. Use `title-md` for the item name and `body-sm` for the quantity. Separate the two with a 16px vertical gap. The card background should be `surface_container_low`.
*   **Status Chips:** Use `tertiary_container` (#001d25) for the background and `tertiary` (#4cd6fb) for the text. This creates a "glow-in-the-dark" look that is instantly recognizable.
*   **Data Visualization:** In-line sparklines should use `tertiary` (#4cd6fb) with a soft glow filter to represent "active" data flow.

## 6. Do's and Don'ts

### Do:
*   **Do** use asymmetrical margins (e.g., 80px left, 40px right) to create a sophisticated, non-template look.
*   **Do** use `display-lg` typography for "Hero Data" to anchor the page.
*   **Do** use `surface_container` shifts for hover states rather than changing the text color.

### Don't:
*   **Don't** use pure white (#FFFFFF) for body text; use `on_surface` (#e8e1e2) to reduce eye strain in dark mode.
*   **Don't** ever use a solid, 100% opaque 1px border for layout sectioning.
*   **Don't** use standard "Material" shadows. If it doesn't look like it's glowing or submerged, it's too generic.
*   **Don't** crowd the interface. If the inventory is dense, use "hidden" navigation or progressive disclosure to maintain the "premium" feeling of space.