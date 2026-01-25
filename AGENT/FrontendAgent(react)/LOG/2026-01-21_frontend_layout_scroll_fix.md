# Frontend Refactor Log - Layout Scroll Fix

**Time**: 2026-01-21 09:40  
**Target**: Fix homepage scrolling issue where content ("Document" footer) is hidden behind the fixed search bar.  
**Author**: FrontendAgent(react)

## Changes

### 1. Home Page (`src/app/home/page.tsx`)
- **Padding Update**: Increased bottom padding from `pb-24` to `pb-40` (160px).
- **Reason**: The fixed `BottomInput` (positioned at `bottom-12`) overlaps the bottom of the content stream. Increasing padding ensures that when the user scrolls to the end, the content clears the search bar area with sufficient visual buffer.

### 2. Dashboard Component (`src/components/dashboard/Dashboard.tsx`)
- **Height Optimization**: Reduced `min-h` from `600px` to `500px`.
- **Reason**: To mitigate the "homepage is scrollable" complaint. Reducing the minimum height helps the dashboard fit entirely within the viewport on more screen sizes (e.g., standard laptops), reducing the need to scroll at all.

## Verification
- **Visual Logic**: 
    - `BottomInput` top edge: ~100px from bottom (48px pos + ~50px height).
    - Content bottom edge: 160px from bottom (`pb-40`).
    - Result: Content ends 60px *above* the search bar when scrolled to bottom. No overlap.
- **Responsiveness**: `min-h-[500px]` is sufficient for the 280px tall cards + padding, but saves 100px vertical space compared to before.
