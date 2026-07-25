# TRIGONLINKS PASRUR - ISP Management ERP

A professional, modern ERP system for ISP (Internet Service Provider) management built with React, TypeScript, Node.js, Express, and Firebase.

## Tech Stack

### Frontend
- **React.js** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Vite** - Build tool
- **React Router** - Client-side routing
- **Lucide React** - Icons
- **Firebase SDK** - Authentication and Firestore

### Backend
- **Node.js** - Runtime
- **Express.js** - Web framework
- **TypeScript** - Type safety
- **Firebase Admin** - Server-side Firebase integration
- **Express Validator** - Request validation
- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing
- **Compression** - Response compression
- **Morgan** - HTTP request logger

### Database & Authentication
- **Firebase Firestore** - NoSQL database
- **Firebase Authentication** - User authentication

### Deployment
- **Firebase Hosting** - Frontend hosting
- **Firebase Functions** (optional) - Backend hosting

## Project Structure

```
trigonlinks-erp/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── contexts/       # React contexts (Auth)
│   │   ├── pages/          # Page components
│   │   ├── types/          # TypeScript type definitions
│   │   ├── App.tsx         # Main app component
│   │   ├── main.tsx        # Entry point
│   │   ├── firebase.ts     # Firebase configuration
│   │   └── index.css       # Global styles
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── tsconfig.json
│   └── tsconfig.node.json
└── backend/
    ├── src/
    │   ├── routes/         # Express route handlers
    │   │   ├── customers.ts
    │   │   ├── packages.ts
    │   │   ├── connections.ts
    │   │   ├── invoices.ts
    │   │   ├── inventory.ts
    │   │   ├── staff.ts
    │   │   ├── expenses.ts
    │   │   └── newCustomers.ts
    │   ├── index.ts         # Server entry point
    │   └── firebase-service-account.json  # Firebase admin credentials
    ├── package.json
    ├── tsconfig.json
    └── .env.example
```

## Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Firebase account** (for Firebase project setup)

## Setup Instructions

### 1. Firebase Project Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing one
3. Enable **Authentication** (Email/Password provider)
4. Enable **Firestore Database**
5. Go to Project Settings → Service Accounts → Generate Private Key
6. Save the JSON file as `backend/src/firebase-service-account.json`
7. Copy your Firebase config from Project Settings → General → Your apps

### 2. Environment Configuration

#### Frontend
Create `frontend/.env` file:
```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

#### Backend
Create `backend/.env` file:
```env
PORT=5000
FIREBASE_DATABASE_URL=https://your-project-id.firebaseio.com
```

### 3. Installation

#### Install Frontend Dependencies
```bash
cd frontend
npm install
```

#### Install Backend Dependencies
```bash
cd backend
npm install
```

### 4. Running the Application

#### Start Backend Server
```bash
cd backend
npm run dev
```
Backend will run on `http://localhost:5000`

#### Start Frontend Development Server
```bash
cd frontend
npm run dev
```
Frontend will run on `http://localhost:5173`

### 5. Building for Production

#### Build Frontend
```bash
cd frontend
npm run build
```

#### Build Backend
```bash
cd backend
npm run build
```

#### Start Production Backend
```bash
cd backend
npm start
```

## Features

### Customer Management
- Add new customers
- View all customers
- View active customers
- View suspended customers
- Edit customer details
- Delete customers

### Package Management
- Add new packages
- View all packages
- Edit package details
- Delete packages

### New Customers
- Add new customer requests
- View all new customers
- Track new customer expenses
- Track new customer collections

### Additional Modules (To be implemented)
- Connections management
- Invoicing and billing
- Inventory management
- Staff management
- Expense tracking
- Area management
- Complaints handling
- Reports and analytics

## API Endpoints

### Customers
- `GET /api/customers` - Get all customers
- `GET /api/customers/:id` - Get single customer
- `POST /api/customers` - Create customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### Packages
- `GET /api/packages` - Get all packages
- `GET /api/packages/:id` - Get single package
- `POST /api/packages` - Create package
- `PUT /api/packages/:id` - Update package
- `DELETE /api/packages/:id` - Delete package

### New Customers
- `GET /api/new-customers/expenses` - Get all expenses
- `POST /api/new-customers/expenses` - Create expense
- `DELETE /api/new-customers/expenses/:id` - Delete expense
- `GET /api/new-customers/collections` - Get all collections
- `POST /api/new-customers/collections` - Create collection
- `DELETE /api/new-customers/collections/:id` - Delete collection

## Deployment

### Firebase Hosting Deployment

1. Install Firebase CLI:
```bash
npm install -g firebase-tools
```

2. Login to Firebase:
```bash
firebase login
```

3. Initialize Firebase in the project:
```bash
cd frontend
firebase init hosting
```

4. Build the frontend:
```bash
npm run build
```

5. Deploy:
```bash
firebase deploy
```

## License

This project is proprietary to TRIGONLINKS PASRUR.

## Support

For support, contact the development team at TRIGONLINKS PASRUR.
