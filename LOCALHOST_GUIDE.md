# Getting Started - Running Frontend on Localhost

This guide will help you run the Interactive Meeting Platform frontend locally for testing and development.

## Quick Start

### 1. Install Dependencies

```bash
cd c:\Users\alexb\m7011e\project\frontend
npm install
```

This installs all required packages including React, React Router, TypeScript, and other dependencies.

### 2. Start the Development Server

```bash
npm run dev
```

This command:
- Compiles TypeScript files using Vite
- Starts a development server on `http://localhost:3000`
- Opens the application in your default browser automatically
- Watches for file changes and hot-reloads instantly (HMR)

### 3. Access the Application

Open your browser and navigate to:
```
http://localhost:3000
```

You should see the login page.

## Testing the Application

### Demo Login Credentials

The mock API service includes pre-configured users for testing:

**User 1:**
- Email: `user1@example.com`
- Password: `password123`
- Username: `john_doe`

**User 2:**
- Email: `user2@example.com`
- Password: `password123`
- Username: `jane_smith`

**Create New Account:**
- You can also register a new account with any email/password combination

### Demo Meeting Codes

To test joining meetings, use these mock meeting codes:

- `ABC123` - Team Standup (Active)
- `XYZ789` - Project Review (Inactive)

### Testing Flow

1. **Login Test:**
   - Navigate to http://localhost:3000/login
   - Enter credentials (e.g., user1@example.com / password123)
   - Should redirect to dashboard

2. **Register Test:**
   - Click "Register here" link
   - Fill in new user details
   - Should create account and redirect to dashboard

3. **Create Meeting:**
   - From dashboard, click "Create Meeting"
   - Enter title and description
   - Click "Create Meeting"
   - Should redirect to active meeting room
   - Note the meeting code (6-character code)

4. **Join Meeting:**
   - Go to dashboard
   - Click "Join Meeting"
   - Enter a code (ABC123 or XYZ789)
   - Should join the meeting and show meeting room

5. **Meeting Room:**
   - View presentation area (left)
   - View interaction panel with voting and Q&A areas (right)
   - Click "Leave Meeting" to return to dashboard

## Architecture Overview

### Mock API Service

The frontend uses a **Mock API Service** (`MockApiService.ts`) for localhost testing:

```
Frontend (http://localhost:3000)
         ↓
    React App
         ↓
   MockApiService
         ↓
  In-Memory Mock Data
  (No Backend Required)
```

### Key Features of Mock API:

- **Simulates Network Delays:** Realistic 300-800ms delays for testing loading states
- **User Management:** Stores mock users with authentication
- **Meeting Management:** Creates, stores, and retrieves meetings with unique codes
- **State Persistence:** Data persists during the session
- **Error Handling:** Simulates various error scenarios

### Service Endpoints (Mocked)

```typescript
// Authentication
MockApiService.login(email, password)
MockApiService.register(username, email, password)

// Meetings
MockApiService.createMeeting(title, description, hostId)
MockApiService.joinMeeting(meetingCode, participantId)
MockApiService.getMeetingDetails(meetingId)
MockApiService.leaveMeeting(meetingId, participantId)

// Questions (Ready for implementation)
MockApiService.getQuestions(meetingId)
MockApiService.submitQuestion(meetingId, question)
MockApiService.voteOnQuestion(meetingId, questionId)
```

## File Structure for Development

```
frontend/
├── src/
│   ├── services/
│   │   ├── MockApiService.ts      ← Mock API (localhost)
│   │   └── ApiService.ts          ← Real API (production)
│   ├── pages/
│   │   ├── Auth/
│   │   │   ├── Login.tsx
│   │   │   └── Register.tsx
│   │   ├── Dashboard/
│   │   │   └── Dashboard.tsx
│   │   └── Meeting/
│   │       ├── CreateMeeting.tsx
│   │       ├── JoinMeeting.tsx
│   │       └── MeetingRoom.tsx
│   ├── App.tsx
│   └── index.tsx
└── package.json
```

## Development Commands

### Start Development Server
```bash
npm run dev
```
Starts Vite dev server with hot module reloading (HMR) on port 3000

### Build for Production
```bash
npm run build
```
Creates optimized production build in `dist/` directory

### Preview Production Build Locally
```bash
npm run preview
```
Serves the production build locally to verify build output

## Troubleshooting

### Port 3000 Already in Use
Edit `vite.config.ts` and change the port:
```typescript
server: {
  port: 3001,  // Change to your desired port
  open: true,
},
```
Then run `npm run dev` again.

### Dependencies Not Installing
```bash
# Clear npm cache and reinstall
npm cache clean --force
rm -r node_modules
npm install
```

### Changes Not Reflecting
1. Clear browser cache (Ctrl+Shift+Delete)
2. Hard refresh (Ctrl+Shift+R)
3. Restart development server

### Mock API Not Working
- Check browser console for errors (F12)
- Verify MockApiService.ts is imported in components
- Check localStorage for stored token/user data

## Switching from Mock to Real API

When ready to connect to actual backend:

1. **Update API calls in components:**
   ```typescript
   // Change from:
   import MockApiService from '../../services/MockApiService';
   const data = await MockApiService.login(email, password);
   
   // To:
   import ApiService from '../../services/ApiService';
   const data = await ApiService.auth.login(email, password);
   ```

2. **Configure API endpoint:**
   - Create `.env.local` file in project root
   - Set `VITE_API_URL=http://localhost:5000` (or your backend URL)
   - Note: Vite uses `VITE_` prefix for environment variables, not `REACT_APP_`

3. **Access environment variables in code:**
   ```typescript
   const apiUrl = import.meta.env.VITE_API_URL;
   ```

4. **Update environment for different stages:**
   ```
   .env                 → Default environment variables
   .env.local          → Local overrides (not committed)
   .env.production     → Production-specific variables
   .env.development    → Development-specific variables
   ```

## Performance Tips

- **Fast Refresh:** Changes compile immediately
- **DevTools:** F12 to open React Developer Tools
- **Network Tab:** Monitor mock API calls
- **Console:** Check for warnings and errors

## Next Steps

1. ✅ Frontend running locally
2. 📝 Test all user flows
3. 🎨 Customize styling as needed
4. 🔗 When backend ready, replace MockApiService with real API
5. 🚀 Deploy to Kubernetes cluster

## Common Issues and Solutions

| Issue | Solution |
|-------|----------|
| Blank page on startup | Check browser console (F12) for errors |
| Login not working | Verify credentials match mock data |
| Meeting code not found | Use ABC123 or XYZ789 from mock data |
| Styles not loading | Clear browser cache and hard refresh |
| Import errors | Run `npm install` to ensure all deps installed |

## Support

For issues or questions:
1. Check DEVELOPMENT.md for component details
2. Review MockApiService.ts for API structure
3. Check browser console for error messages
4. Verify all files were created correctly

Happy testing! 🚀
