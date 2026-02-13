# Loagma Employee Management

A Business Task Delegation & Performance Intelligence System designed for business owners who delegate hundreds/thousands of tasks monthly.

## Overview

Loagma Employee Management is a centralized platform that helps business owners:
- Create and delegate tasks instantly
- Monitor performance analytics
- Track completion rates
- Automate reminders
- See department & employee performance

## Key Features

- **Dashboard**: Executive overview with KPI metrics and analytics
- **Task Management**: Create, assign, and track tasks with status monitoring
- **Analytics**: Performance intelligence and department comparison
- **Automation**: Set up automated reminders and notifications
- **Employee Profiles**: Individual performance tracking and task history

## Tech Stack

### Frontend
- React 19 (Vite)
- Tailwind CSS
- React Router
- React Query
- Axios
- React Hot Toast
- Lucide React Icons

### Backend (Planned)
- Django API
- PostgreSQL

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
frontend/
├── src/
│   ├── app/              # App configuration (axios, routes, queryClient)
│   ├── components/       # Reusable UI components
│   │   ├── cards/        # Card components
│   │   ├── charts/       # Chart components
│   │   ├── modals/       # Modal components
│   │   ├── navigation/   # Navigation components
│   │   └── ui/           # Base UI components
│   ├── features/         # Feature-based modules
│   │   ├── analytics/
│   │   ├── auth/
│   │   ├── automation/
│   │   ├── dashboard/
│   │   ├── departments/
│   │   ├── employees/
│   │   └── tasks/
│   ├── hooks/            # Custom React hooks
│   ├── layouts/          # Layout components
│   ├── pages/            # Page components
│   └── styles/           # Global styles and documentation
├── public/               # Static assets
└── package.json
```

## Features Implemented

### UI Components
- ✅ Reusable form system (Input, Select, Textarea)
- ✅ Button variants (primary, secondary, danger)
- ✅ Card components with hover effects
- ✅ Modal system with backdrop
- ✅ Status badges
- ✅ Loading skeletons
- ✅ Toast notifications

### Navigation
- ✅ Collapsible sidebar with active route highlighting
- ✅ Top navbar with search and notifications
- ✅ Quick action menu
- ✅ Responsive layout

### Pages
- ✅ Dashboard with KPI metrics
- ✅ Task Management with table and filters
- ✅ Analytics with performance charts
- ✅ Automation with rule management
- ✅ Employee Profile

### UX Enhancements
- ✅ Outside-click detection for dropdowns
- ✅ Escape key support for dismissible UI
- ✅ Proper z-index hierarchy
- ✅ Loading states with skeletons
- ✅ Toast notifications
- ✅ Smooth transitions and hover effects

### API Integration (Ready)
- ✅ Axios instance configured
- ✅ Feature-based API structure
- ✅ CRUD operations for tasks

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

### Code Style

This project uses:
- ESLint for code linting
- Tailwind CSS for styling
- Component-based architecture
- Feature-based folder structure

## Documentation

- [Floating UI Fixes](./FLOATING-UI-FIXES.md) - Documentation of UI interaction fixes
- [Z-Index Hierarchy](./src/styles/z-index-hierarchy.md) - Z-index stacking order guide

## License

Private - All rights reserved

## Contact

For questions or support, please contact the development team.
