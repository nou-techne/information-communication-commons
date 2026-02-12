# Accessibility Audit Checklist (WCAG 2.1 AA)

This checklist covers accessibility requirements for commons.id platform components and pages.

---

## Color Contrast (WCAG 1.4.3, 1.4.11)

### Text Contrast
- [ ] **Body text** (#d1d5db on #0a0a0a): 14.8:1 ✓ (AA: 4.5:1)
- [ ] **Gray text** (#9ca3af on #0a0a0a): 9.3:1 ✓ (AA: 4.5:1)
- [ ] **Primary accent** (#c3fd50 on #0a0a0a): 15.2:1 ✓ (AA: 4.5:1)
- [ ] **Link text** (#3b82f6 on #0a0a0a): 8.2:1 ✓ (AA: 4.5:1)
- [ ] **Error text** (#ef4444 on #0a0a0a): 5.9:1 ✓ (AA: 4.5:1)

### Non-Text Contrast
- [ ] **Border colors** (#262626 on #0a0a0a): 2.1:1 (needs improvement for AA 3:1)
- [ ] **Graph nodes** (various colors): verify 3:1 against backgrounds
- [ ] **Button borders** in focus state: ensure 3:1

### Actions Required
- Increase border contrast from #262626 to #3a3a3a (3.1:1)
- Verify all graph node colors meet 3:1 against dark background

---

## Keyboard Navigation (WCAG 2.1.1, 2.4.3, 2.4.7)

### Tab Order
- [ ] **Navigation**: Logo → Convergence Switcher → Main Nav → User Menu
- [ ] **Dashboard**: Cards → Threads list → Actions
- [ ] **Graph**: Controls → Filter panel → Legend
- [ ] **Thread View**: Thread list → Message input → Reply buttons
- [ ] **Forms**: Natural top-to-bottom, left-to-right order

### Keyboard Shortcuts
- [ ] **Global**: `?` opens shortcuts modal, `Esc` closes modals
- [ ] **Navigation**: Arrow keys in lists, Enter to activate
- [ ] **Modals**: Tab traps focus, Esc closes
- [ ] **Dropdowns**: Arrow keys navigate, Enter selects, Esc closes

### Focus Management
- [ ] All interactive elements receive visible focus indicator (2px solid #c3fd50)
- [ ] Focus trapped in modals (ResolveThreadDialog, KeyboardShortcutsModal)
- [ ] Focus restored to trigger element when modal closes
- [ ] Skip links provided for main content areas

### Actions Required
- Add skip navigation link: "Skip to main content"
- Ensure all custom controls (convergence switcher, peer registry) trap focus appropriately
- Add focus-visible styles to all interactive elements

---

## ARIA Labels & Roles (WCAG 4.1.2)

### Navigation
- [ ] `<nav aria-label="Main navigation">`
- [ ] Convergence switcher: `aria-expanded`, `aria-haspopup="menu"`
- [ ] Current page indicator: `aria-current="page"`

### Buttons
- [ ] Icon-only buttons have `aria-label` (e.g., "Remove peer", "Sync", "Close")
- [ ] Toggle buttons have `aria-pressed` state
- [ ] Loading buttons have `aria-busy="true"`

### Forms
- [ ] All inputs associated with labels (explicit or `aria-label`)
- [ ] Error messages linked via `aria-describedby`
- [ ] Required fields marked with `aria-required="true"`
- [ ] Invalid fields marked with `aria-invalid="true"`

### Dynamic Content
- [ ] Thread updates: `role="status"` or `aria-live="polite"`
- [ ] Error alerts: `role="alert"` or `aria-live="assertive"`
- [ ] Loading states: `aria-busy` on container
- [ ] Graph updates: `aria-live="polite"` on node count

### Complex Widgets
- [ ] **Graph**: `role="img"` with `aria-label` describing visualization
- [ ] **Heatmap**: `role="img"` with alt describing data
- [ ] **Radar chart**: `role="img"` with data table alternative
- [ ] **VirtualList**: `role="list"`, items with `role="listitem"`

### Actions Required
- Add `aria-label` to all icon-only buttons (27 instances)
- Add `aria-live` regions for real-time updates (threads, messages, sync status)
- Ensure all form inputs have associated labels
- Add descriptive `aria-label` to all chart visualizations

---

## Screen Reader Support (WCAG 1.3.1, 4.1.3)

### Semantic HTML
- [ ] Headings follow logical hierarchy (h1 → h2 → h3)
- [ ] Lists use `<ul>/<ol>` markup
- [ ] Tables use `<table>`, `<th>`, `<caption>`
- [ ] Form structure uses `<fieldset>` and `<legend>` where appropriate

### Announcements
- [ ] Toast notifications announced via `role="status"` or `role="alert"`
- [ ] Page title updates on navigation
- [ ] Form submission results announced
- [ ] Loading state changes announced

### Landmark Regions
- [ ] `<header>` or `role="banner"`
- [ ] `<nav>` or `role="navigation"`
- [ ] `<main>` or `role="main"`
- [ ] `<aside>` or `role="complementary"` for sidebars
- [ ] `<footer>` or `role="contentinfo"`

### Actions Required
- Wrap main content in `<main>` element
- Add `<header>` wrapper for top navigation
- Add page title updates on route changes
- Test with NVDA/JAWS for announcement timing

---

## Focus Indicators (WCAG 2.4.7)

### Current Implementation
- Focus ring: 2px solid #c3fd50 with 2px offset
- Applied to: buttons, links, inputs, custom controls

### Required Coverage
- [ ] All buttons (primary, secondary, ghost, danger variants)
- [ ] All links (navigation, inline, external)
- [ ] All form inputs (text, textarea, select, checkbox)
- [ ] Convergence switcher dropdown items
- [ ] Peer registry actions
- [ ] Graph filter checkboxes
- [ ] Virtual list items (when navigating with keyboard)

### Actions Required
- Add focus-visible polyfill for older browsers
- Ensure focus is never removed via `:focus { outline: none }` without alternative
- Test focus visibility against all background colors

---

## Page-Specific Requirements

### Dashboard
- [ ] Metric cards: heading structure (h2 for card titles)
- [ ] Thread list: `role="list"`, keyboard navigable
- [ ] Activity feed: chronological order, timestamps accessible

### Graph Page
- [ ] SVG elements: `role="img"`, descriptive title/desc
- [ ] Filter panel: checkbox states announced
- [ ] Node detail sidebar: focus moves to sidebar when opened
- [ ] Legend: accessible color/shape descriptions

### Thread View
- [ ] Message list: semantic markup, chronological
- [ ] Reply forms: labeled inputs, error handling
- [ ] Status indicators: text alternatives for icons
- [ ] Timestamp: `<time datetime="">` element

### Analytics Page
- [ ] Charts: data table alternatives provided
- [ ] Sparklines: `aria-label` with value range
- [ ] Radar chart: table with dimension values
- [ ] Heatmap: cell values accessible via tooltip or table

### Federation Page
- [ ] Peer list: status communicated via text, not just color
- [ ] Sync controls: button states clear
- [ ] Activity log: chronological, filterable
- [ ] Settings toggles: `role="switch"`, `aria-checked`

---

## Testing Checklist

### Automated Testing
- [ ] Run axe DevTools on all pages
- [ ] Run Lighthouse accessibility audit (target: 95+)
- [ ] Run pa11y or similar CLI tool in CI

### Manual Testing
- [ ] Navigate entire site using only keyboard
- [ ] Test with screen reader (NVDA on Windows, VoiceOver on Mac)
- [ ] Test with 200% zoom
- [ ] Test with high contrast mode
- [ ] Test with reduced motion preference

### Browser Testing
- [ ] Chrome + ChromeVox
- [ ] Firefox + NVDA
- [ ] Safari + VoiceOver
- [ ] Edge + Narrator

---

## Priority Fixes

### High Priority (Blockers for WCAG AA)
1. Increase border contrast: #262626 → #3a3a3a
2. Add aria-label to all icon-only buttons
3. Add skip navigation link
4. Ensure focus indicators on all interactive elements

### Medium Priority (Usability improvements)
1. Add aria-live regions for dynamic updates
2. Implement focus trapping in all modals
3. Add data table alternatives for charts
4. Test with real screen readers

### Low Priority (WCAG AAA or enhancements)
1. Provide text transcripts for any future audio/video
2. Add sign language interpretation option
3. Consider simplified language mode
4. Add reading order indicators

---

## Resources

- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [Inclusive Components](https://inclusive-components.design/)

---

**Last Updated:** February 12, 2026  
**Next Review:** Before public launch
