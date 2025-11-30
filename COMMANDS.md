#!/bin/bash
# Command Reference for Interactive Meeting Platform Frontend
# Build Tool: Vite (migrated from Create React App)

## Development Server

# Start Vite development server (default: localhost:3000)
npm run dev

# Start on specific port (edit vite.config.ts server.port)
# Or use environment override
VITE_PORT=3001 npm run dev

# Production build preview
npm run preview

## Building & Deployment

# Build for production
npm run build

# Preview production build locally
npm run preview

# Type check TypeScript
npx tsc --noEmit

## Testing

# (Testing framework not yet configured)
# When ready, add Jest or Vitest configuration

## Package Management

# Install dependencies
npm install

# Install specific package
npm install package-name

# Install dev dependency
npm install --save-dev package-name

# Update all packages
npm update

# Check for outdated packages
npm outdated

# Clean up dependencies
npm prune

## Cache & Cleanup

# Clear npm cache
npm cache clean --force

# Remove node_modules
rm -rf node_modules

# Remove package lock
rm package-lock.json

# Fresh install (clean slate)
npm cache clean --force && rm -rf node_modules && npm install

## Debugging

# Run with Vite debug mode
DEBUG=* npm run dev

# Type check in watch mode
npx tsc --watch

## Environment Variables

# Create .env.local (use VITE_ prefix)
# Example:
# VITE_API_URL=http://localhost:5000
# VITE_ENV=development

## Git Commands

# Check status
git status

# Pull latest changes
git pull origin mainPage

# Create feature branch
git checkout -b feature/feature-name

# Commit changes
git add .
git commit -m "feat: description"

# Push to remote
git push origin feature/feature-name

# Revert changes
git checkout -- .

## File Operations

# List project structure
tree -L 3

# Find TypeScript files
find src -name "*.tsx"

# Find all imports of a component
grep -r "import.*Component" src/

# Count lines of code
find src -name "*.tsx" -o -name "*.ts" | xargs wc -l

## Troubleshooting Commands

# Check if port 3000 is in use
netstat -an | grep 3000

# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Verify Node installation
node --version
npm --version

# Check project health
npm doctor

# Verify TypeScript setup
npx tsc --version

# List all npm scripts
npm run

## Performance Analysis

# Analyze bundle size
npm run build
npm install -g webpack-bundle-analyzer

# Check build time
time npm run build

# Measure build time
time npm run build

## Security

# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# Check dependencies for security issues
npm install -g snyk
snyk test

## Useful Aliases (Add to ~/.bashrc or ~/.zshrc)

alias fe='cd c:\Users\alexb\m7011e\project\frontend'
alias dev='npm run dev'
alias build='npm run build'
alias preview='npm run preview'
alias check='npx tsc --noEmit'
alias clean='npm cache clean --force && rm -rf node_modules && npm install'

# Usage: fe && dev

## Quick Development Workflow

# 1. Start development
npm run dev

# 2. Make changes to code

# 3. Test changes (auto-reloads with Vite HMR)
# Changes automatically trigger refresh

# 4. Commit changes
git add .
git commit -m "feat: your changes"

# 5. Push to GitHub
git push origin feature/branch-name

## Production Workflow

# 1. Update version
npm version patch

# 2. Build for production
npm run build

# 3. Test production build locally
npm run preview

# 4. Deploy
git push origin mainPage

## Docker Commands (When Ready)

# Build Docker image
docker build -t interactive-meeting-frontend:1.0 .

# Run Docker container
docker run -p 3000:3000 interactive-meeting-frontend:1.0

# Push to registry
docker push your-registry/interactive-meeting-frontend:1.0

## Kubernetes Commands (When Ready)

# Apply deployment
kubectl apply -f k8s/deployment.yaml

# Check deployment status
kubectl get deployments

# View pod logs
kubectl logs deployment/interactive-meeting-frontend

# Port forward
kubectl port-forward svc/interactive-meeting-frontend 3000:80

# Scale deployment
kubectl scale deployment interactive-meeting-frontend --replicas=3

# Delete deployment
kubectl delete deployment interactive-meeting-frontend

## Useful Resources

# Open Node Package Manager
npm home

# Open GitHub repo
npm repo

# View package documentation
npm docs package-name

# View package changelog
npm changelog package-name

## Advanced Commands

# Generate TypeScript declaration files
npx tsc --declaration --emitDeclarationOnly

# Check for circular dependencies
npx circular-dependency-check src/

# Profile React rendering
# Add ?react_perf to URL and open Performance tab

# Export environment variables
export REACT_APP_API_URL=http://localhost:5000
export REACT_APP_ENV=development

# View all available npm commands
npm help

## Keyboard Shortcuts in Dev Server

When running `npm start`:

Key | Action
----|-------
r   | Reload app
q   | Quit dev server
t   | Run tests
u   | Update test snapshots
f   | Show only failed tests
p   | Filter tests by filename
a   | Run all tests
c   | Clear console
w   | Show help

## Command Quick Reference Table

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server (Vite) |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm install` | Install dependencies |
| `npm audit` | Check security |
| `npx tsc --noEmit` | Type check |
| `npm cache clean` | Clear cache |
| `git push` | Push changes |
| `git pull` | Get latest changes |

## Tips & Tricks

1. **Faster Reinstall**
   ```bash
   npm ci
   ```
   Uses exact versions from package-lock.json

2. **Update npm itself**
   ```bash
   npm install -g npm@latest
   ```

3. **Check npm version**
   ```bash
   npm -v
   ```

4. **View global packages**
   ```bash
   npm list -g
   ```

5. **Create .npmrc for faster installs**
   ```bash
   echo "registry=https://registry.npmjs.org/" > .npmrc
   ```

6. **Increase watch file limit (Linux)**
   ```bash
   echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
   sudo sysctl -p
   ```

---

**Last Updated**: November 18, 2025  
**Project**: Interactive Meeting Platform Frontend  
**Status**: Ready for localhost testing
