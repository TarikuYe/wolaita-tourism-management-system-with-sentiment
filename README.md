# Project212 - Wolaita Tourism Platform 🗺️

A comprehensive tourism management platform for exploring Wolaita, Ethiopia with advanced sentiment analysis capabilities.

## 🚀 Features

### For Tourists
- Browse attractions, hotels, and cultural experiences
- Book tours with secure payment integration
- Submit reviews and ratings
- Favorite tours for later
- Multi-language support

### For Agencies
- Create and manage tour offerings
- View sentiment analytics and reviews
- Track bookings and revenue
- Dashboard insights

### For Cashiers
- Process payments and bookings
- Verify transactions
- Manage booking statuses

### For Admins
- Complete user management (create/delete users)
- Sentiment analysis and review moderation
- System-wide analytics and insights
- Automated welcome emails
- User authentication and role management

## 🏗️ Tech Stack

### Frontend
- React + TypeScript
- Vite
- TailwindCSS
- Firebase (Auth, Firestore, Storage)
- React Router
- Framer Motion

### Backend
- Node.js + Express (Auth, Emails, Admin)
- Python Flask (Sentiment Analysis ML)
- Firebase Admin SDK
- Nodemailer (Email delivery)
- Chapa Payment Gateway

### Machine Learning
- Sentiment Analysis Model (scikit-learn)
- TF-IDF Vectorizer
- Real-time review analysis

## 📁 Project Structure

```
Project212/
├── backend/
│   ├── app.js              # Node.js Express server
│   ├── app.py              # Flask ML API
│   ├── services/
│   │   ├── firebaseAdmin.js
│   │   └── mailer.js
│   ├── routes/
│   │   ├── user.routes.js  # Admin user management
│   │   └── payment.routes.js
│   ├── models/             # ML models
│   └── requirements.txt
├── src/
│   ├── components/
│   │   ├── Admin/          # Admin components
│   │   ├── Analytics/      # Sentiment analytics
│   │   ├── Auth/
│   │   └── ...
│   ├── pages/
│   │   ├── Dashboard/      # Role-based dashboards
│   │   └── ...
│   ├── hooks/
│   │   └── useSentimentAnalysis.ts
│   └── config/
│       └── firebase.ts
└── vite.config.ts          # Vite proxy config
```

## 🛠️ Setup & Installation

### Prerequisites
- Node.js 18+
- Python 3.11+
- Firebase project
- Gmail account (for email)

### Local Development

1. **Clone repository**
   ```bash
   git clone https://github.com/Tariku1921/project212-wolaita-tourism.git
   cd project212-wolaita-tourism
   ```

2. **Install dependencies**
   ```bash
   # Frontend
   npm install
   
   # Backend (Node)
   cd backend && npm install
   
   # Backend (Python)
   pip install -r requirements.txt
   ```

3. **Configure environment**
   - Copy `.env.example` to `.env` in root
   - Copy `.env.example` to `backend/.env`
   - Add Firebase credentials
   - Add Gmail app password

4. **Run services**
   ```bash
   # Terminal 1 - Frontend (port 5173)
   npm run dev
   
   # Terminal 2 - Node backend (port 3001)
   cd backend && npm start
   
   # Terminal 3 - Flask ML API (port 5000)
   cd backend && python app.py
   ```

## 🌐 Deployment

### Sentiment API (PythonAnywhere)
1. **Sign up at** [PythonAnywhere.com](https://www.pythonanywhere.com) (free tier available)
2. **Upload your files:**
   - Go to Files tab
   - Upload your entire project or use `git clone` in Bash console
   - Ensure `backend/` folder with `app.py` and `models/` are uploaded
3. **Install dependencies in Bash console:**
   ```bash
   cd ~/mysite
   pip3.11 install --user -r backend/requirements.txt
   ```
4. **Configure WSGI file:**
   - Go to Web tab → Add a new web app → Flask → Python 3.11
   - Edit the WSGI file (e.g., `/var/www/YOUR_USERNAME_pythonanywhere_com_wsgi.py`)
   - Add the application loader:
     ```python
     import sys, os
     sys.path.insert(0, '/home/YOUR_USERNAME/mysite/backend')
     os.chdir('/home/YOUR_USERNAME/mysite/backend')
     from app import app as application
     ```
5. **Set Source code and Working directory:**
   - Source code: `/home/YOUR_USERNAME/mysite`
   - Working directory: `/home/YOUR_USERNAME/mysite/backend`
6. **Reload your web app**
7. **Get your URL:** `https://YOUR_USERNAME.pythonanywhere.com`

### Node Backend (Still use Render/Vercel/Railway)
- Use Render, Vercel, Railway, or similar for Node.js backend
- Set build: `npm install --prefix backend`
- Set start: `node backend/app.js`
- Add environment variables

### Frontend (Vercel)
1. Import repo to Vercel
2. Set framework: Vite
3. Add environment variables
4. Deploy

## 🔐 Environment Variables

### Frontend (.env)
```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_SENTIMENT_API_URL=     # Production: PythonAnywhere URL (e.g., https://username.pythonanywhere.com/analyze)
```

### Backend (backend/.env)
```
EMAIL_USER=
EMAIL_PASS=                 # Gmail app password
FRONTEND_URL=
```

## 📊 Sentiment Analysis

Reviews are automatically analyzed for:
- **Positive** sentiment
- **Neutral** sentiment  
- **Negative** sentiment

Confidence scores help moderators identify critical reviews needing attention.

## 🎯 User Roles

- **Tourist** - Browse, book, review
- **Agency** - Manage tours, view analytics
- **Cashier** - Process payments
- **Admin** - Full system access, user management

## 🔒 Security

- Firebase Authentication
- Role-based access control
- Secure admin endpoints
- Email verification
- JWT tokens

## 📝 License

MIT License - see LICENSE file

## 👥 Contributors

Tariku Negesa

## 🙏 Acknowledgments

- Wolaita tourism community
- Firebase
- PythonAnywhere & Vercel
- Chapa Payment Gateway
