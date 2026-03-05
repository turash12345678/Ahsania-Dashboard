# Style Guide

This document references the design tokens used in the application. These are defined in `tailwind.config.js` and `app/globals.css`.

## 🎨 Colors

### Primary Palette
| Name | Variable | Hex (Approx) | Usage |
|------|----------|--------------|-------|
| **Background** | `--bg-app` | `#f8fafc` | The main background of the application. |
| **Card Background** | `--bg-card` | `#ffffff` | Background for cards and containers. |
| **Text Primary** | `--text-primary` | `#0f172a` | Main body text. |
| **Text Secondary** | `--text-secondary` | `#64748b` | Muted text, labels, and hints. |
| **Accent / Primary** | `--accent` | `#2563eb` | Primary action buttons, links, and highlights. |
| **Accent Foreground** | `--accent-fg` | `#ffffff` | Text on top of accent colors. |

### Feedback Colors
- **Success**: `var(--success)` (#22c55e)
- **Danger**: `var(--danger)` (#ef4444)

## 🔤 Typography

### Font Family
- **Main**: `Inter` (sans-serif)
- **Headings**: `Inter` (sans-serif) - *Configurable in `tailwind.config.js`*

### Headings
- **H1**: Page titles (e.g., "Inventory Management")
- **H2**: Section titles
- **H3**: Card titles

## 📐 Spacing & Layout

- **Radius**: `var(--radius)` (8px) - Used for buttons, inputs, and cards.
- **Container Padding**: `2rem` (desktop), `1rem` (mobile).

## 🖱️ Interactive States

- **Hover**: Standard interactive elements should darken or lighten by 10% on hover.
- **Focus**: Inputs and buttons should have a focus ring matching the `--accent` color.
