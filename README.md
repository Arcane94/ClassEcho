# ClassEcho Platform

ClassEcho is a classroom research platform for capturing what happens during live instruction and then turning those observations into replayable, analyzable session data afterward.

It combines two connected workflows:

- `Observation Mode`: create sessions, join live observations, define classroom sections/tags, and record teacher and student observation logs in real time.
- `Visualization Mode`: define replay windows and seating charts, replay session activity, review filtered logs, inspect 
cumulative patterns, and optionally view student Snap! code history when [SnapClass](https://lin-class17.csc.ncsu.edu/snapclass/) data (See what is SnapClass section) is connected.

In practice, ClassEcho supports the full cycle of classroom research work:

- Session setup and observer coordination
- Structured teacher and student observation logging
- Replay windows and seating-chart configuration
- Observation logs playback
- Cumulative summaries and pattern inspection
- View student code snapshots 

## What Is SnapClass?

SnapClass is a classroom management platform for Snap!.

It adds classroom-facing features around Snap!, including:

- Teacher tools for managing classrooms and assignments
- Easier save/load flows for student projects
- Project version history
- Emoji reactions while students are coding to report affect
- Project sharing and collaboration features for classmates

ClassEcho reads student coding data from the SnapClass database to power the `student code view` inside Visualization Mode.

If you do not want to use SnapClass, ClassEcho still works for:

- all of Observation Mode
- replay windows and seating charts in Visualization Mode
- log playback, filtering, and cumulative views

Without SnapClass, the only feature you lose is the `student code view` in Visualization Mode.

## Third-Party Attribution

ClassEcho includes a local copy of [iSnap](https://github.com/thomaswp/iSnap) in [backend/runtime/isnap](backend/runtime/isnap). We use it to serve the Snap-based runtime/viewer that renders SnapClass student code snapshots inside Visualization Mode. The bundled `isnap` runtime is licensed under the GNU Affero General Public License v3.0; see [backend/runtime/isnap/LICENSE](backend/runtime/isnap/LICENSE).

## Repository Layout

```text
frontend/
  src/
    app/                            # app shell + routing
    features/
      auth/                         # login/signup/password reset
      workspace/                    # post-login tool hub
      observation-mode/             # observation mode pages/components
      visualization-mode/           # setup + replay + analytics UI
backend/
  src/
    app.js                          # express app
    server.js                       # server bootstrap
    config/appConfig.js             # backend runtime config
    db/connections.js               # DB connection setup
    controllers/
    models/
    routes/
    utils/
  runtime/isnap/                    # local Snap runtime assets used by code viewer
  database/classecho.sql            # schema
```

## Prerequisites

- Node.js `22.x` (project currently runs on `v22.17.1`)
- npm `10+`
- MySQL

## Database Setup

1. Create a MySQL database for ClassEcho session and observation data.
2. Import [classecho.sql](backend/database/classecho.sql) into that database.
3. If you want to self-host student code logs we included the SnapClass database structure as an example in 
[snapclass.sql](backend/database/snapclass.sql).

If you are not using SnapClass, you can still use the rest of ClassEcho normally. Only the student code view depends on SnapClass data.


## Backend Configuration

Backend config should live in [appConfig.js](backend/src/config/appConfig.template.js).  
All fields are env-driven with defaults.

Primary env variables:

- `DB_HOST`, `DB_USER`, `DB_PASS`, `DB_PORT`
- `OBSERVATION_DB_NAME`
- `VISUALIZATION_DB_NAME`
- `VISUALIZATION_DB_USER_TABLE`
- `VISUALIZATION_DB_TRACE_TABLE`
- `VISUALIZATION_DB_EMOJI_TABLE`
- `SERVER_PORT` (or `PORT`)
- `EMAIL_SERVICE`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`
- `EMAIL_USER`, `EMAIL_APP_PASSWORD`, `EMAIL_FROM`

## Frontend API Base URL

Frontend currently reads API base from [index.ts](frontend/src/config/index.ts).

- Local dev example: `http://localhost:3011`
- Production: set this to your deployed backend URL (or `/api` behind reverse proxy)

## Run Locally

### Backend

```bash
cd backend
npm install
npm run start
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Login routes to `/apps`, where users can open Observation Mode or Visualization Mode.

## Root Convenience Scripts

From repo root:

```bash
npm run frontend:dev
npm run frontend:build
npm run backend:dev
npm run backend:start
```

## Citation

If you use ClassEcho in your research, please cite:

Limke, A., Rajapaksha, Y., Reed, E., Hill, M., Lytle, N., Cateté, V., & Barnes, T. (2026).
*ClassEcho: A Tool for Observing, Visualizing, and Analyzing Student-Teacher Interactions in K-12 Computing Classrooms.*
Extended Abstracts of the CHI Conference on Human Factors in Computing Systems.
https://doi.org/10.1145/3772363.3798572

```bibtex
@inproceedings{limke2026classecho,
  title={ClassEcho: A Tool for Observing, Visualizing, and Analyzing Student-Teacher Interactions in K-12 Computing Classrooms},
  author={Limke, Ally and Rajapaksha, Yasitha and Reed, Eli and Hill, Marnie and Lytle, Nicholas and Cateté, Veronica and Barnes, Tiffany},
  booktitle={Extended Abstracts of the CHI Conference on Human Factors in Computing Systems},
  year={2026},
  pages={1--7},
  doi={10.1145/3772363.3798572}
}
```

## Production Deployment

1. Build frontend: `npm --prefix frontend run build`.
2. Deploy backend (`backend/src`, `backend/runtime/isnap`, `backend/package*.json`) and start it with `npm run start` (prefer `pm2`/`systemd` in production).
3. Serve `frontend/dist` with Nginx (or similar static server).
4. Reverse-proxy API traffic to backend port (`SERVER_PORT`) and set required env vars.
