# Material Design 3 (M3) System Guide

Welcome to the custom **Material Design 3 (M3)** implementation for this Next.js + Tailwind CSS Dashboard. This document serves as the single source of truth for UI/UX developers to ensure consistency.

## 1. Core Principles
*   **Dynamic Colors & Roles:** We use M3 color roles (Primary, Surface, Container, etc.) instead of generic colors.
*   **Typography:** We follow the M3 type scale (Display, Headline, Title, Body, Label).
*   **Elevation (Shadow & Tonal):** M3 uses both shadows and "Tonal Elevation" (slight background color shifts surface layers) to signify depth.
*   **Micro-interactions:** Interactive elements (Buttons, List items) MUST have State Layers (Hover, Focus, Pressed) and a Ripple effect.

## 2. Color System Mappings (via Tailwind)
Our `tailwind.config.js` and `globals.css` map standard M3 roles into Tailwind classes. We use the `hsl(var(--color))` format to support easy light/dark mode switching.

### Primary Roles
*   `bg-primary`: The main brand color used for high-emphasis components (like primary action buttons).
*   `text-primary-foreground` (On Primary): Text color used *on top of* `bg-primary` for contrast.
*   `bg-primary-container`: A lighter/softer version of primary, used for less prominent highlights or selected states.
*   `text-on-primary-container`: Text color used *on top of* the primary container.

### Surface Roles
*   `bg-background`: The main app background color (App layout background).
*   `bg-surface`: The standard background color for cards, sheets, and menus.
*   `bg-surface-variant`: A slightly contrasting background used for tonal separation.
*   `bg-surface-container-highest`: Used for active states on surfaces.
*   `text-foreground` (On Surface): The standard text color used on top of backgrounds and surfaces.
*   `text-muted-foreground` (On Surface Variant): Lower-emphasis text used for secondary information or subtitles.
*   `border` (Outline/Outline Variant): Used for borders, dividers, and outlined components.

### Semantic Roles
*   **Secondary/Tertiary:** Kept in config for future use if needed.
*   `bg-destructive` (Error): Used for destructive actions or alerts.
*   `text-destructive-foreground` (On Error): Text on error surfaces.
*   `text-success`: For positive trends.

## 3. Typography
Our font is standard (`Roboto` or `Inter`). We map standard utility classes conceptually to M3:
*   **Headline (Large/Medium/Small):** `text-4xl`, `text-3xl`, `text-2xl`
*   **Title (Large/Medium/Small):** `text-xl`, `text-lg`, `text-base font-medium`
*   **Body (Large/Medium/Small):** `text-base`, `text-sm`, `text-xs`
*   **Label (Large/Medium/Small):** `text-sm font-medium`, `text-xs font-medium`, `text-[11px] font-medium` (Used inside buttons, chips, overlines)

## 4. State Layers & Interactions
M3 relies heavily on "State Layers" — a semi-transparent overlay that indicates if a component is Hovered, Focused, Pressed, or Dragged.

*   **Hover:** Generally handled via standard Tailwind utilities like `hover:bg-primary/90` or `hover:bg-black/5`.
*   **Ripple Effect:** All interactive base components *must* include the `<Ripple />` component (found in `components/ui/ripple.tsx`). The ripple provides immediate, realistic visual feedback originating from the point of touch/click.

## 5. Components Architecture
Do not use raw HTML `<button>` or custom `<div className="card">` tags scattered around. Use the centrally defined M3-compliant React components:

*   **Buttons:** Import from `components/ui/button.tsx`. Variants:
    *   `variant="filled"`: High emphasis, uses `bg-primary`.
    *   `variant="tonal"`: Medium emphasis, uses `bg-secondary` or `bg-primary-container`.
    *   `variant="outlined"`: Medium emphasis, uses `border` and transparent background.
    *   `variant="text"`: Low emphasis, no border or background until hovered.
*   **Cards:** Import from `components/ui/card.tsx`.
    *   Cards should default to an M3 "Elevated" or "Filled" look, utilizing rounded corners typically `rounded-xl` or `rounded-2xl`.

---
*Created as part of the initial Material Design 3 Migration.*
