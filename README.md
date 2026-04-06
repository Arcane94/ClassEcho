# SnapClass Observation Tool

The SnapClass Observation Tool will be used by observers in classrooms and other learning environments to document the usage of SnapClass by teachers and students.

## Project Structure

The repo is now organized so the current observation tool can live beside another React app under one authenticated shell.

```text
frontend/
  src/
    app/                    # App shell and router
    features/
      auth/                 # Login, signup, password reset pages
      observation-tool/     # Observation tool pages/components
      workspace/            # Post-login app hub
    components/             # Shared UI components
    services/               # Shared API/service layer
    utils/                  # Shared utilities/export helpers
    assets/                 # Shared images/styles
backend/
  src/
    app.js                  # Express app setup
    server.js               # Server bootstrap
    config/                 # Local app config + db config
    controllers/
    models/
    routes/
    utils/
  database/
    observer_tool_sql.sql
```

## Frontend Startup & Usage
Steps to run frontend on your own machine:

1. Navigate into frontend folder
```bash
cd frontend
```
2. Download needed libraries.
```bash
npm install
```
3. Start Frontend
```bash
npm run dev
```
4. Login is still the landing page, and successful login now routes to an app hub at `/apps` before entering the observation tool.

## Server Usage
Steps to run server on your own machine:

1. Ensure Node.js and npm are installed on your device.

2. Navigate into backend folder
```bash
cd backend
```
3. Download needed libraries.
```bash
npm install
```
4. Copy `backend/src/config/appConfig.template.js` to `backend/src/config/appConfig.js`
5. Update `backend/src/config/appConfig.js` with your machine's MySQL and email information to use the database
6. Start server
```bash
//Simple startup
node src/server.js
```
```bash
//Nodemon startup (development startup that updates server automatically when saved)
npm run dev
```

## Root Scripts

You can also run the existing package scripts from the repository root:

```bash
npm run frontend:dev
npm run frontend:build
npm run backend:dev
```
