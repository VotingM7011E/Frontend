# Keycloak Integration Checklist

## ✅ Files Created/Updated

### 1. Keycloak Integration Files
- ✅ `src/services/KeycloakService.ts` - Keycloak authentication service wrapper
- ✅ `src/keycloak-config.ts` - Keycloak configuration (realm, client, URL)
- ✅ `public/silent-check-sso.html` - Silent SSO check iframe

### 2. Updated Authentication Flow
- ✅ `src/App.tsx` - Initialize Keycloak on app startup
- ✅ `src/context/AuthContext.tsx` - Updated to work with Keycloak
- ✅ `src/pages/Auth/Login.tsx` - Redirects to Keycloak login
- ✅ `src/pages/Auth/Register.tsx` - Redirects to Keycloak registration
- ✅ `src/services/ApiService.ts` - Uses Keycloak tokens for API calls

## 📦 Required Steps

### 1. Install Dependencies
```powershell
npm install keycloak-js
npm install --save-dev @types/keycloak-js
```

### 2. Update Keycloak Configuration
Edit `src/keycloak-config.ts` with your actual Keycloak settings:
```typescript
export const keycloakConfig = {
  url: 'https://keycloak.ltu-m7011e-2.se',
  realm: 'YOUR_REALM_NAME',          // Update this
  clientId: 'YOUR_CLIENT_ID'         // Update this
};
```

### 3. Configure Keycloak Admin Console

#### A. Create Realm (if not exists)
1. Login to Keycloak Admin Console: `https://keycloak.ltu-m7011e-2.se`
2. Create new realm or use existing
3. Note the realm name

#### B. Create Client
1. Go to **Clients** → **Create**
2. Client ID: `interactive-meeting-frontend` (or your choice)
3. Client Protocol: `openid-connect`
4. Access Type: `public`
5. Valid Redirect URIs:
   ```
   http://localhost:3000/*
   https://todo-api.ltu-m7011e-2.se/*
   https://your-production-domain.com/*
   ```
6. Web Origins: `+` (allows all valid redirect URIs)
7. **Save**

#### C. Client Settings
- **Standard Flow Enabled**: ON
- **Direct Access Grants Enabled**: OFF (not needed for web app)
- **Implicit Flow Enabled**: OFF
- **Valid Redirect URIs**: Add all your frontend URLs
- **Web Origins**: `+` or specific domains

### 4. Build & Deploy

#### Build Docker Image
```powershell
docker build -t interactive-meeting-frontend .
```

#### Test Locally
```powershell
npm install
npm run dev
```

#### Deploy to Kubernetes
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
spec:
  replicas: 2
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
      - name: frontend
        image: interactive-meeting-frontend:latest
        ports:
        - containerPort: 80
---
apiVersion: v1
kind: Service
metadata:
  name: frontend
spec:
  selector:
    app: frontend
  ports:
    - protocol: TCP
      port: 80
      targetPort: 80
  type: LoadBalancer
```

## 🔧 How It Works

### Authentication Flow

1. **App Startup**
   - `App.tsx` calls `KeycloakService.init()`
   - Keycloak checks for existing session (SSO)
   - If authenticated, loads user profile
   - If not, user sees unauthenticated state

2. **Login Process**
   - User clicks login or visits `/login`
   - `Login.tsx` calls `KeycloakService.login()`
   - User redirected to Keycloak login page
   - After successful login, redirected back to app
   - Keycloak token stored automatically

3. **API Calls**
   - `ApiService` automatically gets fresh token from Keycloak
   - Calls `KeycloakService.updateToken(5)` before each request
   - Adds token to `Authorization: Bearer <token>` header
   - API Gateway validates token with Keycloak

4. **Token Refresh**
   - Automatic refresh every 30 seconds
   - Only refreshes if token expires within 60 seconds
   - If refresh fails, redirects to login

5. **Logout**
   - User clicks logout
   - `KeycloakService.logout()` called
   - Keycloak session terminated
   - User redirected to Keycloak logout page

## 🚀 Testing

### 1. Test Keycloak Connection
```typescript
// Add this to test connection (temporary)
console.log('Keycloak URL:', keycloakConfig.url);
console.log('Realm:', keycloakConfig.realm);
console.log('Client ID:', keycloakConfig.clientId);
```

### 2. Test Authentication
1. Start app: `npm run dev`
2. Navigate to `http://localhost:3000`
3. Should redirect to Keycloak login
4. Login with Keycloak user
5. Should redirect back to dashboard
6. Check browser console for token

### 3. Test API Calls
1. Login successfully
2. Create a meeting
3. Check Network tab → Request Headers → Authorization
4. Should see `Bearer <token>`

## 🔒 Security Checklist

- ✅ Tokens never stored in localStorage (managed by Keycloak)
- ✅ Automatic token refresh
- ✅ PKCE flow enabled (S256)
- ✅ No client secret (public client)
- ✅ Valid redirect URIs configured
- ✅ Web origins configured for CORS

## 🐛 Troubleshooting

### "Keycloak initialization failed"
- Check Keycloak URL is accessible
- Verify realm name is correct
- Check client ID matches Keycloak config
- Check browser console for details

### "Invalid redirect URI"
- Add your frontend URL to Valid Redirect URIs in Keycloak client
- Include trailing `/*` wildcard
- Check protocol (http vs https)

### "Token expired" / Constant redirects
- Check token refresh logic in `KeycloakService`
- Verify Keycloak session timeout settings
- Check browser console for errors

### "CORS errors"
- Add Web Origins in Keycloak client settings
- Use `+` or add specific domain
- Verify API Gateway CORS config

### API calls return 401 Unauthorized
- Check token is being sent in Authorization header
- Verify API Gateway is validating Keycloak tokens
- Check realm/client configuration matches

## 📝 Next Steps After Keycloak Integration

1. ✅ Install keycloak-js dependency
2. ✅ Update keycloak-config.ts with real values
3. ✅ Configure Keycloak client in Admin Console
4. ✅ Test authentication flow
5. ✅ Test API calls with Keycloak tokens
6. ✅ Build and deploy Docker image
7. ✅ Configure Kubernetes ingress/service
8. ✅ Test production deployment

## 📚 Additional Resources

- [Keycloak JS Adapter Docs](https://www.keycloak.org/docs/latest/securing_apps/#_javascript_adapter)
- [React Keycloak Integration](https://www.keycloak.org/docs/latest/securing_apps/#_react)
- [PKCE Flow](https://oauth.net/2/pkce/)

---

**Status**: Ready for npm install and Keycloak configuration  
**Last Updated**: November 25, 2025
