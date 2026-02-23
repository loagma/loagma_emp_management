# Employee Management System

A comprehensive full-stack employee management system built with Django REST Framework and React. This system provides robust features for managing employees, tracking attendance, managing tasks, and monitoring break times with real-time notifications.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [System Requirements](#system-requirements)
- [Project Structure](#project-structure)
- [Installation & Setup](#installation--setup)
- [Running the Application](#running-the-application)
- [Default Credentials](#default-credentials)
- [API Documentation](#api-documentation)
- [Key Features Explained](#key-features-explained)
- [Troubleshooting](#troubleshooting)

## ✨ Features

### For Administrators
- **Dashboard Analytics**: Real-time overview of employee activities, tasks, and attendance
- **Employee Management**: Add, edit, and manage employee profiles with role-based access
- **Task Management**: Create, assign, and track tasks with priorities and deadlines
- **Attendance Monitoring**: View employee punch-in/out times and break durations
- **Break Notifications**: Receive alerts when employees exceed expected break times
- **Department Management**: Organize employees by departments
- **Profile Management**: Upload and manage employee profile pictures

### For Employees
- **Unified Dashboard**: Single-page interface with time tracking, tasks, and activity logs
- **Time Tracking**: Punch in/out with automatic time calculation
- **Break Management**: Start/end breaks with category selection and duration tracking
- **Task Management**: View, edit, and update assigned tasks with inline editing
- **Task Pause/Resume**: Pause tasks with reasons and resume when ready
- **Profile Access**: View and update personal profile information
- **Activity Logs**: Real-time activity feed showing all punch and break events

## 🛠 Tech Stack

### Backend
- **Framework**: Django 4.2+ with Django REST Framework
- **Database**: PostgreSQL (recommended) or SQLite (development)
- **Authentication**: JWT (JSON Web Tokens)
- **API**: RESTful API with token-based authentication
- **File Storage**: Django's file storage system for profile pictures

### Frontend
- **Framework**: React 18+ with Vite
- **State Management**: TanStack Query (React Query) for server state
- **Routing**: React Router v6
- **Styling**: Tailwind CSS with custom components
- **Icons**: Lucide React
- **Forms**: React Hook Form with validation
- **Notifications**: React Hot Toast

## 💻 System Requirements

- **Node.js**: v16.0 or higher
- **Python**: 3.9 or higher
- **PostgreSQL**: 12 or higher (optional, SQLite works for development)
- **npm** or **yarn**: Latest version
- **Git**: For version control

## 📁 Project Structure

```
employee-management-system/
├── backend/                    # Django backend
│   ├── core/                  # Core settings and configuration
│   ├── users/                 # User management and authentication
│   ├── attendance/            # Attendance and break tracking
│   ├── tasks/                 # Task management
│   ├── organization/          # Organization and department management
│   ├── analytics/             # Analytics and reporting
│   ├── manage.py             # Django management script
│   └── requirements.txt      # Python dependencies
│
├── frontend/                  # React frontend
│   ├── src/
│   │   ├── app/              # App configuration and routing
│   │   ├── components/       # Reusable UI components
│   │   ├── features/         # Feature-specific components and logic
│   │   ├── pages/            # Page components
│   │   ├── layouts/          # Layout components
│   │   └── index.css         # Global styles
│   ├── package.json          # Node dependencies
│   └── vite.config.js        # Vite configuration
│
└── README.md                  # This file
```

## 🚀 Installation & Setup

### Backend Setup

1. **Navigate to the backend directory**
   ```bash
   cd backend
   ```

2. **Create a virtual environment**
   ```bash
   # Windows
   python -m venv myenv
   myenv\Scripts\activate

   # macOS/Linux
   python3 -m venv myenv
   source myenv/bin/activate
   ```

3. **Install Python dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables**
   
   Create a `.env` file in the `backend` directory:
   ```env
   SECRET_KEY=your-secret-key-here
   DEBUG=True
   ALLOWED_HOSTS=localhost,127.0.0.1
   
   # Database (PostgreSQL - optional)
   DB_NAME=employee_db
   DB_USER=postgres
   DB_PASSWORD=your_password
   DB_HOST=localhost
   DB_PORT=5432
   
   # For development, SQLite is used by default
   ```

5. **Run database migrations**
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

6. **Create a superuser (admin account)**
   ```bash
   python manage.py createsuperuser
   ```
   Follow the prompts to create your admin account.

7. **Load initial data (optional)**
   ```bash
   # Create default break categories
   python manage.py shell
   >>> from attendance.models import BreakCategory, Organization
   >>> org = Organization.objects.first()
   >>> BreakCategory.objects.create(organization=org, name="Lunch Break", color="#10B981")
   >>> BreakCategory.objects.create(organization=org, name="Coffee Break", color="#F59E0B")
   >>> exit()
   ```

### Frontend Setup

1. **Navigate to the frontend directory**
   ```bash
   cd frontend
   ```

2. **Install Node dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Configure API endpoint**
   
   The frontend is pre-configured to connect to `http://localhost:8000`. If your backend runs on a different port, update `frontend/src/app/axios.js`:
   ```javascript
   const api = axios.create({
     baseURL: "http://localhost:8000", // Change this if needed
   });
   ```

## ▶️ Running the Application

### Start the Backend Server

```bash
cd backend
python manage.py runserver
```

The backend API will be available at `http://localhost:8000`

### Start the Frontend Development Server

```bash
cd frontend
npm run dev
# or
yarn dev
```

The frontend will be available at `http://localhost:5173`

### Access the Application

1. Open your browser and navigate to `http://localhost:5173`
2. Log in with your credentials:
   - **Admin**: Use the superuser credentials you created
   - **Employee**: Create employee accounts through the admin dashboard

## 🔑 Default Credentials

After setup, you'll have the superuser account you created. To create employee accounts:

1. Log in as admin
2. Navigate to "Employees" section
3. Click "Add Employee"
4. Fill in the employee details
5. The employee can then log in with their credentials

## 📚 API Documentation

### Authentication Endpoints

- `POST /api/auth/login/` - User login
- `POST /api/auth/logout/` - User logout
- `POST /api/auth/refresh/` - Refresh JWT token

### User Endpoints

- `GET /api/users/` - List all users (admin only)
- `GET /api/users/me/` - Get current user profile
- `POST /api/users/` - Create new user (admin only)
- `PATCH /api/users/{id}/` - Update user
- `POST /api/users/{id}/upload_profile_picture/` - Upload profile picture

### Attendance Endpoints

- `GET /api/attendance/current/` - Get current attendance status
- `POST /api/attendance/punch-in/` - Punch in
- `POST /api/attendance/punch-out/` - Punch out
- `POST /api/attendance/start-break/` - Start a break
- `POST /api/attendance/end-break/` - End current break
- `GET /api/attendance/` - List attendance records

### Task Endpoints

- `GET /api/tasks/` - List tasks
- `POST /api/tasks/` - Create task
- `GET /api/tasks/{id}/` - Get task details
- `PATCH /api/tasks/{id}/` - Update task
- `PATCH /api/tasks/{id}/status/` - Update task status
- `PATCH /api/tasks/{id}/pause/` - Pause task
- `PATCH /api/tasks/{id}/resume/` - Resume task

### Break Category Endpoints

- `GET /api/attendance/break-categories/` - List break categories
- `POST /api/attendance/break-categories/` - Create break category (admin only)

## 🎯 Key Features Explained

### 1. Unified Employee Dashboard

The employee dashboard provides a single-page interface with:
- **Left Panel (1/3)**: Profile, time tracking clock, punch/break controls, activity logs
- **Right Panel (2/3)**: Task management with inline editing
- **Fixed Scrollable Containers**: Tasks and logs scroll independently
- **Real-time Updates**: Automatic refresh every 30 seconds

### 2. Enhanced Break Management

- **Break Categories**: Predefined categories (Lunch, Coffee, etc.) with color coding
- **Duration Tracking**: Set expected duration and track actual time
- **Notifications**: Admins receive alerts when breaks exceed expected duration
- **Break History**: Complete log of all breaks with start/end times

### 3. Task Management with Pause/Resume

- **Inline Editing**: Edit tasks directly from the list view
- **Status Workflow**: Assigned → In Progress → Completed
- **Pause Functionality**: Pause tasks with reasons, preserving time tracking
- **Priority Levels**: Critical, High, Medium, Low with color coding
- **Deadline Tracking**: Visual indicators for overdue tasks

### 4. Profile Picture Management

- **Upload**: Drag-and-drop or click to upload
- **Preview**: Real-time preview before upload
- **Validation**: File type and size validation
- **Display**: Profile pictures shown throughout the application

### 5. Real-time Notifications

- **Break Alerts**: Notify admins when employees exceed break time
- **Task Notifications**: Alerts when tasks are paused with reasons
- **Badge Indicators**: Visual count of unread notifications
- **Notification Panel**: Expandable panel with notification history

## 🔧 Troubleshooting

### Backend Issues

**Problem**: `ModuleNotFoundError` when running Django
- **Solution**: Ensure virtual environment is activated and all dependencies are installed
  ```bash
  pip install -r requirements.txt
  ```

**Problem**: Database connection errors
- **Solution**: Check your `.env` file configuration or use SQLite for development

**Problem**: CORS errors
- **Solution**: Ensure `CORS_ALLOWED_ORIGINS` in `settings.py` includes your frontend URL

### Frontend Issues

**Problem**: `npm install` fails
- **Solution**: Clear npm cache and try again
  ```bash
  npm cache clean --force
  npm install
  ```

**Problem**: API connection refused
- **Solution**: Ensure backend server is running on `http://localhost:8000`

**Problem**: Login fails with 401 error
- **Solution**: Check that user credentials are correct and backend is running

### Common Issues

**Problem**: Profile pictures not displaying
- **Solution**: Ensure `MEDIA_URL` and `MEDIA_ROOT` are configured in Django settings

**Problem**: Tasks not updating in real-time
- **Solution**: Check browser console for errors and ensure React Query is properly configured

## 📝 Development Notes

- The application uses JWT tokens stored in localStorage for authentication
- All API requests include the JWT token in the Authorization header
- The frontend uses TanStack Query for efficient data fetching and caching
- Tailwind CSS is used for styling with custom utility classes
- The backend follows Django REST Framework best practices

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👥 Support

For support, email your-email@example.com or open an issue in the repository.

---

**Built with ❤️ using Django and React**
