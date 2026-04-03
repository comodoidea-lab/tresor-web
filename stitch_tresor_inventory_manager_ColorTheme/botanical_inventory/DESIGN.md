# Design System Specification: The Living Inventory

## 1. Overview & Creative North Star
**Creative North Star: "The Botanical Archivist"**

This design system transcends the typical utility of an inventory app, moving into the realm of a curated digital sanctuary. It rejects the cold, sterile grid of traditional logistics software in favor of "Organic Editorialism"—a style characterized by breathing room, sophisticated tonal layering, and high-end typography. 

The goal is to make the act of "management" feel like "stewardship." We break the "template" look by utilizing intentional asymmetry in card layouts, generous negative space that mimics fine-art catalogs, and a rejection of harsh structural lines. We are not just listing items; we are presenting them with dignity.

## 2. Colors: Tonal Depth & Organic Transitions

The palette is rooted in nature, using Sage and Terracotta to anchor the eye, while the Soft Beige background provides a warm, tactile foundation.

### The "No-Line" Rule
Standard 1px borders are strictly prohibited for sectioning. Use background shifts to define boundaries. 
- A `surface-container-low` (#f4f3f1) sidebar sitting against a `surface` (#faf9f6) main content area provides all the separation necessary. 
- If a container requires further definition, use `surface-container-high` (#e9e8e5).

### Surface Hierarchy & Nesting
Treat the UI as a series of stacked, premium paper stocks.
- **Base Level:** `surface` (#faf9f6) for the main canvas.
- **Sectioning:** `surface-container-low` (#f4f3f1) for secondary zones like navigation or side-panels.
- **Interactive Objects:** `surface-container-lowest` (#ffffff) for primary cards to create a subtle "pop" against the beige backdrop.

### Signature Textures & Gradients
To avoid a flat, "out-of-the-box" appearance, apply a subtle linear gradient to primary actions.
- **Primary CTA:** A soft transition from `primary` (#316342) to `primary_container` (#4a7c59) at a 135° angle.
- **The Glass Effect:** For floating navigation or modal overlays, use `surface` at 80% opacity with a `20px` backdrop-blur. This allows the botanical greens of the content to bleed through softly.

## 3. Typography: The Editorial Scale

We use **Manrope** to deliver a modern, geometric clarity that feels more sophisticated than standard sans-serifs. The hierarchy is designed to feel like a high-end magazine index.

*   **Display (lg/md/sm):** Used for large inventory counts or "Empty State" hero moments. It should feel authoritative but light.
*   **Headline (lg/md):** Used for category titles. Use `primary` (#316342) color for headlines to ground the page in the "Botanical" theme.
*   **Title (md/sm):** Used for item names in list views. These should be high-contrast (`on_surface` #1a1c1a) for immediate legibility.
*   **Body (lg/md):** The workhorse for descriptions. Use `on_surface_variant` (#414942) to soften the reading experience.
*   **Label (md/sm):** Reserved for metadata (SKUs, quantities). Often set in `tertiary` (#854a03) to highlight vital data points without cluttering the visual field.

## 4. Elevation & Depth: Tonal Layering

Traditional shadows are too heavy for this "Calm" aesthetic. Depth is achieved through the **Layering Principle**.

*   **Tonal Stacking:** Place a `surface-container-lowest` (#ffffff) card on top of a `surface-container-low` (#f4f3f1) section. This creates a natural, soft lift.
*   **Ambient Shadows:** For high-priority floating elements (e.g., a "Quick Add" FAB), use a diffuse shadow: `0px 12px 32px rgba(74, 124, 89, 0.08)`. Note the green tint in the shadow—this mimics natural light passing through a canopy.
*   **The "Ghost Border" Fallback:** If a border is required for accessibility (e.g., input fields), use `outline_variant` (#c1c9bf) at **20% opacity**. It should be felt, not seen.

## 5. Components: Botanical Utility

### Buttons
*   **Primary:** Gradient of `primary` to `primary_container`. 8px corner radius. No border. Text in `on_primary`.
*   **Secondary:** `surface_container_highest` background with `on_surface` text.
*   **Tertiary (Accent):** `tertiary` (#854a03) text for "Danger" or "Critical" inventory alerts.

### Cards & Lists
*   **Rule:** Forbid the use of divider lines. 
*   **Implementation:** Use a `16px` vertical spacing scale to separate items. For high-density lists, alternate row backgrounds between `surface` and `surface-container-lowest`.
*   **The "Inventory Chip":** Status indicators (In Stock, Low, Out) should use the `tertiary_fixed` (#ffdcc1) for low stock, and `primary_fixed` (#b9efc5) for healthy stock, keeping the look muted and professional.

### Input Fields
*   **Style:** Minimalist. No bottom line. Use `surface-container-highest` as a subtle fill.
*   **States:** On focus, the background remains, but a `2px` ghost border of `primary` (#316342) appears at 30% opacity.

### Signature Component: The "Growth Bar"
Instead of a standard progress bar for stock levels, use a custom-tapered bar with an 8px radius. High stock uses the `primary` green; as stock depletes, it transitions into the `tertiary` terracotta, signaling a need for action through color emotion rather than just numbers.

## 6. Do’s and Don’ts

### Do
*   **Do** use asymmetrical margins (e.g., more padding on the left than the right in hero sections) to create an editorial feel.
*   **Do** prioritize `surface-container` shifts over lines to define data groups.
*   **Do** use `tertiary` (Terracotta) sparingly—only for elements that require the user's immediate "human" intervention.

### Don't
*   **Don't** use pure black (#000000) for text. Use `on_surface` (#1a1c1a) to maintain the soft, organic vibe.
*   **Don't** use 100% opaque borders. They break the "Living" feel of the interface.
*   **Don't** cram data. If an inventory screen feels "busy," increase the `surface` padding. This system relies on "Luxury Space."