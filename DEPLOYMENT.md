# 🚀 XENOTRIX Deployment Guide

Follow these steps to deploy your application to **MongoDB Atlas**, **Render**, and **Vercel**.

---

## 🍃 1. MongoDB Atlas (Database)

1.  **Create an Account**: [mongodb.com/atlas](https://www.mongodb.com/cloud/atlas/register)
2.  **Create a Cluster**: Choose the "Shared" (Free) tier.
3.  **Network Access**: Go to "Network Access" and click "Add IP Address". Select **"Allow Access from Anywhere"** (0.0.0.0/0).
4.  **Database User**: Go to "Database Access" and create a user with "Read and Write to any database" permissions.
5.  **Connection String**: Click "Connect" -> "Drivers" -> Copy the connection string.
    - _Example:_ `mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority`
    - _Note:_ Replace `<password>` with your actual password.

---

## 🌍 2. Render (Backend)

1.  **Create an Account**: [render.com](https://render.com/)
2.  **New Web Service**: Click "New" -> "Web Service".
3.  **Connect Repo**: Connect your GitHub repository.
4.  **Configuration**:
    - **Name**: `xenotrix-backend` (or your choice)
    - **Environment**: `Node`
    - **Build Command**: `npm install`
    - **Start Command**: `npm start`
5.  **Environment Variables**:
    - `MONGODB_URI`: _Your MongoDB connection string_
    - `JWT_SECRET`: _A long random string_
    - `FRONTEND_URL`: `https://your-app-name.vercel.app` (You'll get this from Vercel later)
    - `NODE_ENV`: `production`
6.  **Deploy**: Once configured, Render will deployment. Note the URL (e.g., `https://xenotrix-backend.onrender.com`).

---

## ⚡ 3. Vercel (Frontend)

1.  **Create an Account**: [vercel.com](https://vercel.com/)
2.  **Import Project**: Click "Add New" -> "Project" -> Import your GitHub repo.
3.  **Project Settings**:
    - **Root Directory**: Select `client`.
    - **Framework Preset**: `Vite`
4.  **Environment Variables**:
    - `VITE_API_URL`: `https://your-backend-name.onrender.com/api` (The URL from Render + `/api`)
5.  **Deploy**: Click "Deploy". Your frontend will be live at a URL like `https://xenotrix-agency-os.vercel.app`.

---

## 🔗 4. Final Connection

Once Vercel gives you your frontend URL, go back to your **Render Web Service settings** and update the `FRONTEND_URL` environment variable with your actual Vercel URL. This ensures CORS works correctly.

---

## 🛠️ Post-Deployment

- Use your newly deployed URL to access the app!
- Remember that the free tier of Render "sleeps" after 15 minutes of inactivity; your first request might take 30-60 seconds to wake it up.
