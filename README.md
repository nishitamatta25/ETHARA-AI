# TaskFlow - Full-Stack Project & Task Management App

TaskFlow is a modern, full-stack web application designed to help teams collaborate, organize projects, and track tasks efficiently. It features a vibrant UI, role-based access control, and real-time status tracking.

## 🌟 Key Features

### 1. Role-Based Access Control (RBAC)
The app supports two distinct user roles:
*   **Admin**: Can create and delete projects, add or remove members from projects, manage all users on the platform (change roles, delete accounts), and oversee everything.
*   **Member**: Can view projects they are assigned to, create tasks, update the status of tasks, and track their own progress.

### 2. Project Management
*   **Create Projects**: Admins can create new projects with a name, description, priority, deadline, and a designated color theme.
*   **Team Collaboration**: Admins can invite registered users to specific projects. Users only see projects they are a part of.
*   **Progress Tracking**: Each project displays a progress bar showing the percentage of completed tasks versus total tasks.

### 3. Task Tracking (Kanban Board)
*   **Kanban UI**: Tasks are organized into three visual columns: `To Do`, `In Progress`, and `Done`.
*   **Detailed Tasks**: Tasks include titles, descriptions, priority levels (Low, Medium, High), assignees, and due dates.
*   **Quick Actions**: Users can quickly change task statuses via dropdowns, edit task details, or delete tasks (creators and admins only).

### 4. Interactive Dashboard
*   **Analytics Stats**: Provides a high-level overview of total tasks, tasks in-progress, completed tasks, and overdue tasks.
*   **Recent Activity**: Shows the most recently created or updated tasks across the user's projects.
*   **Overdue Alerts**: Highlights tasks that have missed their deadlines to ensure they get immediate attention.

### 5. Modern UI/UX
*   **Glassmorphism Design**: Features a premium dark mode with semi-transparent frosted glass effects, colorful gradients, and smooth hover animations.
*   **Fully Responsive**: The layout adapts seamlessly from large desktop monitors down to mobile screens.

---

## 🛠️ Technology Stack

This application is built using the **MERN** stack (with Vite replacing Create React App for better performance).

### Frontend (Client-side)
*   **React.js**: Core library for building the user interface.
*   **Vite**: Next-generation frontend tooling for ultra-fast development and building.
*   **React Router (v6)**: Handles navigation and protected routes securely.
*   **Axios**: Manages HTTP requests to the backend API.
*   **Context API**: Manages global state, particularly user authentication sessions.
*   **Vanilla CSS**: Custom-written CSS using CSS variables, flexbox, grid, and modern styling techniques (no heavy CSS frameworks used).
*   **Lucide React**: Beautiful, consistent SVG icons.

### Backend (Server-side)
*   **Node.js & Express.js**: Handles the REST API architecture, routing, and server logic.
*   **MongoDB & Mongoose**: NoSQL database for flexible data storage. Uses schemas for Users, Projects, and Tasks with proper relational references (`ObjectId`).
*   **JSON Web Tokens (JWT)**: Secures API endpoints. The server generates a token upon login, which the frontend stores and sends with subsequent requests to prove identity.
*   **Bcrypt.js**: Secures user passwords by hashing them before they are stored in the database.

---

## 🏗️ Architecture & Database Schema

The database relies on three interconnected collections:

1.  **Users Collection**: Stores name, email, hashed password, and role (`admin` or `member`).
2.  **Projects Collection**: Stores project details, the owner (`User` ID), and an array of project members (referencing `User` IDs).
3.  **Tasks Collection**: Stores task details, references the `Project` it belongs to, the `User` it is assigned to, and the `User` who created it.

By using MongoDB's `.populate()` method, the backend efficiently joins these documents together when sending data to the frontend (e.g., swapping a User ID for their actual name and email).

---

## 🚀 How to Use the App Locally

### 1. Create an Admin Account
1. Go to `http://localhost:5173/signup`.
2. Fill in your details.
3. Click the text **"Have an admin access key?"**.
4. Enter the secret key: `ADMIN2024` (This key is defined in the backend `.env` file).
5. Click **Create Account**. You are now an Admin.

### 2. Set Up a Project
1. Navigate to the **Projects** tab on the sidebar.
2. Click **+ New Project**. Give it a name, deadline, and a color.
3. Once created, click on the project card to open it.

### 3. Add Members
1. Have a teammate (or open an incognito window yourself) sign up *without* the admin key. They will become a `Member`.
2. As the Admin, go to your Project, click the **Members** tab, and click **Add Member**.
3. Select the newly registered user from the dropdown.

### 4. Manage Tasks
1. Inside the project, switch back to the **Board** tab.
2. Click **+ Add Task**.
3. Fill out the task details and assign it to the member you just added.
4. The member can now log in, see the project, and move their assigned task to "In Progress" or "Done".
