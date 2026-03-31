# DataTableWithFilters

A fully-featured data table component with search, filtering, sorting, and pagination built-in.

## Features

- ✅ **Search** - Full-text search across specified columns
- ✅ **Filtering** - Column-specific filters
- ✅ **Sorting** - Click column headers to sort
- ✅ **Pagination** - Automatic pagination with customizable page size
- ✅ **Loading State** - Built-in loading spinner
- ✅ **Empty State** - Customizable empty message
- ✅ **Responsive** - Mobile-friendly design
- ✅ **Row Click** - Optional row click handlers
- ✅ **Custom Rendering** - Render functions for complex cells

## Basic Usage

```tsx
import { DataTableWithFilters } from '@/components/compositions/data-table/DataTableWithFilters';

const posts = [
  { id: '1', title: 'First Post', author: 'John', createdAt: '2024-01-15' },
  { id: '2', title: 'Second Post', author: 'Jane', createdAt: '2024-01-16' },
];

export function PostsTable() {
  return (
    <DataTableWithFilters
      data={posts}
      columns={[
        { key: 'title', header: 'Title', sortable: true },
        { key: 'author', header: 'Author', filterable: true },
        { key: 'createdAt', header: 'Date' }
      ]}
      searchKeys={['title', 'author']}
      searchPlaceholder="Search posts..."
    />
  );
}
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `data` | `T[]` | ✅ | Array of data objects |
| `columns` | `Column<T>[]` | ✅ | Column definitions |
| `searchPlaceholder` | `string` | ❌ | Search input placeholder |
| `searchKeys` | `(keyof T)[]` | ❌ | Keys to search (enables search bar) |
| `itemsPerPage` | `number` | ❌ | Items per page (default: 10) |
| `onRowClick` | `(row: T) => void` | ❌ | Row click handler |
| `loading` | `boolean` | ❌ | Show loading state |
| `emptyMessage` | `string` | ❌ | Empty state message |
| `className` | `string` | ❌ | Additional CSS classes |

## Column Definition

```tsx
interface Column<T> {
  key: keyof T | string;      // Data key
  header: string;             // Column header text
  sortable?: boolean;         // Enable sorting
  filterable?: boolean;       // Enable filtering
  render?: (value, row) => ReactNode;  // Custom cell renderer
  width?: string;             // Column width (CSS)
}
```

## Examples

### With Custom Rendering

```tsx
<DataTableWithFilters
  data={users}
  columns={[
    {
      key: 'avatar',
      header: 'Avatar',
      render: (url) => <img src={url} className="w-8 h-8 rounded-full" />
    },
    { key: 'name', header: 'Name', sortable: true },
    {
      key: 'status',
      header: 'Status',
      render: (status) => (
        <span className={status === 'active' ? 'text-green-600' : 'text-gray-400'}>
          {status}
        </span>
      )
    }
  ]}
/>
```

### With Row Click

```tsx
const router = useRouter();

<DataTableWithFilters
  data={posts}
  columns={columns}
  onRowClick={(post) => router.push(`/posts/${post.id}`)}
/>
```

### With Loading State

```tsx
const { data, loading } = useQuery();

<DataTableWithFilters
  data={data || []}
  columns={columns}
  loading={loading}
/>
```

### With Search and Filters

```tsx
<DataTableWithFilters
  data={posts}
  columns={[
    { key: 'title', header: 'Title', sortable: true },
    { key: 'category', header: 'Category', filterable: true },
    { key: 'author', header: 'Author', filterable: true, sortable: true }
  ]}
  searchKeys={['title', 'content', 'author']}
  searchPlaceholder="Search posts, authors, content..."
/>
```

### With Custom Pagination

```tsx
<DataTableWithFilters
  data={largeDataset}
  columns={columns}
  itemsPerPage={25}
/>
```

## Styling

The component uses Tailwind CSS classes. Customize appearance with:

```tsx
<DataTableWithFilters
  data={data}
  columns={columns}
  className="shadow-lg"  // Additional wrapper classes
/>
```

Override specific elements by wrapping in a container:

```tsx
<div className="my-custom-table">
  <DataTableWithFilters {...props} />
</div>

{/* In your CSS */}
<style>{`
  .my-custom-table th {
    background-color: #your-color;
  }
`}</style>
```

## TypeScript

Fully typed with generics:

```tsx
interface Post {
  id: string;
  title: string;
  author: string;
  published: boolean;
}

<DataTableWithFilters<Post>
  data={posts}
  columns={[
    { key: 'title', header: 'Title' },  // Type-safe!
    { key: 'author', header: 'Author' }
  ]}
/>
```

## Performance

- Memoized data processing with `useMemo`
- Only re-processes on data/search/filter/sort changes
- Efficient pagination (slices data, doesn't re-render all rows)

## Accessibility

- Semantic HTML (`<table>`, `<th>`, `<td>`)
- Keyboard navigation for sortable columns
- ARIA attributes for sort direction
- Focus states on interactive elements

---

**Need more features?** Check the source code for customization options or extend the component for your specific needs.
