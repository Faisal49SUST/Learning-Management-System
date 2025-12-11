# How to Install and Start MongoDB on Windows

## 🚨 MongoDB is Not Installed

MongoDB is not currently installed on your system. Here's how to install and start it:

## Option 1: Install MongoDB Community Edition (Recommended)

### Step 1: Download MongoDB

1. Go to: https://www.mongodb.com/try/download/community
2. Select:
   - **Version**: 7.0.x (Current)
   - **Platform**: Windows
   - **Package**: MSI
3. Click **Download**

### Step 2: Install MongoDB

1. Run the downloaded `.msi` file
2. Choose **Complete** installation
3. **IMPORTANT**: Check "Install MongoDB as a Service"
4. Keep the default service name: `MongoDB`
5. Click **Next** and **Install**

### Step 3: Start MongoDB

After installation, MongoDB will start automatically as a service.

To verify it's running:
```powershell
Get-Service MongoDB
```

To start it manually (if stopped):
```powershell
net start MongoDB
```

To stop it:
```powershell
net stop MongoDB
```

---

## Option 2: Use MongoDB Atlas (Cloud - No Installation)

If you don't want to install MongoDB locally, use MongoDB Atlas (free cloud database):

### Step 1: Create Account
1. Go to: https://www.mongodb.com/cloud/atlas/register
2. Sign up for free

### Step 2: Create Cluster
1. Choose **FREE** tier (M0)
2. Select a cloud provider and region
3. Click **Create Cluster**

### Step 3: Get Connection String
1. Click **Connect** on your cluster
2. Choose **Connect your application**
3. Copy the connection string
4. It looks like: `mongodb+srv://username:password@cluster.mongodb.net/`

### Step 4: Update Your .env File
Replace the MongoDB URI in your `.env` file:
```
MONGODB_URI=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/lms-system
```

---

## Option 3: Quick Install with Chocolatey

If you have Chocolatey package manager:

```powershell
# Install Chocolatey first (if not installed)
# Run PowerShell as Administrator
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Install MongoDB
choco install mongodb

# Start MongoDB
mongod
```

---

## Option 4: Manual Installation (Advanced)

### Download and Extract
1. Download MongoDB from: https://www.mongodb.com/try/download/community
2. Extract to `C:\mongodb`

### Create Data Directory
```powershell
mkdir C:\data\db
```

### Start MongoDB Manually
```powershell
C:\mongodb\bin\mongod.exe --dbpath C:\data\db
```

Keep this terminal open while using the database.

---

## ✅ Verify MongoDB is Running

After installation, test the connection:

```powershell
# Try to connect
mongosh
# or
mongo
```

If you see a MongoDB shell prompt, it's working! 🎉

---

## 🚀 For Your LMS Project

### If Using Local MongoDB:

1. **Start MongoDB** (one of these):
   ```powershell
   # If installed as service
   net start MongoDB
   
   # OR if manual installation
   mongod
   ```

2. **Keep `.env` as is**:
   ```
   MONGODB_URI=mongodb://localhost:27017/lms-system
   ```

3. **Start your backend**:
   ```powershell
   npm run dev
   ```

### If Using MongoDB Atlas (Cloud):

1. **Update `.env`**:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/lms-system
   ```

2. **Start your backend** (no need to run mongod):
   ```powershell
   npm run dev
   ```

---

## 🐛 Troubleshooting

### "mongod is not recognized"
- MongoDB is not installed or not in PATH
- Follow Option 1 above to install

### "Access is denied" when starting service
- Run PowerShell or Command Prompt as **Administrator**
- Right-click → "Run as administrator"

### Port 27017 already in use
- MongoDB is already running
- Check with: `Get-Process mongod`
- Or just proceed with your backend

### Connection refused
- MongoDB is not running
- Start it with one of the methods above

---

## 📝 Quick Start Commands

**Check if MongoDB is installed:**
```powershell
mongod --version
```

**Check if MongoDB service is running:**
```powershell
Get-Service MongoDB
```

**Start MongoDB service:**
```powershell
net start MongoDB
```

**Connect to MongoDB:**
```powershell
mongosh
# or
mongo
```

---

## 💡 Recommendation for Your Project

**For Development/Testing:**
- Use **MongoDB Atlas** (Option 2) - Easiest, no installation needed

**For Production/Showcasing:**
- Install **MongoDB Community Edition** (Option 1) - Full control, works offline

Choose the option that works best for you and follow the steps above!
