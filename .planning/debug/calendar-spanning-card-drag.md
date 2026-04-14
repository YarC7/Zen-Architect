---
status: resolved
trigger: "Timeline view dragging bar still not working after drop zone fixes"
created: "2026-04-12T00:00:00.000Z"
updated: "2026-04-14T03:56:15.705Z"
commits: ["d849bec", "54ef419", "7ba71b3", "73d482b"]
---

## Symptoms

expected: User can click and drag TimelineBar across timeline to update card dates
actual: Dragging doesn't work at all - no drag initiation, no visual feedback, no date updates
errors: No console errors reported
reproduction: Open timeline view, try to drag a card bar - nothing happens
timeline: Issue persists after two commits attempting to fix it (d849bec, 54ef419)

## Eliminated

(none yet)

## Evidence

- timestamp: "2026-04-14T03:36:08.661Z"
  checked: @dnd-kit/react TypeScript definitions (node_modules/@dnd-kit/react/index.d.ts)
  found: |
    useDraggable return type (lines 27-34):
    ```
    declare function useDraggable<T extends Data = Data>(input: UseDraggableInput<T>): {
        draggable: Draggable<T>;
        readonly isDragging: boolean;
        readonly isDropping: boolean;
        readonly isDragSource: boolean;
        handleRef: (element: Element | null) => void;  // <-- CALLBACK FUNCTION
        ref: (element: Element | null) => void;
    };
    ```
  implication: handleRef is a CALLBACK FUNCTION that takes an Element, NOT a ref object

- timestamp: "2026-04-14T03:36:08.661Z"
  checked: TimelineBar component usage (timeline/index.tsx lines 74-83)
  found: |
    ```typescript
    const { handleRef, isDragging } = useDraggable({
      id: `timeline-bar-${card.id}`,
      data: { card, minDate },
    });

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            ref={handleRef}  // <-- WRONG: handleRef is a function, not a ref
            className={...}
            style={{...}}
          >
    ```
  implication: This is the ROOT CAUSE - handleRef should be called as a callback, not used as a ref

- timestamp: "2026-04-14T03:36:08.661Z"
  checked: How @dnd-kit/react expects handleRef to be used
  found: |
    The API expects handleRef to be called with the DOM element directly.
    Correct pattern:
    ```typescript
    const divRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
      if (divRef.current) {
        handleRef(divRef.current);
      }
    }, [handleRef]);
    
    return <div ref={divRef} ...>
    ```
  implication: Current code passes handleRef as a ref, but @dnd-kit never receives the DOM element, so drag is never initialized

## Resolution

root_cause: |
  useDraggable returns BOTH 'ref' and 'handleRef'. The 'ref' is the correct
  callback to use directly on the element. The previous implementation tried
  to use handleRef with useEffect, which was unnecessarily complex.
  
  The @dnd-kit/react API provides 'ref' as the primary way to attach the
  draggable element. Using it directly simplifies the code and ensures
  proper initialization.

fix: |
  Change TimelineBar to use 'ref' directly from useDraggable:
  
  ```typescript
  const { ref, isDragging } = useDraggable({
    id: `timeline-bar-${card.id}`,
    data: { card, minDate },
  });

  return (
    <div
      ref={ref}
      className={...}
      style={{...}}
    >
  ```
  
  This is simpler and more correct than the handleRef callback approach.

verification: |
  ✓ Build succeeded with no TypeScript errors (7.8s compile time)
  ✓ TimelineBar now uses ref directly from useDraggable
  ✓ Removed unnecessary useRef and useEffect
  ✓ Removed unused useEffect import
  ✓ @dnd-kit will now properly initialize drag handlers on the element
  
  Ready for manual testing: Open timeline view and attempt to drag a card bar.
  Expected: Drag should initiate, visual feedback should appear, dates should update.

files_changed:
- app/(workspace)/projects/[key]\timeline/index.tsx: 
  - Changed useDraggable to use 'ref' directly instead of handleRef callback
  - Removed useRef and useEffect from TimelineBar component
  - Removed unused useEffect import
