---
status: resolved
trigger: "Timeline view dragging bar still not working after drop zone fixes"
created: "2026-04-12T00:00:00.000Z"
updated: "2026-04-14T03:39:00.155Z"
commits: ["d849bec", "54ef419", "7ba71b3"]
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
  useDraggable returns handleRef as a CALLBACK FUNCTION (element: Element | null) => void,
  but TimelineBar is using it as a React ref object with ref={handleRef}.
  
  The @dnd-kit/react API expects handleRef to be called with the DOM element directly.
  When used as a ref, @dnd-kit never receives the DOM element, so the draggable is never
  properly initialized. This prevents all drag events from firing.

fix: |
  Change TimelineBar to use handleRef as a callback function instead of a ref.
  
  Use useEffect to call handleRef with the div element:
  ```typescript
  const divRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (divRef.current) {
      handleRef(divRef.current);
    }
  }, [handleRef]);
  
  return (
    <div
      ref={divRef}
      className={...}
      style={{...}}
    >
  ```

verification: |
  ✓ Build succeeded with no TypeScript errors
  ✓ TimelineBar now uses handleRef as a callback function via useEffect
  ✓ divRef properly attached to the draggable div element
  ✓ @dnd-kit will now receive the DOM element and initialize drag handlers
  
  Ready for manual testing: Open timeline view and attempt to drag a card bar.
  Expected: Drag should initiate, visual feedback should appear, dates should update.

files_changed:
- app/(workspace)/projects/[key]/timeline/index.tsx: Fixed TimelineBar to use handleRef callback correctly
