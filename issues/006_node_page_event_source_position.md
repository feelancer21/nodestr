# Issue 006: Node Page - Event Source Icons Position

**Status:** Open
**Created:** 2026-02-01
**Reported by:** Product Owner

## Finding Description (Product Owner Perspective)

Node Page: Die Event Source Icons sollten unten links in der Box sein. (Timestamp weiterhin oben, das ist ok).

## Technical Analysis (Technical Lead Perspective)

Currently in `NodePage.tsx`, the ViewSourceModal for Node Info is positioned in the Card header next to the timestamp:

```tsx
<CardHeader>
  <div className="flex items-center justify-between">
    <CardTitle className="text-base font-semibold text-foreground">
      Node Info
    </CardTitle>
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground" title={...}>
        {formatRelativeTime(nodeInfo.event.created_at)}
      </span>
      <ViewSourceModal event={nodeInfo.event} />
    </div>
  </div>
</CardHeader>
```

The Product Owner wants the ViewSourceModal (Event Source icon) to be positioned at the bottom-left of the Card, while keeping the timestamp at the top-right.

## Impact Assessment

- **Severity:** Low (cosmetic/UX improvement)
- **Affected areas:** NodePage layout, visual hierarchy
- **User impact:** Minor - affects discoverability and visual consistency

## Recommended Resolution Approach

1. Move the ViewSourceModal from CardHeader to CardContent or CardFooter
2. Keep the timestamp in the CardHeader (top-right position)
3. Position the ViewSourceModal at bottom-left of the card content area
4. Consider adding a CardFooter component if not already present:

```tsx
<Card>
  <CardHeader>
    <div className="flex items-center justify-between">
      <CardTitle>Node Info</CardTitle>
      <span className="text-xs text-muted-foreground">
        {formatRelativeTime(nodeInfo.event.created_at)}
      </span>
    </div>
  </CardHeader>
  <CardContent>
    <NodeInfoContent content={nodeInfo.content} />
  </CardContent>
  <CardFooter className="pt-0">
    <ViewSourceModal event={nodeInfo.event} />
  </CardFooter>
</Card>
```

5. Apply the same pattern to the Operator section in NodeBanner if applicable

## Context & Constraints

- The ViewSourceModal component is a small icon button that opens a modal
- Consistency with other cards in the application should be considered
- The CardFooter component from shadcn/ui may need to be imported
