# Frontend Application Flow & Navigation Map

## User Journey Map

```
┌─────────────────┐
│  User Visits    │
│  Localhost:3000 │
└────────┬────────┘
         │
         ▼
    ┌────────────┐
    │  /login    │◄──┐
    │   Page     │   │
    └────┬───────┘   │
         │           │
    ┌────┴────────┐  │
    │             │  │
    ▼             ▼  │
 [Login]    [Register]
    │             │   │
    │      ┌──────┘   │
    │      ▼          │
    │  Create Account │
    │      │          │
    │      │◄─────────┘
    │      ▼
    └─► Dashboard
         │
         ├─────────────────┬──────────────────┐
         │                 │                  │
         ▼                 ▼                  ▼
   Create Meeting    Join Meeting        Logout
         │                 │                  │
         ▼                 ▼                  │
    (Form Page)      (Code Input)           │
         │                 │                  │
         │                 │                  │
         └────┬────────────┘                  │
              │                               │
              ▼                               │
         Meeting Room                         │
         (Interactive)                        │
              │                               │
              │◄───────────────────────────────┘
              │
              ▼
           Leave
```

## Routes & Navigation

```
Login Routes (Public)
├── GET  /login           → Login page
└── GET  /register        → Register page

Protected Routes (Authenticated Required)
├── GET  /                → Dashboard (main hub)
├── GET  /dashboard       → Dashboard
├── GET  /create-meeting  → Create meeting form
├── GET  /join-meeting    → Join meeting form
└── GET  /meeting/:id     → Active meeting room

Default Redirect
└── /                → /dashboard (if logged in) or /login (if not)
```

## Component Hierarchy

```
App.tsx
├── AuthContext.Provider
├── Router
│   ├── Public Routes
│   │   ├── /login
│   │   │   └── Login.tsx
│   │   └── /register
│   │       └── Register.tsx
│   │
│   ├── Protected Routes (via ProtectedRoute)
│   │   ├── /dashboard
│   │   │   └── Dashboard.tsx
│   │   │       ├── Header (with logout)
│   │   │       ├── ActionCards
│   │   │       └── Upcoming Meetings
│   │   │
│   │   ├── /create-meeting
│   │   │   └── CreateMeeting.tsx
│   │   │       ├── Title Input
│   │   │       ├── Description Input
│   │   │       └── Create Button
│   │   │
│   │   ├── /join-meeting
│   │   │   └── JoinMeeting.tsx
│   │   │       ├── Meeting Code Input
│   │   │       └── Join Button
│   │   │
│   │   └── /meeting/:id
│   │       └── MeetingRoom.tsx
│   │           ├── Header (Meeting Info)
│   │           ├── PresentationArea
│   │           └── InteractionPanel
│   │               ├── VotingArea
│   │               └── Q&AArea
│   │
│   └── Catch-All Route
│       └── Redirect to /
```

## Data Flow Architecture

```
User Input
    │
    ▼
Component State (useState)
    │
    ▼
Form Validation
    │
    ▼
API Call (MockApiService)
    │
    ├─────────────────────────────────────┐
    │                                     │
    ▼                                     ▼
Success Response                    Error Response
    │                                     │
    ▼                                     ▼
Update AuthContext              Show Error Message
(handleLogin/handleLogout)              │
    │                                     ▼
    ▼                            User can retry
Navigate to Next Page
    │
    ▼
Render New Component
    │
    ▼
Display to User
```

## API Call Flow

```
Component
    │
    ▼
MockApiService
    │
    ├── Validate Input
    │
    ├── Simulate Network Delay (300-800ms)
    │
    ├── Process Request
    │   ├── Authenticate User
    │   ├── Create/Join Meeting
    │   ├── Store in Memory
    │   └── Generate Response
    │
    ├── Throw Error or
    ├── Return Data
    │
    ▼
Component Receives Response
    │
    ├─ Success: Update UI + Navigate
    └─ Error: Show Error Message
```

## Authentication Flow

```
┌─────────────────────────────────────────┐
│         Initial App Load                │
└──────────────────┬──────────────────────┘
                   │
                   ▼
        Check localStorage for token
                   │
        ┌──────────┴──────────┐
        │                     │
    Token Found          No Token
        │                     │
        ▼                     ▼
   Set User         Show Login Page
   isAuthenticated
   = true              User enters
        │              credentials
        ▼                  │
   Navigate to         Validate
   Dashboard               │
        │                  ▼
        │            Call login()
        │                  │
        │            ┌─────┴─────┐
        │            │           │
        │        Success       Error
        │            │           │
        │            ▼           ▼
        │         Store      Show Error
        │         Token      Message
        │         & User        │
        │            │          ▼
        │            ▼      Retry
        │         Update
        │         Context
        │            │
        │            ▼
        ├─────► Dashboard
        │
    Logout
        │
        ▼
   Clear Token
   Clear User
        │
        ▼
   isAuthenticated
   = false
        │
        ▼
   Navigate to Login
```

## Meeting Creation Flow

```
User on Dashboard
    │
    ▼
Click "Create Meeting"
    │
    ▼
Route to /create-meeting
    │
    ▼
Render CreateMeeting Form
    │
    ├── Input: Title
    ├── Input: Description
    └── Button: Create
    │
    ▼
User fills form
    │
    ▼
Submit Form
    │
    ▼
Validate Inputs
    │
    ├─ Invalid ──▶ Show Error
    │
    ▼
Valid
    │
    ▼
Call MockApiService.createMeeting()
    │
    ├─ Wait 600ms (simulated)
    │
    ▼
MockAPI:
├── Generate meetingId
├── Generate meetingCode (6 chars)
├── Store meeting data
└── Return response
    │
    ▼
Component Receives:
├── meetingId
├── meetingCode
├── title
└── description
    │
    ▼
Navigate to /meeting/:id
    │
    ▼
Render Meeting Room
    │
    ▼
Display to User
```

## Meeting Join Flow

```
User on Dashboard
    │
    ▼
Click "Join Meeting"
    │
    ▼
Route to /join-meeting
    │
    ▼
Render Join Form
    │
    Input: Meeting Code (ABC123)
    │
    ▼
Submit Code
    │
    ▼
Call MockApiService.joinMeeting()
    │
    ├─ Wait 600ms
    │
    ▼
MockAPI Checks:
├── Find meeting by code
├── Validate meeting exists
├── Add user to participants
└── Return meeting details
    │
    ├─ Meeting found
    │   │
    │   ▼
    │ Return meetingId & details
    │   │
    │   ▼
    │ Navigate to /meeting/:id
    │
    └─ Meeting not found
        │
        ▼
    Throw Error
        │
        ▼
    Show "Invalid code"
    message
        │
        ▼
    User can retry
```

## State Management

```
AuthContext (Global)
├── user: User | null
│   ├── id: string
│   ├── username: string
│   └── email: string
│
├── isAuthenticated: boolean
│
├── handleLogin(userData, token)
│   ├── setUser(userData)
│   ├── setIsAuthenticated(true)
│   ├── localStorage.setItem('token', token)
│   └── localStorage.setItem('user', JSON.stringify(userData))
│
└── handleLogout()
    ├── setUser(null)
    ├── setIsAuthenticated(false)
    ├── localStorage.removeItem('token')
    └── localStorage.removeItem('user')
```

## Component State Examples

```
Login.tsx
├── email: string
├── password: string
├── error: string
└── loading: boolean

Register.tsx
├── username: string
├── email: string
├── password: string
├── confirmPassword: string
├── error: string
└── loading: boolean

CreateMeeting.tsx
├── title: string
├── description: string
├── error: string
└── loading: boolean

JoinMeeting.tsx
├── meetingCode: string
├── error: string
└── loading: boolean

MeetingRoom.tsx
├── meeting: Meeting | null
├── error: string
└── loading: boolean
```

## Storage Structure

```
localStorage
├── token: "mock_token_1234567890_abc123"
└── user: {
    "id": "1",
    "username": "john_doe",
    "email": "user1@example.com"
  }

MockAPI Memory
└── Database
    ├── Users: {
    │   "user1@example.com": {...}
    │   "user2@example.com": {...}
    │ }
    ├── Meetings: {
    │   "meeting-1": {
    │     "id": "meeting-1",
    │     "code": "ABC123",
    │     "title": "Team Meeting",
    │     ...
    │   }
    │ }
    └── Questions: {
        "question-1": {...}
      }
```

## Environment Configuration

```
Development (localhost)
├── API_URL: http://localhost:3000
├── Environment: development
└── Features: All enabled

Staging
├── API_URL: https://staging-api.example.com
├── Environment: staging
└── Features: All enabled

Production
├── API_URL: https://api.example.com
├── Environment: production
└── Features: All enabled
```

## Error Handling Flow

```
User Action
    │
    ▼
Try Block
    │
    ├─ Success
    │   │
    │   ▼
    │ Update UI
    │
    └─ Error
        │
        ▼
    Catch Error
        │
        ▼
    setError(error.message)
        │
        ▼
    Display Error Message
        │
        ├─ Show to User
        │
        ├─ Log to Console
        │
        └─ Suggest Action
```

## Key Integration Points

```
┌───────────────────────────────────────┐
│        React Components               │
└─────────────────┬─────────────────────┘
                  │
        ┌─────────┴──────────┐
        │                    │
        ▼                    ▼
   Context API          useNavigate
   (Auth State)         (Routing)
        │                    │
        └─────────────┬──────┘
                      │
                      ▼
            React Router v6
            ├── <BrowserRouter>
            ├── <Routes>
            └── <Route>
                  │
        ┌─────────┴──────────┐
        │                    │
        ▼                    ▼
   Public Routes      Protected Routes
   ├── /login         ├── /dashboard
   └── /register      ├── /create-meeting
                      ├── /join-meeting
                      └── /meeting/:id
                          │
        ┌─────────────────┘
        │
        ▼
   MockApiService
   ├── login()
   ├── register()
   ├── createMeeting()
   ├── joinMeeting()
   └── getMeetingDetails()
        │
        ▼
   localStorage
   ├── token
   └── user
```

## Page Transitions

```
Login Page
    ↓ (Login Success)
    → Dashboard
    ↓ (Create)      ↓ (Join)      ↓ (Logout)
    → Create Form   → Join Form   → Login Page
    ↓ (Submit)      ↓ (Submit)
    → Meeting Room  → Meeting Room
    ↓ (Leave)
    → Dashboard
```

---

**Navigation is fully functional with proper routing, state management, and error handling!**
