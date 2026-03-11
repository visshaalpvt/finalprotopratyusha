# ProVeloce Meet - Video Calling Application

A full-stack video calling application built with Next.js (frontend) and Express.js (backend).

## 📁 Project Structure

This project is organized as a monorepo with separate frontend and backend applications:

```
ProVeloce Meet/
├── frontend/          # Next.js frontend application
│   ├── app/          # Next.js app router pages
│   ├── components/   # React components
│   ├── hooks/        # Custom React hooks
│   ├── lib/          # Utility functions and API client
│   ├── providers/    # React context providers
│   ├── public/       # Static assets
│   └── ...
│
└── backend/          # Express.js backend API server
    └── src/
        ├── config/   # Configuration files
        ├── routes/   # API routes
        └── server.ts # Express server entry point
```

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/en) (v18 or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### Quick Start (Recommended)

1. **Install all dependencies:**
```bash
npm run install:all
```

2. **Set up environment variables:**

   **Backend** - Create a `.env` file in the `backend` directory:
   ```env
   MONGO_URI=your_mongo_uri
   CLERK_SECRET_KEY=your_clerk_secret_key
   STREAM_API_KEY=your_stream_api_key
   STREAM_SECRET_KEY=your_stream_secret_key
   PORT=5000
   FRONTEND_URL=http://localhost:3000
   ```

   **Frontend** - Create a `.env.local` file in the `frontend` directory:
   ```env
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
   NEXT_PUBLIC_STREAM_API_KEY=your_stream_api_key
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   NEXT_PUBLIC_BASE_URL=http://localhost:3000
   ```

3. **Start both frontend and backend:**
```bash
npm start
```

This will start:
- Backend API at [http://localhost:5000](http://localhost:5000)
- Frontend at [http://localhost:3000](http://localhost:3000)

### Individual Setup

If you prefer to run frontend and backend separately:

#### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables (see above)

4. Run the development server:
```bash
npm start
```

The frontend will be available at [http://localhost:3000](http://localhost:3000)

#### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables (see above)

4. Run the development server:
```bash
npm start
```

The backend API will be available at [http://localhost:5000](http://localhost:5000)

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Clerk** - Authentication
- **Stream.io** - Video calling SDK
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components

### Backend
- **Express.js** - Web framework
- **TypeScript** - Type safety
- **Clerk** - Authentication
- **Stream.io** - Video calling SDK

## 📝 Available Scripts

### Root Level (Run from project root)
- `npm start` - Start both frontend and backend in development mode
- `npm run start:prod` - Start both frontend and backend in production mode
- `npm run install:all` - Install dependencies for root, backend, and frontend
- `npm run build` - Build both frontend and backend for production

### Frontend (Run from `frontend/` directory)
- `npm start` - Start development server (Next.js dev mode)
- `npm run start:prod` - Start production server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint

### Backend (Run from `backend/` directory)
- `npm start` - Start development server with hot reload (tsx watch)
- `npm run start:prod` - Start production server (compiled JavaScript)
- `npm run build` - Compile TypeScript to JavaScript
- `npm run lint` - Run ESLint

## 📚 Documentation

For more detailed setup instructions, see:
- Frontend: `frontend/README.md`
- Backend: Check `backend/src/` for API documentation

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

