# UI Compositions Module

> **Path:** `src/components/compositions`  
> **Parent:** [`../README.md`](../README.md)  
> **Last Verified:** 2024-12-28  
> **Maintainer:** Design System & Functional UX Lead

---

## Purpose

The UI Compositions module contains pre-built, production-ready components that combine multiple atomic primitives (from `components/ui`) into complex functional units. These components handle high-level UI patterns like data table orchestration, integrated modal forms, and rich-text editing, ensuring that complex UX patterns are consistent and bug-free across the entire platform.

---

## Quick Reference

| Aspect | Details |
|--------|---------|
| **Domain** | Functional UX / Composite Patterns |
| **Status** | Stable / Active |
| **Dependencies** | `react-hook-form`, `zod`, `lucide-react`, `radix-ui` |
| **Outputs** | Feature-Rich UI Units (Tables, Forms, Pickers) |

---

## File Manifest

| File | Type | Purpose | Status |
|------|------|---------|--------|
| `data-table/` | Unit | Advanced table with integrated search, filter, and pagination | Active |
| `modal-form/` | Unit | accessible modal dialog with built-in server action handling | Active |
| `file-upload/` | Unit | Drag-and-drop file interface with status and validation | Active |
| `rich-text-editor/` | Unit | Secure WYSIWYG editor producing sanitized HTML | Active |
| `async-select/` | Unit | Searchable dropdown that fetches options from an API | Active |
| `date-range-picker/`| Unit | Standardized calendar for selecting temporal windows | Active |
| `image-cropper/` | Unit | Client-side visual cropping for avatars and thumbnails | Active |
| `index.ts` | Barrel | Central entry point for all UI compositions | Active |

---

## Relationships & Data Flow

```
[lib/schemas] → [ModalForm] → [useServerActionForm] → [lib/actions]
                      ↑
               [components/ui] → [Compositions]
```

**Internal Dependencies:**
- Compositions import nearly all their atomic parts from `components/ui`.
- Many compositions utilize **hooks** (e.g., `useServerActionForm`) to manage state.

**External Dependencies:**
- Aligned with **Zod** for schema-based prop validation.
- `rich-text-editor` uses specialized libraries (e.g., Tiptap/Quill) but outputs `SafeHtml`.

---

## Usage Patterns

### Common Workflows

1. **Implement a Searchable List**
   - Use `<DataTableWithFilters>` and provide a `searchKeys` array.
   - Result: Instant client-side filtering and sorted display.

2. **Create a Side-Effect Form**
   - Use `<ModalForm>` with a `schema` and `action`.
   - Result: Automatic validation, loading states, and success callbacks without manual `useState` management.

### Entry Points

- **Primary:** `src/components/compositions/index.ts` — Import complex units directly.
- **Form UI:** `ModalForm` — The standard way to implement creation/editing dialogs.

---

## Conventions & Standards

- **Encapsulation:** Compositions should handle their own internal loading and error states while allowing customization via props.
- **Type Safety:** All data-heavy components (DataTable, Select) must use Generics `<T>` to ensure type consistency from data to render props.
- **Consistency:** Use the standard `size` scale (sm, md, lg, xl) consistent with atomic primitives.

---

## Known Limitations

- [ ] `DataTableWithFilters` currently only supports client-side processing; server-side pagination for collections >1,000 items is planned.
- [ ] `RichTextEditor` adds significant bundle size and should be lazy-loaded in non-critical paths.

---

## Navigation

| Direction | Link |
|-----------|------|
| ⬆️ Parent | [`../README.md`](../README.md) |
| ⬅️ UI | [`../ui/README.md`](../ui/README.md) |
| ➡️ Visuals | [`../visualizations/README.md`](../visualizations/README.md) |

---

*Functional Composite UI. Verified by UX Lead on 2024-12-28.*
