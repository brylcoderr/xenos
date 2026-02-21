# Xenotrix Agency OS - Setup Guide

## Prerequisites

1. **Node.js** (v18+)
2. **MongoDB** (local or Atlas)
3. **npm** or **yarn**

## Quick Start

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install client dependencies
cd client && npm install
```

### 2. Configure Environment

Edit `.env` file:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/xenotrix-agency
JWT_SECRET=your-secret-key
```

### 3. Start MongoDB

```bash
# If using local MongoDB
mongod
```

### 4. Seed Database (First Time Only)

```bash
node server/seed.js
```

This creates sample data with login credentials:
- **Email:** admin@xenotrix.com
- **Password:** password

### 5. Run the Application

```bash
# Run both server and client
npm run dev

# Or separately:
npm run server  # Backend on port 5000
npm run client  # Frontend on port 5173
```

## Features Implemented

### Core Modules
- **Dashboard** - Revenue stats, leads count, active clients, pending invoices, project progress
- **CRM/Lead Management** - Table + Kanban views, status badges, filters, CSV import/export
- **Client Management** - Profile, company info, projects, invoices, timeline
- **Document Builder** - Rich text editor, variable placeholders, PDF/DOCX export
- **Project Management** - Timeline view, milestones, progress tracker, workflow stages
- **Invoice System** - Editable builder, auto calculations, PDF download
- **Template Management** - Admin can create/edit templates
- **Workflow Engine** - Lead → Proposal → Agreement → Onboarding → Development → Delivery → Handoff

### Design System
- Dark futuristic theme (#06060a background)
- Accent colors: Green (#39e97b), Purple (#9b7cff), Orange (#ff7c3a), Blue (#3acdff)
- Typography: Syne (headings), DM Sans (body), Space Mono (code)
- Card-based UI with subtle gradients and thin borders

### API Endpoints

- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register
- `GET /api/leads` - List leads
- `GET /api/clients` - List clients
- `GET /api/projects` - List projects
- `GET /api/documents` - List documents
- `GET /api/templates` - List templates
- `GET /api/invoices` - List invoices
- `GET /api/dashboard/stats` - Dashboard stats
- `POST /api/workflows/advance` - Advance project workflow

## Project Structure

```
├── server/
│   ├── models/          # MongoDB schemas
│   ├── routes/         # API routes
│   ├── middleware/     # Auth middleware
│   ├── utils/         # Export utilities
│   └── index.js       # Express server
├── client/
│   ├── src/
│   │   ├── components/ # React components
│   │   ├── pages/     # Page components
│   │   ├── store/     # Zustand stores
│   │   └── lib/       # Utilities
│   └── package.json
├── package.json
└── .env
```

## Tech Stack

- **Frontend:** React + Vite + TailwindCSS + Zustand + Framer Motion
- **Backend:** Node.js + Express + MongoDB + Mongoose
- **Auth:** JWT
- **Export:** Puppeteer (PDF), html-to-docx (DOCX)
