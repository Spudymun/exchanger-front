# Bull Board Basic Auth Setup

## ✅ What Was Added

Basic Authentication for Bull Board Dashboard to secure queue monitoring in production.

---

## 🔐 Authentication Logic

```javascript
// Development (default password):
- Auth DISABLED if password is "admin123"
- Quick access for local development

// Production (custom password):
- Auth ENABLED automatically
- Requires valid credentials
```

---

## 🔑 Credentials Configuration

### Development (docker-compose.yml):

```yaml
environment:
  - BULL_BOARD_USER=${BULL_BOARD_USER:-admin}
  - BULL_BOARD_PASSWORD=${BULL_BOARD_PASSWORD:-admin123}
```

**Default:** `admin` / `admin123` (no auth in dev)

### Production (docker-compose.production.yml):

```yaml
environment:
  - BULL_BOARD_USER=${BULL_BOARD_USER:-admin}
  - BULL_BOARD_PASSWORD=${BULL_BOARD_PASSWORD} # REQUIRED!
```

**Required:** Must set `BULL_BOARD_PASSWORD` in `.env`

---

## 📝 Setup Instructions

### 1. Create `.env` file:

```bash
# Development (optional)
BULL_BOARD_USER=admin
BULL_BOARD_PASSWORD=admin123

# Production (REQUIRED!)
BULL_BOARD_USER=your_username
BULL_BOARD_PASSWORD=your_secure_password_here
```

### 2. Access Bull Board:

```
Development: http://localhost:3010
Production:  http://your-domain:3010

Login: your_username
Password: your_secure_password_here
```

---

## 🛡️ Security Features

✅ **Basic Auth Middleware** - express-basic-auth  
✅ **Challenge Mode** - Browser shows login prompt  
✅ **Unauthorized Logging** - Failed attempts logged  
✅ **Custom Realm** - "Bull Board Dashboard - Authentication Required"  
✅ **Auto-Enable in Production** - Can't disable accidentally

---

## ⚠️ Important Notes

1. **Always set strong password in production!**
2. Use HTTPS in production (reverse proxy like Nginx)
3. Monitor unauthorized access attempts in logs
4. Consider IP whitelisting for additional security

---

## 📊 Access Flow

```
User → http://localhost:3010
     ↓
Basic Auth Prompt appears
     ↓
User enters credentials
     ↓
✅ Valid → Bull Board UI
❌ Invalid → 401 Unauthorized (logged)
```

---

## 🔧 Troubleshooting

### Can't login?

```bash
# Check credentials in container
docker exec exchanger-bull-board env | grep BULL_BOARD

# Check logs
docker logs exchanger-bull-board | grep AUTH
```

### Auth not working in dev?

```bash
# Auth is DISABLED with default password
# Set custom password to enable:
BULL_BOARD_PASSWORD=mypassword123 docker-compose up bull-board-dashboard
```

---

## 📦 Dependencies Added

```json
{
  "dependencies": {
    "express-basic-auth": "^1.2.1"
  }
}
```

Make sure to run:

```bash
cd apps/bull-board-dashboard
npm install
```

---

## ✅ Verification

After setup, check logs:

```bash
docker logs exchanger-bull-board | grep "BASIC_AUTH"

# Should see:
# {"level":"info","message":"BASIC_AUTH_ENABLED","user":"admin","env":"production"}
```
