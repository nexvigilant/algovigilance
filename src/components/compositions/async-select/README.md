# AsyncSelect Composition

Searchable select component with async data loading, debouncing, and keyboard navigation.

## Features

- ✅ Async data loading with debouncing
- ✅ Keyboard navigation (Arrow keys, Enter, Escape)
- ✅ Click-outside to close
- ✅ Loading and error states
- ✅ Clearable selection
- ✅ Customizable min search length
- ✅ Max options limit
- ✅ Fully accessible (ARIA)

## Usage

### Basic Example

```tsx
import { AsyncSelect } from '@/components/compositions/async-select/AsyncSelect';

function UserPicker() {
  const [selectedUser, setSelectedUser] = useState(null);

  return (
    <AsyncSelect
      loadOptions={async (query) => {
        const users = await searchUsers(query);
        return users.map(user => ({
          value: user.id,
          label: user.name,
          data: user
        }));
      }}
      onSelect={(option) => setSelectedUser(option.data)}
      placeholder="Search users..."
    />
  );
}
```

### Advanced Example

```tsx
<AsyncSelect
  loadOptions={searchProducts}
  onSelect={handleProductSelect}
  placeholder="Search products..."
  debounceMs={500}
  minSearchLength={3}
  maxOptions={20}
  clearable
  value={selectedProduct}
/>
```

### With Error Handling

```tsx
const [error, setError] = useState('');

<AsyncSelect
  loadOptions={async (query) => {
    try {
      const results = await searchAPI(query);
      setError('');
      return results;
    } catch (err) {
      setError('Failed to load results');
      return [];
    }
  }}
  error={error}
  onSelect={handleSelect}
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `loadOptions` | `(query: string) => Promise<AsyncSelectOption[]>` | Required | Function to load options |
| `onSelect` | `(option: AsyncSelectOption) => void` | Required | Callback when option selected |
| `placeholder` | `string` | `'Search...'` | Input placeholder |
| `debounceMs` | `number` | `300` | Debounce delay in ms |
| `minSearchLength` | `number` | `1` | Min chars before search |
| `loading` | `boolean` | `false` | External loading state |
| `error` | `string` | `undefined` | Error message |
| `clearable` | `boolean` | `true` | Allow clearing selection |
| `className` | `string` | `''` | Custom class name |
| `value` | `AsyncSelectOption \| null` | `undefined` | Controlled value |
| `disabled` | `boolean` | `false` | Disabled state |
| `emptyMessage` | `string` | `'No results found'` | Empty state message |
| `maxOptions` | `number` | `50` | Max options to display |

## AsyncSelectOption Interface

```typescript
interface AsyncSelectOption<T = any> {
  value: string;      // Unique identifier
  label: string;      // Display text
  data?: T;           // Optional associated data
}
```

## Keyboard Navigation

- **Arrow Down**: Move to next option / Open dropdown
- **Arrow Up**: Move to previous option
- **Enter**: Select highlighted option / Open dropdown
- **Escape**: Close dropdown

## Accessibility

- ARIA role `combobox` for input
- ARIA role `listbox` for dropdown
- ARIA `aria-expanded` state
- ARIA `aria-selected` for options
- Proper keyboard navigation
- Screen reader announcements

## Performance

- Debounced search to reduce API calls
- Configurable min search length
- Max options limit to prevent large renders
- Memoized options to prevent re-renders

## Common Patterns

### Remote Data Source

```tsx
<AsyncSelect
  loadOptions={async (query) => {
    const response = await fetch(`/api/search?q=${query}`);
    const data = await response.json();
    return data.map(item => ({
      value: item.id,
      label: item.name,
      data: item
    }));
  }}
  onSelect={(option) => console.log('Selected:', option.data)}
/>
```

### Firestore Query

```tsx
<AsyncSelect
  loadOptions={async (query) => {
    const usersRef = collection(db, 'users');
    const q = query(
      usersRef,
      where('name', '>=', query),
      where('name', '<=', query + '\uf8ff'),
      limit(20)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      value: doc.id,
      label: doc.data().name,
      data: doc.data()
    }));
  }}
  onSelect={handleUserSelect}
  minSearchLength={2}
/>
```

### Controlled Component

```tsx
const [selectedOption, setSelectedOption] = useState(null);

<AsyncSelect
  value={selectedOption}
  onSelect={setSelectedOption}
  loadOptions={loadOptions}
/>
```

## Testing

```tsx
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { AsyncSelect } from './AsyncSelect';

test('loads and displays options', async () => {
  const mockLoadOptions = jest.fn().mockResolvedValue([
    { value: '1', label: 'Option 1' },
    { value: '2', label: 'Option 2' }
  ]);

  render(
    <AsyncSelect
      loadOptions={mockLoadOptions}
      onSelect={() => {}}
      placeholder="Search..."
    />
  );

  const input = screen.getByPlaceholderText('Search...');
  fireEvent.change(input, { target: { value: 'test' } });

  await waitFor(() => {
    expect(screen.getByText('Option 1')).toBeInTheDocument();
  });
});
```
