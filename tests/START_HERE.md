# 🚀 How to Start SAKO PMS

## Quick Start Guide

### Step 1: Start Backend Server

```bash
cd backend
npm install
npm run dev
```

**You should see:**
```
✅ MongoDB Connected: sako-pms
🚀 Server running in development mode
📡 API available at http://localhost:5000
```

### Step 2: Start Frontend (in a NEW terminal)

```bash
cd frontend
npm install
npm run dev
```

**You should see:**
```
VITE ready in XXX ms
➜  Local:   http://localhost:5173/
```

### Step 3: Open Browser

Go to: **http://localhost:5173**

You'll see the login page!

---

## First Time Setup

### 1. Create Your First Admin User

Since there's no user yet, you need to create one manually in MongoDB or use a script.

**Option A: Use MongoDB Compass/Atlas**
- Connect to your MongoDB
- Go to `sako-pms` database
- Create a user in `users` collection manually

**Option B: Create a seed script (recommended)**

I'll create a script to add your first admin user.

---

## Testing the System

1. **Login** with your admin account
2. **Create Hierarchy:**
   - Go to "Hierarchy" page
   - Create a Branch Manager
   - Create a Line Manager
   - Create Staff members

3. **Upload Plan:**
   - Go to "Plan Cascade" → "Upload Plans"
   - Upload a plan file (Excel/CSV)

4. **Map Accounts:**
   - Go to "Mapping Management"
   - Assign accounts to staff

5. **Log Tasks:**
   - Login as Staff
   - Go to "Tasks" → "Add New Task"
   - Submit a task

6. **Approve Tasks:**
   - Login as Sub-Team Leader/Manager
   - Go to "Tasks"
   - Approve pending tasks

---

## Troubleshooting

**Backend won't start?**
- Check MongoDB connection string in `backend/.env`
- Make sure MongoDB is accessible
- Check if port 5000 is available

**Frontend won't connect?**
- Check `frontend/.env` has correct API URL
- Make sure backend is running first
- Check browser console for errors

**Can't login?**
- Make sure you have a user in database
- Check email/password are correct
- Check backend logs for errors

