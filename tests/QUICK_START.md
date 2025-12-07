# 🚀 Quick Start Guide

## MongoDB Connection ✅
Already configured with your credentials!

## Default Admin Account ✅
Created! Use these to login:
- **Email:** admin@sako.com
- **Password:** admin123

---

## How to Run

### Option 1: Run Both Servers (Recommended)

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Option 2: Use Start Script
```bash
./start.sh
```

---

## Access the System

1. **Open browser:** http://localhost:5173
2. **Login with:**
   - Email: `admin@sako.com`
   - Password: `admin123`

---

## First Steps After Login

1. **Create Your Team:**
   - Go to "Hierarchy" page
   - Create Branch Manager
   - Create Line Manager
   - Create Sub-Team Leader
   - Create Staff members

2. **Upload a Plan:**
   - Go to "Plan Cascade" → "Upload Plans"
   - Upload Excel file with goals

3. **Map Accounts:**
   - Go to "Mapping Management"
   - Assign customer accounts to staff

4. **Start Logging Tasks:**
   - Login as Staff
   - Go to "Tasks" → "Add New Task"
   - Submit daily work

---

## What Each Role Can Do

**HQ Admin:**
- Create any user
- Upload plans
- View everything
- Upload CBS files

**Branch Manager:**
- Create Line Managers and Sub-Team Leaders
- Approve tasks
- Manage mappings
- View team performance

**Line Manager:**
- Create Sub-Team Leaders and Staff
- Approve tasks
- View sub-team performance

**Sub-Team Leader:**
- Create Staff accounts
- Approve staff tasks
- View team tasks

**Staff:**
- Log daily tasks
- View own performance
- View own mapped accounts

---

## Testing Checklist

- [ ] Login works
- [ ] Can create users in hierarchy
- [ ] Can upload plan
- [ ] Can map accounts
- [ ] Can log tasks
- [ ] Can approve tasks
- [ ] Can see dashboards
- [ ] Performance scores calculate

---

## Troubleshooting

**Backend not starting?**
- Check `backend/.env` file exists
- Check MongoDB connection string
- Check port 5000 is free

**Frontend not connecting?**
- Check backend is running first
- Check `frontend/.env` has correct API URL
- Check browser console for errors

**Can't login?**
- Make sure you ran `npm run seed` in backend
- Use: admin@sako.com / admin123
- Check backend logs for errors

