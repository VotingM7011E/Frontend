# Frontend Development Guide

## Overview

This document provides detailed information about the Interactive Meeting Platform frontend structure and development workflow.

## Directory Structure Explained

### `/public`
- `index.html` - Entry point for the React application
- Static assets that don't need processing

### `/src/components`
- **ProtectedRoute.tsx** - Higher-order component that wraps routes requiring authentication
  - Checks `isAuthenticated` context
  - Redirects to `/login` if not authenticated
  - Otherwise renders the requested component using `<Outlet />`

### `/src/context`
- **AuthContext.tsx** - React Context for global authentication state
  - Provides: `user`, `isAuthenticated`, `handleLogin()`, `handleLogout()`
  - Used throughout the app to access authentication state

### `/src/pages/Auth`
- **Login.tsx** - User login form
  - Email and password inputs
  - Form validation
  - API integration with error handling
  - Link to registration page

- **Register.tsx** - User registration form
  - Username, email, password inputs
  - Password confirmation validation
  - API integration
  - Link to login page

- **Auth.css** - Shared styling for authentication pages
  - Purple gradient background
  - Centered card layout
  - Form styling

### `/src/pages/Dashboard`
- **Dashboard.tsx** - Main hub after login
  - Welcome message with username
  - Two quick-action cards (Create/Join Meeting)
  - Section for upcoming meetings
  - Logout button

- **Dashboard.css** - Dashboard-specific styling
  - Header with gradient
  - Card layout for actions
  - Responsive grid layout

### `/src/pages/Meeting`
- **CreateMeeting.tsx** - Form to create new meetings
  - Title and description inputs
  - Calls API to create meeting
  - Redirects to meeting room on success

- **JoinMeeting.tsx** - Form to join existing meetings
  - Meeting code input (6 characters max)
  - Auto-uppercase conversion
  - Validates meeting exists
  - Joins participant to meeting

- **MeetingRoom.tsx** - Active meeting room interface
  - Displays meeting title and code
  - Two-column layout (Presentation + Interaction)
  - Placeholder for voting and Q&A features
  - Leave meeting button

- **Meeting.css** - All meeting-related styling
  - Meeting form styles
  - Meeting room layout
  - Responsive design for different screen sizes

### Root Components
- **App.tsx** - Main application component
  - Sets up routing with React Router
  - Manages authentication state
  - Implements protected routes
  - Handles login/logout

- **index.tsx** - React DOM entry point
  - Renders App component to `#root` element

## Component Data Flow

```
App.tsx (Auth Context Provider)
  ├── Routes
  │   ├── /login → Login.tsx
  │   │   └── calls handleLogin() → updates AuthContext
  │   ├── /register → Register.tsx
  │   │   └── calls handleLogin() → updates AuthContext
  │   └── ProtectedRoute (checks isAuthenticated)
  │       ├── /dashboard → Dashboard.tsx
  │       ├── /create-meeting → CreateMeeting.tsx
  │       ├── /join-meeting → JoinMeeting.tsx
  │       └── /meeting/:meetingId → MeetingRoom.tsx
```

## Key Features Breakdown

### 1. Authentication Flow

**Login Process:**
```
User Input → Validation → API Call → Success Response
→ handleLogin() → Store Token & User Data → Redirect to Dashboard
```

**Register Process:**
```
User Input → Validation → API Call → Success Response
→ handleLogin() → Store Token & User Data → Redirect to Dashboard
```

**Logout Process:**
```
Click Logout → handleLogout() → Clear Token & User Data
→ Redirect to Login Page
```

### 2. Protected Routes

Uses React Router's `Outlet` pattern:
- ProtectedRoute checks `isAuthenticated` prop
- If authenticated: renders requested component
- If not: redirects to `/login`

### 3. Meeting Management

**Creating a Meeting:**
1. User navigates to `/create-meeting`
2. Fills in title and description
3. Submits form → calls `/api/meetings/create`
4. Backend generates unique meeting code
5. Redirects to `/meeting/:meetingId`

**Joining a Meeting:**
1. User navigates to `/join-meeting`
2. Enters meeting code (e.g., "ABC123")
3. Submits → calls `/api/meetings/join`
4. Backend validates code and adds participant
5. Redirects to `/meeting/:meetingId`

**In Meeting Room:**
1. Displays presentation area (left)
2. Shows interaction panel (right)
3. Participants can vote on questions
4. Participants can submit new questions

## Styling Strategy

### Color Palette
- **Primary**: #667eea (Purple)
- **Secondary**: #764ba2 (Deep Purple)
- **Background**: #f5f5f5 (Light Gray)
- **Text**: #333 (Dark Gray)
- **Error**: #c33 (Red)

### Layout Approach
- **Flexbox**: Primary layout method for components
- **CSS Grid**: Used for multi-column layouts (Dashboard, Meeting Room)
- **Mobile First**: Breakpoints at 768px and 1024px

### Responsive Design
- Desktop (>1024px): Full layout with all features
- Tablet (768px-1024px): Adjusted spacing and layout
- Mobile (<768px): Single column, optimized for touch

## State Management

### Global State (AuthContext)
```typescript
{
  user: { id, username, email },
  isAuthenticated: boolean,
  handleLogin: (userData, token) => void,
  handleLogout: () => void
}
```

### Local Component State
- Form inputs: `useState` for controlled components
- Loading states: `useState` for async operations
- Error messages: `useState` for user feedback

## API Integration Points

### Authentication
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/register` - Register new user

### Meetings
- `POST /api/meetings/create` - Create new meeting
- `POST /api/meetings/join` - Join existing meeting
- `GET /api/meetings/:meetingId` - Fetch meeting details

### Questions (Future)
- `GET /api/meetings/:meetingId/questions` - Get all questions
- `POST /api/meetings/:meetingId/questions` - Submit new question
- `POST /api/meetings/:meetingId/questions/:questionId/vote` - Vote on question

## Development Workflow

### Adding a New Page

1. Create folder: `src/pages/NewFeature/`
2. Create component: `NewFeature.tsx`
3. Create styles: `NewFeature.css`
4. Add route to `App.tsx`
5. If protected: wrap with ProtectedRoute

### Adding a New Route

In `App.tsx`:
```typescript
// Protected route
<Route element={<ProtectedRoute isAuthenticated={isAuthenticated} />}>
  <Route path="/new-feature" element={<NewFeature />} />
</Route>

// Public route
<Route path="/new-feature" element={<NewFeature />} />
```

### Form Best Practices

1. Use `useState` for each input
2. Create `handleSubmit` function
3. Validate before API call
4. Show loading state during request
5. Display errors to user
6. Reset form on success

Example:
```typescript
const [input, setInput] = useState('');
const [error, setError] = useState('');
const [loading, setLoading] = useState(false);

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');
  setLoading(true);
  
  try {
    // API call
    // Handle success
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};
```

## Debugging Tips

### Check Auth State
```typescript
// In any component
const { user, isAuthenticated } = useContext(AuthContext);
console.log(user, isAuthenticated);
```

### Check API Calls
1. Open browser DevTools → Network tab
2. Look for API requests
3. Check response status and body
4. Verify headers (including Authorization)

### Local Storage
```javascript
// Check stored data
localStorage.getItem('token')
localStorage.getItem('user')

// Clear storage (for testing)
localStorage.clear()
```

## Performance Considerations

1. **Code Splitting**: Routes are automatically code-split by React
2. **Memoization**: Use `React.memo` for expensive components
3. **Lazy Loading**: Consider lazy loading heavy features
4. **Image Optimization**: Optimize images in public folder

## Security Best Practices

1. **Token Storage**: Currently in localStorage (consider sessionStorage)
2. **HTTPS**: Always use HTTPS in production
3. **CORS**: Configure backend CORS properly
4. **Input Validation**: Validate on frontend + backend
5. **XSS Prevention**: React sanitizes content by default

## Common Issues and Solutions

### Module Not Found
```bash
npm install
```

### Styles Not Loading
- Check CSS import path
- Clear browser cache (Ctrl+Shift+Delete)
- Check CSS module syntax

### API Calls Failing
- Verify backend is running
- Check API URL in environment variables
- Verify CORS configuration on backend

### Authentication Issues
- Check token in localStorage
- Verify token not expired
- Check Authorization header format

## Next Steps

1. Install dependencies: `npm install`
2. Create `.env.local` from `.env.example`
3. Start dev server: `npm start`
4. Navigate to `http://localhost:3000`
5. Test authentication flow
6. Connect to backend API
