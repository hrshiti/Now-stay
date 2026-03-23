# Search Icon & Placeholder Spacing Fix

## Problem
The search icon and placeholder text were overlapping in the "Search Location" field on Step 2.

## Root Cause
- Icon was positioned at `left-3` (12px from left)
- Input had `pl-10` (40px padding-left)
- This wasn't enough space for the icon + text

## Solution Applied

### Changes Made:
1. **Icon Position**: Changed from `left-3` to `left-4` (16px)
2. **Input Padding**: Changed from `pl-10` to `pl-12` (48px)
3. **Added pointer-events-none**: Prevents icon from interfering with input clicks

### Before:
```jsx
<div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
  <Search size={18} />
</div>
<input className="input pl-10" placeholder="Search for area, street, or landmark..." />
```

### After:
```jsx
<div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
  <Search size={18} />
</div>
<input className="input pl-12" placeholder="Search for area, street, or landmark..." />
```

## Result
✅ Icon and placeholder text no longer overlap
✅ Better visual spacing
✅ More professional appearance
✅ Improved usability

## Spacing Breakdown
- Icon: 16px from left edge
- Icon width: ~18px
- Total space for icon: ~34px
- Input padding-left: 48px
- Result: ~14px buffer between icon and text
