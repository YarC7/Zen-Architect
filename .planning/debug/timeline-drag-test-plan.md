# Timeline Drag Functionality - Test Plan

**Created**: 2026-04-14T03:56:50.088Z  
**Status**: Ready for Manual Testing  
**Related Debug Session**: calendar-spanning-card-drag.md

## Overview

This test plan verifies that the timeline view drag-and-drop functionality works correctly after fixing the `useDraggable` ref usage in the TimelineBar component.

## Test Environment

- **URL**: http://localhost:1707/projects/[key]
- **View**: Timeline tab
- **Browser**: Chrome/Firefox (any modern browser)
- **Prerequisites**: 
  - Dev server running (`pnpm dev`)
  - Project with cards that have start/due dates
  - Timeline view should display cards as horizontal bars

## Test Cases

### TC-1: Drag Initiation
**Objective**: Verify that dragging a card bar initiates the drag operation

**Steps**:
1. Navigate to timeline view
2. Locate a card bar (colored horizontal bar)
3. Click and hold on the card bar
4. Observe for visual feedback

**Expected Results**:
- ✓ Cursor changes to grab/grabbing cursor
- ✓ Card bar opacity reduces to 60% (isDragging state)
- ✓ Card bar z-index increases (appears above other elements)
- ✓ Shadow effect appears on card bar
- ✓ No console errors

**Actual Results**: [To be filled during testing]

---

### TC-2: Drag Movement
**Objective**: Verify that dragging the card bar across the timeline works smoothly

**Steps**:
1. Start from TC-1 (card bar in dragging state)
2. Move mouse horizontally across the timeline
3. Drag the card bar 3-5 days to the right
4. Observe visual feedback during movement

**Expected Results**:
- ✓ Card bar follows mouse movement
- ✓ Card bar stays within timeline bounds
- ✓ Visual feedback remains (opacity 60%, shadow)
- ✓ No lag or stuttering during drag
- ✓ No console errors

**Actual Results**: [To be filled during testing]

---

### TC-3: Drop Zone Highlighting
**Objective**: Verify that drop zones show visual feedback when dragging over them

**Steps**:
1. Start dragging a card bar (from TC-1)
2. Move the card bar over different rows
3. Observe the row background and ring styling

**Expected Results**:
- ✓ Row under cursor shows `bg-primary/10` background
- ✓ Row shows `ring-2 ring-inset ring-primary` styling
- ✓ Visual feedback updates as you move between rows
- ✓ Feedback disappears when moving away from rows

**Actual Results**: [To be filled during testing]

---

### TC-4: Drop and Date Update
**Objective**: Verify that dropping the card bar updates the card dates correctly

**Steps**:
1. Drag a card bar 2 days to the right
2. Release the mouse button (drop)
3. Check the card's start and due dates
4. Verify the dates shifted by 2 days

**Expected Results**:
- ✓ Card bar snaps to new position
- ✓ Card startDate increased by 2 days
- ✓ Card dueDate increased by 2 days
- ✓ Card appears in correct position on timeline
- ✓ No console errors
- ✓ Board state updated with new dates

**Actual Results**: [To be filled during testing]

---

### TC-5: Drag Left (Negative Direction)
**Objective**: Verify that dragging left (earlier dates) works correctly

**Steps**:
1. Drag a card bar 3 days to the left
2. Release the mouse button
3. Verify dates decreased by 3 days

**Expected Results**:
- ✓ Card bar moves to earlier position
- ✓ Card startDate decreased by 3 days
- ✓ Card dueDate decreased by 3 days
- ✓ Card appears in correct position
- ✓ No console errors

**Actual Results**: [To be filled during testing]

---

### TC-6: Multiple Card Drags
**Objective**: Verify that dragging multiple different cards works independently

**Steps**:
1. Drag card A 2 days right, drop
2. Drag card B 1 day left, drop
3. Drag card C 3 days right, drop
4. Verify all three cards have correct new dates

**Expected Results**:
- ✓ Each card updates independently
- ✓ All dates are correct
- ✓ No interference between drag operations
- ✓ No console errors

**Actual Results**: [To be filled during testing]

---

### TC-7: Drag Without Dates
**Objective**: Verify behavior when dragging cards without start/due dates

**Steps**:
1. Create or find a card without dates
2. Attempt to drag it on the timeline
3. Observe behavior

**Expected Results**:
- ✓ Card bar may not appear (no position to calculate)
- ✓ No errors if card is dragged
- ✓ Graceful handling of missing dates

**Actual Results**: [To be filled during testing]

---

### TC-8: Drag with Partial Dates
**Objective**: Verify behavior when dragging cards with only start or only due date

**Steps**:
1. Find a card with only startDate (no dueDate)
2. Drag it 2 days right
3. Verify startDate updated, dueDate remains null
4. Repeat with card that has only dueDate

**Expected Results**:
- ✓ Only the existing date is updated
- ✓ Missing date remains null
- ✓ Card position calculated correctly
- ✓ No errors

**Actual Results**: [To be filled during testing]

---

### TC-9: Keyboard Escape During Drag
**Objective**: Verify that pressing Escape cancels the drag operation

**Steps**:
1. Start dragging a card bar
2. While dragging, press Escape key
3. Observe if drag is cancelled

**Expected Results**:
- ✓ Card bar returns to original position
- ✓ Dates are not updated
- ✓ Visual feedback disappears
- ✓ No console errors

**Actual Results**: [To be filled during testing]

---

### TC-10: Console Errors Check
**Objective**: Verify no errors appear in browser console during all operations

**Steps**:
1. Open browser DevTools (F12)
2. Go to Console tab
3. Perform all drag operations from TC-1 through TC-9
4. Check for any errors, warnings, or exceptions

**Expected Results**:
- ✓ No red error messages
- ✓ No TypeScript errors
- ✓ No @dnd-kit errors
- ✓ No React warnings about missing dependencies

**Actual Results**: [To be filled during testing]

---

## Summary

| Test Case | Status | Notes |
|-----------|--------|-------|
| TC-1: Drag Initiation | [ ] Pass [ ] Fail | |
| TC-2: Drag Movement | [ ] Pass [ ] Fail | |
| TC-3: Drop Zone Highlighting | [ ] Pass [ ] Fail | |
| TC-4: Drop and Date Update | [ ] Pass [ ] Fail | |
| TC-5: Drag Left | [ ] Pass [ ] Fail | |
| TC-6: Multiple Card Drags | [ ] Pass [ ] Fail | |
| TC-7: Drag Without Dates | [ ] Pass [ ] Fail | |
| TC-8: Drag with Partial Dates | [ ] Pass [ ] Fail | |
| TC-9: Keyboard Escape | [ ] Pass [ ] Fail | |
| TC-10: Console Errors | [ ] Pass [ ] Fail | |

**Overall Result**: [ ] All Pass [ ] Some Failures [ ] Critical Issues

## Known Issues / Observations

(To be filled during testing)

---

## Next Steps

1. Run all test cases above
2. Document any failures or unexpected behavior
3. If all tests pass: Mark debug session as VERIFIED
4. If failures found: Create new debug session with specific failure details
5. Update timeline view documentation with test results
