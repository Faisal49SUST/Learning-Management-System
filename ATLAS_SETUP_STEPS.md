# MongoDB Atlas Setup Guide - Step by Step

## 🚀 Follow These Steps

### Step 1: Create MongoDB Atlas Account

1. **I've opened the registration page for you in the browser**
2. You can either:
   - **Sign up with Google** (fastest)
   - **Sign up with email** (fill in the form)

### Step 2: Complete Registration

1. After signing up, you'll be asked a few questions:
   - **Goal**: Select "Learn MongoDB"
   - **Experience**: Select your level (any option is fine)
   - Click **Finish**

### Step 3: Create a FREE Cluster

1. You'll see "Deploy a cloud database"
2. Choose **M0 FREE** tier (it's highlighted)
   - ✅ 512 MB Storage
   - ✅ Shared RAM
   - ✅ No credit card required
3. **Provider**: Choose any (AWS, Google Cloud, or Azure)
4. **Region**: Choose closest to you (or leave default)
5. **Cluster Name**: Leave as "Cluster0" or name it "LMS-Cluster"
6. Click **Create** button

⏱️ Wait 1-3 minutes for cluster creation...

### Step 4: Set Up Database Access (Security)

After cluster is created:

1. Click **Database Access** in left sidebar (under Security)
2. Click **+ ADD NEW DATABASE USER**
3. **Authentication Method**: Username and Password
4. **Username**: `lmsadmin` (or any name you like)
5. **Password**: Click "Autogenerate Secure Password" or create your own
   - ⚠️ **IMPORTANT**: Copy and save this password!
6. **Database User Privileges**: Select "Read and write to any database"
7. Click **Add User**

### Step 5: Set Up Network Access

1. Click **Network Access** in left sidebar (under Security)
2. Click **+ ADD IP ADDRESS**
3. Click **ALLOW ACCESS FROM ANYWHERE** (for development)
   - This adds `0.0.0.0/0`
   - ⚠️ For production, you'd restrict this
4. Click **Confirm**

### Step 6: Get Your Connection String

1. Click **Database** in left sidebar
2. Click **Connect** button on your cluster
3. Choose **Drivers**
4. **Driver**: Node.js
5. **Version**: 5.5 or later
6. **Copy the connection string** - it looks like:
   ```
   mongodb+srv://lmsadmin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

### Step 7: Update Your .env File

1. Replace `<password>` in the connection string with your actual password
2. Add `/lms-system` before the `?` to specify database name
3. Your final connection string should look like:
   ```
   mongodb+srv://lmsadmin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/lms-system?retryWrites=true&w=majority
   ```

4. Update your `.env` file:
   ```
   MONGODB_URI=mongodb+srv://lmsadmin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/lms-system?retryWrites=true&w=majority
   ```

### Step 8: Test the Connection

1. Save your `.env` file
2. In terminal, run:
   ```bash
   npm run dev
   ```
3. You should see: "✅ MongoDB connected successfully"

---

## 📋 Quick Checklist

- [ ] Create MongoDB Atlas account
- [ ] Create FREE M0 cluster
- [ ] Add database user (username + password)
- [ ] Add network access (0.0.0.0/0)
- [ ] Get connection string
- [ ] Update .env file
- [ ] Test connection

---

## 🎯 Your Connection String Format

```
mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/lms-system?retryWrites=true&w=majority
```

Replace:
- `USERNAME`: Your database username (e.g., lmsadmin)
- `PASSWORD`: Your database password
- `CLUSTER`: Your cluster address (e.g., cluster0.abc123.mongodb.net)

---

## ✅ Once Connected

After successful connection, you can:
1. Start your backend: `npm run dev`
2. Start your frontend: `cd client && npm start`
3. Your app will automatically create the database and collections!

---

## 🐛 Troubleshooting

**"Authentication failed"**
- Check your username and password in connection string
- Make sure you replaced `<password>` with actual password

**"Connection timeout"**
- Check Network Access settings
- Make sure 0.0.0.0/0 is added

**"MongoServerError"**
- Check if cluster is fully created (wait a few minutes)
- Verify connection string format

---

## 💡 Pro Tip

You can view your database data in MongoDB Atlas:
1. Click **Database** → **Browse Collections**
2. See all your data in real-time
3. Perfect for debugging and showcasing!

---

Follow the steps above and let me know when you get your connection string!
