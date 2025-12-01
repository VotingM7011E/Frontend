# Interactive Meeting Frontend

A React-based frontend application for an interactive meeting platform where hosts can present and participants can engage through voting and Q&A.

## Project Overview

This is a full-stack web application frontend built with **React** and **TypeScript**. The application enables:

- **User Authentication**: Login and registration system
- **Meeting Management**: Create and join interactive meetings
- **Participant Engagement**: Vote on questions and submit Q&A
- **Real-time Interaction**: Kahoot-style meeting rooms

## Project Structure

```
frontend/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   └── ProtectedRoute.tsx          # Route protection for authenticated users
│   ├── context/
│   │   └── AuthContext.tsx             # Global authentication context
│   ├── pages/
│   │   ├── Auth/
│   │   │   ├── Login.tsx               # Login page
│   │   │   ├── Register.tsx            # Registration page
│   │   │   └── Auth.css                # Auth styling
│   │   ├── Dashboard/
│   │   │   ├── Dashboard.tsx           # Main dashboard
│   │   │   └── Dashboard.css           # Dashboard styling
│   │   └── Meeting/
│   │       ├── CreateMeeting.tsx       # Create meeting page
│   │       ├── JoinMeeting.tsx         # Join meeting page
│   │       ├── MeetingRoom.tsx         # Active meeting room
│   │       └── Meeting.css             # Meeting styling
│   ├── App.tsx                         # Main application component
│   ├── App.css                         # App styling
│   ├── index.tsx                       # React DOM root
│   └── index.css                       # Global styling
├── package.json                        # Dependencies and scripts
├── tsconfig.json                       # TypeScript configuration
└── .gitignore                          # Git ignore rules
```

## Features Implemented

### 1. Authentication System
- **Login Page** (`/login`): Existing users can log in with email and password
- **Register Page** (`/register`): New users can create an account with username, email, and password
- Password confirmation validation
- Error handling and user feedback
- Token-based authentication with localStorage persistence

### 2. Dashboard
- **Main Dashboard** (`/dashboard`): Hub for all meeting activities
- Quick action cards for creating and joining meetings
- User greeting with logout functionality
- Clean, responsive design with gradient styling
- Future: Display list of user's meetings

### 3. Meeting Management

#### Create Meeting
- Form to create new meetings with title and description
- Auto-generates a unique meeting code for participants
- Redirects to meeting room upon creation
- Form validation and error handling

#### Join Meeting
- Enter meeting code to join existing sessions
- Validates meeting code against backend
- Seamlessly joins participant to active meeting
- Case-insensitive code input

### 4. Meeting Room
- **Presentation Area**: Space for host's presentation content
- **Interaction Panel**: 
  - Voting section for participants to vote on questions
  - Q&A section for submitting new questions
- Meeting code display
- Leave meeting functionality
- Responsive layout that adapts to different screen sizes

## Technologies Used

- **React 18**: UI library
- **TypeScript**: Type-safe JavaScript
- **React Router v6**: Client-side routing
- **Context API**: Global state management
- **CSS3**: Styling with flexbox and grid
- **Axios**: HTTP client for API calls (installed, can be used)

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

```bash
# Navigate to the project directory
cd frontend

# Install dependencies
npm install

# Start the development server
npm start
```

The application will open at `http://localhost:3000`

### Build for Production

```bash
npm run build
```

This creates a production-ready build in the `build/` directory.

## Running Tests

```bash
npm test
```

## API Endpoints

The frontend connects to the following backend endpoints (TODO - Replace with actual backend):

### Authentication
- `POST /api/auth/login` - Login user
- `POST /api/auth/register` - Register new user

### Meetings
- `POST /api/meetings/create` - Create new meeting
- `POST /api/meetings/join` - Join existing meeting
- `GET /api/meetings/:meetingId` - Get meeting details

## Routing

| Route | Component | Protected | Description |
|-------|-----------|-----------|-------------|
| `/` | Dashboard | Yes | Redirects to /dashboard if authenticated |
| `/login` | Login | No | User login page |
| `/register` | Register | No | User registration page |
| `/dashboard` | Dashboard | Yes | Main dashboard hub |
| `/create-meeting` | CreateMeeting | Yes | Create new meeting |
| `/join-meeting` | JoinMeeting | Yes | Join existing meeting |
| `/meeting/:meetingId` | MeetingRoom | Yes | Active meeting room |

## Authentication Flow

1. **New User**: Register → Receive token → Stored in localStorage → Redirected to dashboard
2. **Existing User**: Login → Receive token → Stored in localStorage → Redirected to dashboard
3. **Protected Routes**: Check token validity → Allow/Redirect to login
4. **Logout**: Clear token and user data → Redirect to login

## State Management

The app uses React Context API for global authentication state:

```typescript
AuthContext = {
  user: User | null,
  isAuthenticated: boolean,
  handleLogin: (userData, token) => void,
  handleLogout: () => void
}
```

## Styling

- **Color Scheme**: Purple gradient (#667eea to #764ba2)
- **Layout**: Flexbox and CSS Grid
- **Responsive Design**: Mobile-first approach with breakpoints at 768px and 1024px
- **Typography**: System fonts for better performance

## Future Enhancements

- [ ] Real-time WebSocket connection for live updates
- [ ] Voting system UI implementation
- [ ] Q&A submission form
- [ ] Meeting history and analytics
- [ ] User profile management
- [ ] Meeting participants list
- [ ] Presentation upload functionality
- [ ] Chat/messaging feature
- [ ] Mobile app version

## Environment Variables

Create a `.env` file in the root directory:

```
REACT_APP_API_URL=http://localhost:5000
REACT_APP_ENV=development
```

## Troubleshooting

### Module not found errors
```bash
npm install
```

### Port already in use
```bash
# Use a different port
PORT=3001 npm start
```

### Clear cache and reinstall
```bash
rm -rf node_modules package-lock.json
npm install
```

## Git Workflow

The project is on the `mainPage` branch. When making changes:

```bash
# Pull latest changes
git pull origin mainPage

# Create a new feature branch
git checkout -b feature/feature-name

# Make your changes and commit
git add .
git commit -m "feat: description of changes"

# Push to remote
git push origin feature/feature-name

# Create Pull Request
```

## License

This project is part of VotingM7011E organization.

## Contact

For questions or issues, please reach out to the development team.