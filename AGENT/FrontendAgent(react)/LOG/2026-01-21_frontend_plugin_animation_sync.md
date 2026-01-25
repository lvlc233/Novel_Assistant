# Frontend Refactor Log - Plugin Card Animation Sync

**Time**: 2026-01-21 10:00  
**Target**: Synchronize the "Plugin" card hover animation with the other cards ("bulge out" + shadow), replacing the previous simple "jump up" effect.  
**Author**: FrontendAgent(react)

## Changes

### 1. Dashboard Component (`src/components/dashboard/Dashboard.tsx`)
- **Outer Wrapper (`div` at ~line 90)**:
    - **Added `group`**: To allow inner elements to react to hover state.
    - **Updated Transition**: Changed duration from `700ms` to `400ms` and easing to `cubic-bezier(0.2, 0.8, 0.2, 1)`. This exactly matches the physics of `FeatureCard.tsx`.
    - **Updated Hover State**: 
        - Added `hover:scale-105`: Gives the "bulge out" 3D effect.
        - Added `hover:rotate-0`: Straightens the card from its 6-degree tilt (matching FeatureCard).
        - Added `hover:z-10`: Ensures the enlarged card sits on top of neighbors.
        - Retained `hover:-translate-y-2`: Keeps the slight lift.
- **Inner Card (`div` at ~line 97)**:
    - **Added Shadow**: Added `group-hover:shadow-2xl` to deepen the shadow on hover, enhancing the "pop out" perception.

## Verification
- **Visual Parity**: 
    - FeatureCard: `scale-105`, `translate-y-2`, `rotate-0`, `shadow-2xl`, `duration-400`.
    - Plugin Card: `scale-105`, `translate-y-2`, `rotate-0`, `shadow-2xl`, `duration-400`.
- **Logic**: The animation properties are now identical class-for-class where it matters for the hover interaction.
