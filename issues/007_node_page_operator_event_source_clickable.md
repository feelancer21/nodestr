# Issue 007: Node Page - Operator Event Source Not Clickable

**Status:** Open
**Created:** 2026-02-01
**Reported by:** Product Owner

## Finding Description (Product Owner Perspective)

Node Page: Die Event Source ist für den Operator nicht klickbar.

## Technical Analysis (Technical Lead Perspective)

In `NodeBanner.tsx`, the ViewSourceModal for the operator announcement is rendered inside an `<a>` tag that links to the operator's profile:

```tsx
<a
  href={operator.pubkey ? `/profile/${operator.pubkey}` : undefined}
  className={cn(
    'flex items-center gap-3',
    operator.pubkey && 'hover:opacity-80 transition-opacity'
  )}
>
  <Avatar>...</Avatar>
  <div className="flex-1 min-w-0">
    <div className="flex items-center gap-2">
      <span className="text-xs text-label">Operator</span>
      {operator.lastAnnouncement && (
        <span className="text-xs text-muted-foreground">...</span>
      )}
      {operator.announcementEvent && (
        <ViewSourceModal event={operator.announcementEvent} />
      )}
    </div>
    <p className="text-sm font-medium text-foreground truncate">
      {operatorDisplayName}
    </p>
  </div>
</a>
```

The problem is that the ViewSourceModal button is nested inside the `<a>` link. When clicking the ViewSourceModal icon:
1. The click event bubbles up to the parent `<a>` tag
2. The browser navigates to the profile page instead of opening the modal
3. Even if the modal opens briefly, the navigation interrupts it

This is a classic "nested interactive elements" problem.

## Impact Assessment

- **Severity:** Medium (functional bug)
- **Affected areas:** NodeBanner component, user interaction
- **User impact:** Users cannot view the source Nostr event for operator announcements

## Recommended Resolution Approach

1. **Option A: Stop event propagation** - Add `onClick={(e) => e.stopPropagation()}` wrapper around ViewSourceModal:
   ```tsx
   <div onClick={(e) => e.stopPropagation()}>
     <ViewSourceModal event={operator.announcementEvent} />
   </div>
   ```

2. **Option B: Restructure the layout** - Move ViewSourceModal outside the `<a>` tag:
   ```tsx
   <div className="flex items-center gap-3">
     <a href={...} className="flex items-center gap-3 flex-1">
       <Avatar>...</Avatar>
       <div>...</div>
     </a>
     {operator.announcementEvent && (
       <ViewSourceModal event={operator.announcementEvent} />
     )}
   </div>
   ```

3. **Option C: Use `e.preventDefault()`** - In the ViewSourceModal's button onClick handler

Option B is the cleanest solution as it avoids nested interactive elements entirely and follows HTML best practices.

## Context & Constraints

- The ViewSourceModal uses Dialog from Radix UI (via shadcn/ui)
- The Dialog trigger is a button element
- Nested `<a>` and `<button>` elements are invalid HTML and cause accessibility issues
- The fix should maintain the visual layout while making both interactions work
