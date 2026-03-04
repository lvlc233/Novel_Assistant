# Plugin Settings Modal Tweak

**Time**: 2026-03-05 04:20
**Goal**: Optimize PluginSettingsModal layout and remove translucency.
**Scope**:
- `src/components/plugins/PluginSettingsModal.tsx`
- `src/components/dashboard/plugin-renderers/ConfigRenderer.tsx`

**Changes**:
1.  **Reduce Modal Size**:
    - `PluginSettingsModal.tsx`: Changed `max-w-6xl` to `max-w-[1000px]`.
    - `PluginSettingsModal.tsx`: Changed `h-[85vh]` to `max-h-[680px] h-full`.
2.  **Remove Residual Translucency**:
    - `PluginSettingsModal.tsx`: Replaced `ring-black/5` with `ring-gray-200`.
    - `ConfigRenderer.tsx`: Replaced `focus:ring-black/5` with `focus:ring-gray-200`.
3.  **Compact Layout**:
    - `PluginSettingsModal.tsx`: Reduced padding from `p-6` to `p-5` and `px-6` to `px-5`.

**Verification**:
- Checked for residual `/5` and `/10` styles.
- Checked for `bg-opacity`.
- Ensured `bg-black/40` remains for backdrop.
