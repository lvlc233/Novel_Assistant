# Frontend Refactor Log - Plugin Card Rotation Fix

**Time**: 2026-01-21 10:05  
**Target**: Remove the "straighten up" (rotate to 0) animation on hover for the Plugin card, ensuring it maintains its 6-degree tilt like the other cards.  
**Author**: FrontendAgent(react)

## Changes

### 1. Dashboard Component (`src/components/dashboard/Dashboard.tsx`)
- **Plugin Card Wrapper**: 
    - Removed `hover:rotate-0` class.
    - **Current State**: `w-[200px] rotate-6 hover:scale-105 hover:-translate-y-2 hover:z-10`.
    - **Effect**: The card now scales up ("bulges") and lifts slightly, but stays tilted at 6 degrees, matching the visual behavior of the "Works Management" and "System Configuration" cards.

## Verification
- **Visual Consistency**: All three cards now maintain their respective rotations (`-6deg`, `0deg`, `6deg`) even when hovered, while sharing the same `scale-105` + `shadow-2xl` + `translate-y-2` pop-out effect.
