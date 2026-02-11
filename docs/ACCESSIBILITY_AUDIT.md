# Accessibility Audit

**Sprint 42** — WCAG 2.1 AA baseline and critical issue remediation

## Audit Method

To run a full accessibility audit:
```bash
# Install axe-core CLI
npm install -g @axe-core/cli

# Run against deployed site
axe https://ethboulder.commons.id/app/ --tags wcag2a,wcag2aa
```

Or use Chrome DevTools → Lighthouse → Accessibility.

## Known Issues

### Critical (Must Fix)

#### 1. Missing ARIA Labels on Icon-Only Buttons
**Issue:** Filter buttons, color mode toggles, mobile menu use icons without accessible labels.  
**WCAG:** 2.4.4 Link Purpose (In Context), 4.1.2 Name, Role, Value  
**Impact:** Screen readers can't announce button purpose  
**Fix:** Add `aria-label` to all icon-only buttons

**Locations:**
- Graph page: Color mode buttons (REA, Type, Dimension, Cluster)
- Graph page: Filter toggle button
- Nav: Mobile hamburger menu
- Explore: 2-D / 3-D toggle
- Search icon button in nav

#### 2. Focus Management in Modals/Panels
**Issue:** When filter panel opens, focus doesn't move to panel. No focus trap.  
**WCAG:** 2.4.3 Focus Order  
**Impact:** Keyboard users lose context  
**Fix:** Use `useRef` + `focus()` on panel open, implement focus trap

#### 3. Color Contrast Violations
**Issue:** Text on dark backgrounds may not meet 4.5:1 ratio  
**WCAG:** 1.4.3 Contrast (Minimum)  
**Areas to check:**
- Gray text (#666, #999) on #0f0f0f background
- Dimension keys in nav (may be too dim)
- Contribution status badges

**Fix:** Run contrast checker, adjust to 4.5:1 minimum

#### 4. Missing Form Labels
**Issue:** Search input, contribution textarea may lack explicit labels  
**WCAG:** 3.3.2 Labels or Instructions  
**Fix:** Add `<label>` with `htmlFor` or `aria-label`

#### 5. Graph SVG Accessibility
**Issue:** D3 force graph has no text alternatives, navigation is mouse-only  
**WCAG:** 1.1.1 Non-text Content, 2.1.1 Keyboard  
**Impact:** Graph is completely inaccessible to screen readers and keyboard users  
**Fix:**
- Add `role="img"` and `aria-label` to SVG
- Provide text alternative (list of artifacts)
- Consider keyboard navigation (tab through nodes, arrow keys to navigate)

### Medium (Should Fix)

#### 6. Heading Hierarchy
**Issue:** May skip heading levels (h1 → h3)  
**WCAG:** 1.3.1 Info and Relationships  
**Fix:** Audit heading structure, ensure sequential

#### 7. Link Text Clarity
**Issue:** "View details" links lack context for screen readers  
**WCAG:** 2.4.4 Link Purpose  
**Fix:** Add `aria-label="View details for {artifact.title}"`

#### 8. Loading States
**Issue:** Loading spinners have no accessible text  
**WCAG:** 4.1.3 Status Messages  
**Fix:** Add `aria-live="polite"` region with text "Loading..."

#### 9. Dynamic Content Announcements
**Issue:** Real-time updates (new contributions) aren't announced  
**WCAG:** 4.1.3 Status Messages  
**Fix:** Use `aria-live="polite"` for notifications

### Low (Nice to Have)

#### 10. Skip Links
**Issue:** No "skip to main content" link  
**Fix:** Add visually-hidden skip link at top

#### 11. Landmark Regions
**Issue:** May lack proper `<nav>`, `<main>`, `<aside>` semantics  
**Fix:** Audit and add ARIA landmarks where missing

#### 12. Focus Indicators
**Issue:** Default browser focus may be hard to see on dark background  
**Fix:** Add custom `:focus-visible` styles with high-contrast outline

## Quick Wins (Implemented in Sprint 42)

### Added ARIA Labels
- [x] Graph color mode buttons
- [x] Graph filter button
- [x] Mobile menu toggle
- [x] 2-D / 3-D toggle on Explore
- [x] Search icon button

### Focus Management
- [x] Filter panel auto-focuses first filter button on open
- [x] Modal close returns focus to trigger

### Form Labels
- [x] Search input has explicit label (visually hidden)
- [x] Contribution textarea has label

## Testing Checklist

- [ ] Run axe-core CLI against all pages
- [ ] Run Lighthouse accessibility audit
- [ ] Manual keyboard navigation test (Tab, Enter, Esc, Arrow keys)
- [ ] Screen reader test (NVDA/JAWS on Windows, VoiceOver on Mac)
- [ ] Color contrast check (WebAIM Contrast Checker)

## Acceptance Criteria

- **Zero critical axe-core violations**
- **Lighthouse accessibility score ≥ 90**
- **All interactive elements keyboard accessible**
- **All form inputs have labels**
- **Color contrast ≥ 4.5:1 for normal text, ≥ 3:1 for large text**

## Future Work (Post-ETHBoulder)

- Graph keyboard navigation (tab through nodes, arrow keys)
- Focus trap in modals
- Skip links
- ARIA live regions for real-time updates
- Comprehensive screen reader testing
- User testing with assistive technology users

## Notes

ETHBoulder is Feb 13-16. Prioritize critical fixes now, defer complex work (graph keyboard nav) to post-event.

Most issues can be caught with automated tools (axe-core, Lighthouse). Manual testing required for focus management and screen reader experience.
