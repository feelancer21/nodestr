# Design System

Complete design system documentation for the nodestr project. This is the authoritative reference for all visual standards, component patterns, and styling decisions.

---

## Table of Contents

- [Design Philosophy](#design-philosophy)
- [Core Principles](#core-principles)
- [CSS Custom Properties](#css-custom-properties)
- [Typography Hierarchy](#typography-hierarchy)
- [Link Styling](#link-styling)
- [Component Patterns](#component-patterns)
- [Anti-Patterns](#anti-patterns)
- [Responsive Override Awareness](#responsive-override-awareness)
- [Theme System](#theme-system)
- [shadcn/ui Components](#shadcnui-components)
- [Network Badge Colors](#network-badge-colors)
- [Loading States](#loading-states)
- [Empty States](#empty-states)
- [Data Table Design Reference](#data-table-design-reference)
- [Interaction Patterns](#interaction-patterns)
- [Technical Requirements](#technical-requirements)
- [Adding Fonts](#adding-fonts)
- [Color Scheme Implementation](#color-scheme-implementation)
- [Component Styling Patterns](#component-styling-patterns)

---

## Design Philosophy

- Create breathtaking, immersive designs that feel like bespoke masterpieces, rivaling the polish of Apple, Stripe, or luxury brands
- Designs must be production-ready, fully featured, with no placeholders unless explicitly requested, ensuring every element serves a functional and aesthetic purpose
- Avoid generic or templated aesthetics at all costs; every design must have a unique, brand-specific visual signature that feels custom-crafted
- Headers must be dynamic, immersive, and storytelling-driven, using layered visuals, motion, and symbolic elements to reflect the brand's identity — never use simple "icon and text" combos
- Incorporate purposeful, lightweight animations for scroll reveals, micro-interactions (e.g., hover, click, transitions), and section transitions to create a sense of delight and fluidity

### Design Principles

- Achieve Apple-level refinement with meticulous attention to detail, ensuring designs evoke strong emotions (e.g., wonder, inspiration, energy) through color, motion, and composition
- Deliver fully functional interactive components with intuitive feedback states, ensuring every element has a clear purpose and enhances user engagement
- **Generate custom images liberally** when image generation tools are available - this is ALWAYS preferred over stock photography for creating unique, brand-specific visuals that perfectly match the design intent
- Ensure designs feel alive and modern with dynamic elements like gradients, glows, or parallax effects, avoiding static or flat aesthetics
- Before finalizing, ask: "Would this design make Apple or Stripe designers pause and take notice?" If not, iterate until it does

### Avoid Generic Design

- No basic layouts (e.g., text-on-left, image-on-right) without significant custom polish, such as dynamic backgrounds, layered visuals, or interactive elements
- No simplistic headers; they must be immersive, animated, and reflective of the brand's core identity and mission
- No designs that could be mistaken for free templates or overused patterns; every element must feel intentional and tailored

---

## Core Principles

1. Use CSS custom properties (variables) instead of direct Tailwind colors
2. Never use direct slate colors (`text-slate-*`, `bg-slate-*`) - use semantic tokens
3. Maintain consistent typography hierarchy across all components
4. Accent colors add subtle visual interest without overwhelming

---

## CSS Custom Properties

### Text Colors

- `text-foreground` - Primary text (headings, body)
- `text-muted-foreground` - Secondary/meta text
- `text-label` - Accent color for labels and small metadata (emerald tone)
- `text-link` - Hyperlinks (orange tone)

### Background Colors

- `bg-background` - Page background
- `bg-card` - Card backgrounds
- `bg-muted` - Subtle emphasis areas
- `bg-input-background` - Input/textarea field backgrounds (subtle contrast from page background)

### Border Colors

- `border-border` - Standard borders

---

## Typography Hierarchy

| Element | Classes | Usage |
|---------|---------|-------|
| Page title | `text-2xl sm:text-3xl font-semibold text-foreground` | Main page headings |
| Section header | `text-lg font-semibold text-foreground` | Card titles, section headings |
| Card title | `text-base font-semibold text-foreground` | Secondary card headings |
| Body text | `text-sm text-foreground` | Main content, descriptions |
| Labels/Meta | `text-xs text-label` | Field labels, metadata, timestamps |
| Muted text | `text-xs text-muted-foreground` | Hints, secondary info |

---

## Link Styling

All clickable links must use:
```tsx
className="text-link hover:underline"
```

---

## Component Patterns

### Cards

```tsx
<Card className="border-border bg-card">
```

### Section Separation in Cards

Use `border-t border-border pt-4` between sections.

### Labels with Accent

```tsx
<span className="text-xs text-label">Label Text</span>
```

### Timestamps with Tooltips

For relative timestamps (e.g., "24d ago") that need a full date tooltip, use the HTML `title` attribute (not the `<Tooltip>` component):

```tsx
// Correct - simple title attribute
<span
  className="text-xs text-muted-foreground"
  title={new Date(timestamp * 1000).toLocaleString()}
>
  {formatRelativeTime(timestamp)}
</span>

// Incorrect - don't use Tooltip component for simple timestamp tooltips
<Tooltip>
  <TooltipTrigger>...</TooltipTrigger>
  <TooltipContent>...</TooltipContent>
</Tooltip>
```

Use `formatRelativeTime()` from `@/lib/utils` for consistent relative time formatting ("24d ago", "3h ago", etc.).

---

## Anti-Patterns (Do NOT Use)

- `text-slate-500`, `text-slate-600`, etc.
- `bg-slate-50`, `bg-slate-100`, etc.
- `dark:text-slate-*` variants
- `text-sm uppercase tracking-[0.2em]` for headers
- Direct color values that bypass CSS variables

---

## Responsive Override Awareness

shadcn/ui components have responsive base classes (e.g., `CardContent` uses `p-3 pt-0 sm:p-6 sm:pt-0`). Non-responsive utility overrides (e.g., `py-12`) do **NOT** override responsive base classes at `sm:` and above — responsive rules take CSS precedence because they appear later in the generated stylesheet.

**Always match responsive prefixes when overriding component padding/spacing:**

```tsx
// Bad - py-12 gets overridden by sm:p-6 sm:pt-0 at sm+ breakpoints
<CardContent className="py-12 text-center">

// Good - explicitly override at each responsive breakpoint
<CardContent className="py-12 sm:py-12 text-center">
```

**Components with responsive base padding:**
- `CardContent`: `p-3 pt-0 sm:p-6 sm:pt-0`
- `CardHeader`: `p-3 sm:p-6`
- `CardFooter`: `p-3 pt-0 sm:p-6 sm:pt-0`

---

## Theme System

- Light/dark mode with CSS custom properties
- Control via `useTheme` hook
- Colors defined in `src/index.css`
- Automatic dark mode with `.dark` class

---

## shadcn/ui Components

48+ accessible components available:
- Buttons, Cards, Dialogs, Forms, Tables, Badges, Skeletons, etc.
- Built on Radix UI primitives
- Styled with Tailwind CSS
- Use `cn()` utility for class merging

---

## Network Badge Colors

```typescript
function getNetworkBadgeColor(network: string) {
  switch (network) {
    case 'mainnet':  return 'bg-emerald-500/10 text-emerald-200';
    case 'testnet':  return 'bg-blue-500/10 text-blue-200';
    case 'testnet4': return 'bg-indigo-500/10 text-indigo-200';
    case 'signet':   return 'bg-amber-500/10 text-amber-200';
    default:         return 'bg-slate-500/10 text-slate-200';
  }
}
```

---

## Loading States

**Use skeleton loaders** for structured content (feeds, profiles, forms):

```tsx
<Card>
  <CardHeader>
    <Skeleton className="h-4 w-48" />
  </CardHeader>
  <CardContent>
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-4/5" />
  </CardContent>
</Card>
```

**Use spinners** only for buttons or short operations.

---

## Empty States

```tsx
<Card className="border-dashed">
  <CardContent className="py-12 text-center">
    <p className="text-muted-foreground">
      No results found. Check relay connections or wait for content to load.
    </p>
  </CardContent>
</Card>
```

---

## Data Table Design Reference

**Preferred Implementation**: [OpenStatus Data Table](https://data-table.openstatus.dev/light)

**Why it fits**:
- Built on TanStack Table + shadcn/ui (already in stack)
- Matches existing design system and theming
- Faceted filters, sorting, command palette integration
- URL-based state persistence with `nuqs` (optional)

**Key Features**:
- Multi-column filtering (status, network, date range, text search)
- Command palette integration (`Cmd+K` - using `cmdk` package)
- Responsive design with light/dark mode
- Advanced query syntax (union filters, range filters, phrase search)

**Usage**:
- Future: CLIP event management, admin views
- Reference for complex data table implementations

---

## Interaction Patterns

- Use progressive disclosure for complex forms or content to guide users intuitively and reduce cognitive load
- Incorporate contextual menus, smart tooltips, and visual cues to enhance navigation and usability
- Implement drag-and-drop, hover effects, and transitions with clear, dynamic visual feedback to elevate the user experience
- Support power users with keyboard shortcuts, ARIA labels, and focus states for accessibility and efficiency
- Add subtle parallax effects or scroll-triggered animations to create depth and engagement without overwhelming the user

---

## Technical Requirements

- Curated color palette (3-5 evocative colors + neutrals) that aligns with the brand's emotional tone and creates a memorable impact
- Ensure a minimum 4.5:1 contrast ratio for all text and interactive elements to meet accessibility standards
- Use expressive, readable fonts (18px+ for body text, 40px+ for headlines) with a clear hierarchy; pair a modern sans-serif (e.g., Inter) with an elegant serif (e.g., Playfair Display) for personality
- Design for full responsiveness, ensuring flawless performance and aesthetics across all screen sizes (mobile, tablet, desktop)
- Adhere to WCAG 2.1 AA guidelines, including keyboard navigation, screen reader support, and reduced motion options
- Follow an 8px grid system for consistent spacing, padding, and alignment to ensure visual harmony
- Add depth with subtle shadows, gradients, glows, and rounded corners (e.g., 16px radius) to create a polished, modern aesthetic
- Optimize animations and interactions to be lightweight and performant, ensuring smooth experiences across devices

### Components

- Design reusable, modular components with consistent styling, behavior, and feedback states (e.g., hover, active, focus, error)
- Include purposeful animations (e.g., scale-up on hover, fade-in on scroll) to guide attention and enhance interactivity without distraction
- Ensure full accessibility support with keyboard navigation, ARIA labels, and visible focus states (e.g., a glowing outline in an accent color)
- Use custom icons or illustrations for components to reinforce the brand's visual identity

---

## Adding Fonts

To add custom fonts, follow these steps:

1. **Install a font package** using npm:

   **Any Google Font can be installed** using the @fontsource packages. Examples:
   - For Inter Variable: `@fontsource-variable/inter`
   - For Roboto: `@fontsource/roboto`
   - For Outfit Variable: `@fontsource-variable/outfit`
   - For Poppins: `@fontsource/poppins`
   - For Open Sans: `@fontsource/open-sans`

   **Format**: `@fontsource/[font-name]` or `@fontsource-variable/[font-name]` (for variable fonts)

2. **Import the font** in `src/main.tsx`:
   ```typescript
   import '@fontsource-variable/<font-name>';
   ```

3. **Update Tailwind configuration** in `tailwind.config.ts`:
   ```typescript
   export default {
     theme: {
       extend: {
         fontFamily: {
           sans: ['Inter Variable', 'Inter', 'system-ui', 'sans-serif'],
         },
       },
     },
   }
   ```

### Recommended Font Choices by Use Case

- **Modern/Clean**: Inter Variable, Outfit Variable, or Manrope
- **Professional/Corporate**: Roboto, Open Sans, or Source Sans Pro
- **Creative/Artistic**: Poppins, Nunito, or Comfortaa
- **Technical/Code**: JetBrains Mono, Fira Code, or Source Code Pro (for monospace)

---

## Color Scheme Implementation

When users specify color schemes:
- Update CSS custom properties in `src/index.css` (both `:root` and `.dark` selectors)
- Use Tailwind's color palette or define custom colors
- Ensure proper contrast ratios for accessibility
- Apply colors consistently across components (buttons, links, accents)
- Test both light and dark mode variants

---

## Scrollbar Styling

Global slim scrollbar styling is defined in `src/index.css` and applies to ALL native scrollbars automatically. No per-component scrollbar CSS is needed.

**Rules:**
- **Do NOT add inline scrollbar styles** — the global CSS handles everything
- **Use `overflow-auto` or `overflow-y-auto`** for scrollable containers — they get slim scrollbars automatically
- **Use Radix `ScrollArea`** only when programmatic scroll control is needed (e.g., auto-scroll to bottom in chat)
- **Never use `scrollbar-width: none` or `::-webkit-scrollbar { display: none }`** to hide scrollbars — users need scroll affordance
- Scrollbar thumb uses `--border` color (adapts to light/dark theme automatically)

---

## Component Styling Patterns

- Use `cn()` utility for conditional class merging
- Follow shadcn/ui patterns for component variants
- Implement responsive design with Tailwind breakpoints
- Add hover and focus states for interactive elements
- When using negative z-index (e.g., `-z-10`) for background images or decorative elements, **always add `isolate` to the parent container** to create a local stacking context. Without `isolate`, negative z-index pushes elements behind the page's background color, making them invisible.
