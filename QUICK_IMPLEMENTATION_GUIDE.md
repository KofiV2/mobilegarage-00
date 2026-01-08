# Quick Implementation Guide - Get Started in 30 Minutes

**Last Updated:** 2026-01-02

---

## 🚀 30-Minute Setup

### Step 1: Database Setup (5 minutes)

```bash
# Run audit logs migration
psql -U postgres -d carwash_db -f apps/api/migrations/create_audit_logs.sql

# Or with connection string
psql postgresql://localhost:5432/carwash_db -f apps/api/migrations/create_audit_logs.sql
```

---

### Step 2: Update Backend Server (10 minutes)

**File:** `apps/api/src/index.js`

```javascript
const express = require('express');
const http = require('http');
const cors = require('cors');
const { initializeWebSocket } = require('./websocket');
const { auditLog } = require('./middleware/auditLog');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Apply audit logging to admin routes
app.use('/api/admin', auditLog);

// Your existing routes
// ...

// Create HTTP server (for WebSocket)
const server = http.createServer(app);

// Initialize WebSocket
const io = initializeWebSocket(server);

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`✅ WebSocket enabled`);
});
```

**Test Backend:**
```bash
cd apps/api
npm start

# You should see:
# ✅ Server running on port 3000
# ✅ WebSocket enabled
```

---

### Step 3: Update Frontend Main File (10 minutes)

**File:** `apps/web/src/main.jsx`

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './utils/queryClient';
import { NotificationProvider } from './components/NotificationSystem';
import ErrorBoundary from './components/ErrorBoundary';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <NotificationProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </NotificationProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
```

---

### Step 4: Test Features (5 minutes)

**Test Error Boundary:**
```jsx
// Temporarily add to any component
<button onClick={() => { throw new Error('Test error!'); }}>
  Test Error Boundary
</button>
```

**Test Notifications:**
```jsx
import { useNotification } from './components/NotificationSystem';

const { showSuccess, showError } = useNotification();

<button onClick={() => showSuccess('It works!')}>
  Test Notification
</button>
```

**Test Pagination:**
```jsx
import { usePagination } from './hooks/usePagination';
import Pagination from './components/Pagination';

const testData = Array.from({ length: 100 }, (_, i) => ({ id: i, name: `Item ${i}` }));
const { paginatedData, ...props } = usePagination(testData, 10);

return (
  <>
    {paginatedData.map(item => <div key={item.id}>{item.name}</div>)}
    <Pagination {...props} />
  </>
);
```

---

## 🎯 Priority Features to Implement

### Must-Have (This Week)

#### 1. Add Pagination to Users Table (10 min)

**File:** `apps/web/src/pages/admin/UsersManagement.jsx`

```jsx
import { usePagination } from '../../hooks/usePagination';
import Pagination from '../../components/Pagination';

// Inside component:
const {
  paginatedData,
  currentPage,
  pageSize,
  totalPages,
  totalItems,
  handlePageChange,
  handlePageSizeChange
} = usePagination(users, 25);

// In JSX:
<table>
  {paginatedData.map(user => ( /* your existing row */ ))}
</table>

<Pagination
  currentPage={currentPage}
  totalPages={totalPages}
  totalItems={totalItems}
  pageSize={pageSize}
  onPageChange={handlePageChange}
  onPageSizeChange={handlePageSizeChange}
/>
```

#### 2. Add Loading States (5 min each page)

```jsx
import { TableSkeleton } from '../../components/SkeletonLoader';

const [loading, setLoading] = useState(true);

if (loading) {
  return <TableSkeleton rows={10} columns={5} />;
}
```

#### 3. Add Export Button (5 min each page)

```jsx
import { exportToExcel } from '../../utils/exportData';

<button
  onClick={() => exportToExcel(users, 'users-export')}
  className="btn-export"
>
  📥 Export to Excel
</button>
```

#### 4. Add Search (10 min each page)

```jsx
import { useState } from 'react';
import { simpleSearch } from '../../utils/search';

const [searchQuery, setSearchQuery] = useState('');
const filteredUsers = simpleSearch(users, searchQuery, ['name', 'email']);

<input
  type="text"
  placeholder="Search users..."
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
  className="search-input"
/>
```

---

### Should-Have (Next Week)

#### 5. Add Form Validation (15 min per form)

**Example: User Form**

```jsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { userSchema } from '../../schemas/validationSchemas';

const {
  register,
  handleSubmit,
  formState: { errors }
} = useForm({
  resolver: zodResolver(userSchema)
});

const onSubmit = async (data) => {
  // Data is already validated
  await createUser(data);
};

<form onSubmit={handleSubmit(onSubmit)}>
  <div>
    <label>Email</label>
    <input {...register('email')} />
    {errors.email && <span className="error">{errors.email.message}</span>}
  </div>

  <div>
    <label>Name</label>
    <input {...register('name')} />
    {errors.name && <span className="error">{errors.name.message}</span>}
  </div>

  <button type="submit">Create User</button>
</form>
```

#### 6. Add React Query (20 min per page)

**Example: Users Page**

```jsx
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '../../utils/queryClient';

// Fetch users
const { data: users = [], isLoading, error } = useQuery({
  queryKey: ['users'],
  queryFn: async () => {
    const res = await fetch(`${API_URL}/api/admin/users`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.json();
  }
});

// Create user mutation
const createMutation = useMutation({
  mutationFn: async (userData) => {
    const res = await fetch(`${API_URL}/api/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(userData)
    });
    return res.json();
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['users'] });
    showSuccess('User created successfully!');
  }
});

const handleCreate = (data) => {
  createMutation.mutate(data);
};
```

#### 7. Add WebSocket Updates (15 min per page)

```jsx
import { useWebSocket } from '../../hooks/useWebSocket';
import { useEffect } from 'react';

const { subscribe } = useWebSocket();

useEffect(() => {
  const unsubscribe = subscribe('user-created', (user) => {
    queryClient.invalidateQueries({ queryKey: ['users'] });
    showSuccess(`New user: ${user.name}`);
  });

  return unsubscribe;
}, [subscribe]);
```

---

## 📦 Copy-Paste Templates

### Complete Users Management Page Template

```jsx
import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { usePagination } from '../../hooks/usePagination';
import { simpleSearch } from '../../utils/search';
import { exportToExcel } from '../../utils/exportData';
import { useNotification } from '../../components/NotificationSystem';
import { userSchema } from '../../schemas/validationSchemas';
import { TableSkeleton } from '../../components/SkeletonLoader';
import Pagination from '../../components/Pagination';
import { queryClient } from '../../utils/queryClient';
import { useWebSocket } from '../../hooks/useWebSocket';
import './UsersManagement.css';

const UsersManagement = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const { showSuccess, showError } = useNotification();
  const { subscribe } = useWebSocket();

  // Fetch users
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers
  });

  // WebSocket updates
  useEffect(() => {
    const unsubscribe = subscribe('user-created', () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    });
    return unsubscribe;
  }, [subscribe]);

  // Search
  const filteredUsers = simpleSearch(users, searchQuery, ['name', 'email']);

  // Pagination
  const {
    paginatedData,
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    handlePageChange,
    handlePageSizeChange
  } = usePagination(filteredUsers, 25);

  // Form
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm({
    resolver: zodResolver(userSchema)
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      showSuccess('User created successfully!');
      setShowModal(false);
      reset();
    },
    onError: (error) => {
      showError(error.message);
    }
  });

  const onSubmit = (data) => {
    createMutation.mutate(data);
  };

  if (isLoading) return <TableSkeleton rows={10} columns={5} />;

  return (
    <div className="users-management">
      <div className="header">
        <h1>👥 Users Management</h1>
        <div className="header-actions">
          <button onClick={() => exportToExcel(filteredUsers, 'users-export')}>
            📥 Export
          </button>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            ➕ Add User
          </button>
        </div>
      </div>

      <div className="toolbar">
        <input
          type="text"
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
      </div>

      <table className="users-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {paginatedData.map(user => (
            <tr key={user.id}>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>
                <span className={`role-badge ${user.role}`}>
                  {user.role}
                </span>
              </td>
              <td>
                <span className={`status-badge ${user.is_active ? 'active' : 'inactive'}`}>
                  {user.is_active ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td>
                <button className="btn-icon" title="View">👁</button>
                <button className="btn-icon" title="Edit">✏</button>
                <button className="btn-icon" title="Delete">🗑</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Create New User</h2>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="form-group">
                <label>Name</label>
                <input {...register('name')} />
                {errors.name && <span className="error">{errors.name.message}</span>}
              </div>

              <div className="form-group">
                <label>Email</label>
                <input {...register('email')} type="email" />
                {errors.email && <span className="error">{errors.email.message}</span>}
              </div>

              <div className="form-group">
                <label>Phone</label>
                <input {...register('phone')} />
                {errors.phone && <span className="error">{errors.phone.message}</span>}
              </div>

              <div className="form-group">
                <label>Role</label>
                <select {...register('role')}>
                  <option value="customer">Customer</option>
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
                {errors.role && <span className="error">{errors.role.message}</span>}
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// API functions
const fetchUsers = async () => {
  const token = localStorage.getItem('token');
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/users`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch users');
  return res.json();
};

const createUser = async (userData) => {
  const token = localStorage.getItem('token');
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(userData)
  });
  if (!res.ok) throw new Error('Failed to create user');
  return res.json();
};

export default UsersManagement;
```

---

## 🔥 Common Patterns

### Pattern 1: Fetch + Search + Paginate + Export

```jsx
const MyPage = () => {
  const [search, setSearch] = useState('');

  // 1. Fetch with React Query
  const { data = [], isLoading } = useQuery({
    queryKey: ['items'],
    queryFn: fetchItems
  });

  // 2. Search
  const filtered = simpleSearch(data, search, ['name', 'description']);

  // 3. Paginate
  const { paginatedData, ...paginationProps } = usePagination(filtered, 25);

  // 4. Export
  const handleExport = () => exportToExcel(filtered, 'export');

  return (
    <>
      <input value={search} onChange={(e) => setSearch(e.target.value)} />
      <button onClick={handleExport}>Export</button>

      {isLoading ? (
        <TableSkeleton />
      ) : (
        <>
          <Table data={paginatedData} />
          <Pagination {...paginationProps} />
        </>
      )}
    </>
  );
};
```

### Pattern 2: Form with Validation + Mutation

```jsx
const MyForm = ({ onClose }) => {
  const { showSuccess, showError } = useNotification();

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(mySchema)
  });

  const mutation = useMutation({
    mutationFn: saveData,
    onSuccess: () => {
      showSuccess('Saved!');
      queryClient.invalidateQueries({ queryKey: ['items'] });
      onClose();
    },
    onError: (err) => showError(err.message)
  });

  return (
    <form onSubmit={handleSubmit((data) => mutation.mutate(data))}>
      <input {...register('field')} />
      {errors.field && <span>{errors.field.message}</span>}
      <button type="submit">Save</button>
    </form>
  );
};
```

### Pattern 3: Real-time Updates

```jsx
const MyComponent = () => {
  const { subscribe } = useWebSocket();

  useEffect(() => {
    return subscribe('item-created', (item) => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      showSuccess(`New item: ${item.name}`);
    });
  }, [subscribe]);

  // ... rest of component
};
```

---

## ✅ Verification Checklist

After implementation, verify:

- [ ] Error boundary shows when you throw an error
- [ ] Notifications appear in top-right corner
- [ ] Pagination works with page navigation
- [ ] Search filters results instantly
- [ ] Export downloads Excel file
- [ ] Form shows validation errors
- [ ] Loading skeletons appear while fetching
- [ ] WebSocket connects (check browser console)
- [ ] Audit logs appear in database
- [ ] No console errors

---

## 🐛 Common Issues

### Issue 1: "Module not found: @tanstack/react-query"
```bash
cd apps/web
npm install @tanstack/react-query
```

### Issue 2: WebSocket connection failed
- Check backend is running
- Verify FRONTEND_URL in backend .env
- Check JWT_SECRET is set
- Look for CORS errors in console

### Issue 3: Validation not working
- Ensure schema is imported correctly
- Check field names match between form and schema
- Verify resolver is passed to useForm

### Issue 4: Pagination shows wrong data
- Ensure data is an array
- Check currentPage and pageSize values
- Verify usePagination receives valid data

---

## 📞 Need Help?

Check these files for detailed docs:
- `IMPLEMENTATION_COMPLETE.md` - Full feature documentation
- Individual component files have inline comments
- Validation schemas have examples

---

**That's it! You're ready to go. Start with pagination and work your way through the features.** 🚀
