# Mini CRM - Client Lead Management System

A simple yet powerful Lead Management System (Mini CRM) built for agencies, freelancers, and startups. This project helps manage incoming leads from website contact forms — from capturing the lead to converting it into a client.

Perfect for teaching interns full-stack development with real-world business logic.

---

## 🎯 Objective

Build a functional CRM that allows admins to:
- View all incoming leads
- Update lead status (New → Contacted → Converted)
- Add follow-up notes
- Secure admin access

---

## 🛠 Tech Stack

### Backend
- **Node.js** + **Express.js**
- **MongoDB** with **Mongoose**
- **JWT** Authentication
- **bcryptjs** for password hashing

### Frontend
- **React.js** (Create React App)
- **Material-UI (MUI)** for modern UI components
- **Axios** for API calls
- **React Router** for navigation

---

## 📁 Project Structure

```
mini-crm/
├── backend/
│   ├── models/
│   │   ├── Lead.js
│   │   └── User.js
│   ├── routes/
│   │   ├── auth.js
│   │   └── leads.js
│   ├── middleware/
│   │   └── auth.js
│   ├── server.js
│   ├── .env
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.js
│   │   │   └── Dashboard.js
│   │   ├── components/
│   │   │   └── ProtectedRoute.js
│   │   └── App.js
│   └── package.json
│
└── README.md
```

---

## 🚀 How to Run the Project

### 1. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Start the backend server
npm run dev
```

**Important**: Make sure your `.env` file contains:

```env
MONGO_URI=mongodb+srv://<db_username>:<db_password>@cluster21.ee3sour.mongodb.net/minicrm?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret_key_here
PORT=5000
```

The server will run on **http://localhost:5000**

---

### 2. Frontend Setup

Open a **new terminal** and run:

```bash
cd frontend

# Install dependencies (already done)
npm install

# Start the React app
npm start
```

The frontend will open automatically at **http://localhost:3000**

---

### 3. First Time Setup

1. Go to the frontend → Login page
2. Use these credentials:
   - **Username**: `admin`
   - **Password**: `admin123`

3. After login, you will see the Leads Dashboard.

---

## 🔑 Available API Endpoints

### Authentication
- `POST /api/auth/login` → Login admin
- `POST /api/auth/setup` → Create admin user (run once)

### Leads
- `POST /api/leads` → Create new lead (public - from website form)
- `GET /api/leads` → Get all leads (requires JWT token)
- `PUT /api/leads/:id` → Update status or add note (protected)

---

## ✨ Key Features Implemented

- ✅ Secure JWT Authentication
- ✅ Lead listing with status
- ✅ Update lead status (New / Contacted / Converted)
- ✅ Add follow-up notes
- ✅ Responsive Material-UI design
- ✅ Protected routes
- ✅ Clean separation of frontend & backend

---

## 🧪 How to Test

### Test Creating a Lead (Public)
Use Postman or any tool:
```json
POST http://localhost:5000/api/leads
{
  "name": "Teboho Modiba",
  "email": "teboho@example.com",
  "phone": "0812345678",
  "message": "Interested in web development services"
}
```

### Test Dashboard
1. Login with `admin` / `admin123`
2. View leads
3. Change status
4. Add notes

---

## 🎓 Learning Outcomes for Interns

- Building full-stack applications
- RESTful API design
- JWT Authentication & Middleware
- MongoDB with Mongoose
- State management in React
- Material-UI component usage
- Real-world CRM business logic

---

## 🔮 Bonus Features Ideas (Optional)

- Search and filter leads
- Lead source tracking
- Simple analytics dashboard (total leads, conversion rate)
- Export leads to CSV
- Email notifications
- Pagination

---

## 📝 Notes

- Backend and Frontend must run simultaneously
- Never commit `.env` file to Git
- Change `JWT_SECRET` in production
- For production, build the React app (`npm run build`) and serve it from Express

---

## 👨‍💼 Author

Built as a training project for future interns.

---

**Made with ❤️ for learning full-stack development**
