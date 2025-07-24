# Style Scanner Changelog

## [Unreleased] - 2025-07-24

### ✨ Enhanced

- **Unified page structuring**: Now handles both pages with imported sections AND pages without sections
- **Top-level component breakdown**: Pages without imported sections now get structured breakdown by top-level components instead of dumping everything to overview.md
- **Improved component analysis**: `getStructuringComponents()` replaces `getSectionComponentsFromImports()` with fallback logic

### 🔧 Changed

- `getSectionComponentsFromImports()` → `getStructuringComponents()` with extended logic
- `createSectionMarkdown()` → `createComponentMarkdown()` for universal usage
- `generateSectionFiles()` now creates files for both sections and top-level components

### 🗑️ Removed

- Duplicate `getSectionComponentsFromImports()` function from `markdown-utils.ts`

### 🎯 Technical Details

**New Logic Flow:**

1. First try to find imported components (sections)
2. If no imported components found, fallback to top-level components (direct children of page)
3. Generate individual markdown files for each structuring component

**Backward Compatibility:** ✅ Fully maintained

- Pages with sections work exactly as before
- Pages without sections now get proper structure instead of overview dump

**Files Modified:**

- `packages/style-scanner/src/utils/markdown-generator.ts` - Main logic adaptation
- `packages/style-scanner/src/utils/markdown-utils.ts` - Duplicate removal
