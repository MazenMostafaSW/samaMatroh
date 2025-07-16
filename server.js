require('dotenv').config({ path: './config.env' }); // <-- Add this as the first line

const path = require('path');
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const compression = require('compression');
const session = require('express-session');
const MongoStore = require('connect-mongo'); // <-- add this line
const fs = require('fs');
const passport = require('passport');
const cookieParser = require('cookie-parser');

const ApiError = require('./utils/apiError');
const globalError = require('./middleware/errorMiddleware');
const dbConection = require('./config/database');

const { webhookCheckout } = require('./services/orderService');


// mount routes
const mountRoutes = require('./routes/index');


// db connection
dbConection();

// express app
const app = express();

app.use(cors());
app.options('*', cors()); // Enable pre-flight requests for all routes

// Enable compression for better performance
app.use(compression());



// Regular middlewares - AFTER the webhook route
app.use(express.json({ limit: '20kb' }));
app.use(cookieParser());

// Session middleware - MUST be before passport.initialize()
/* app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production' }
}));
 */

app.use(session({
  secret: process.env.SESSION_SECRET, // MUST be a strong, random string from environment variables!
  resave: false, // Don't save session if unmodified
  saveUninitialized: false, // Don't create session until something stored
  store: MongoStore.create({
    mongoUrl: process.env.db_URI, // The URI to your MongoDB database
    ttl: 14 * 24 * 60 * 60, // Session TTL (Time To Live) in seconds (e.g., 14 days)
    collectionName: 'sessions', // The collection name in your MongoDB for sessions
    touchAfter: 24 * 3600 // Update session in DB only once every 24 hours (or other interval)
  }),
  cookie: {
    maxAge: 14 * 24 * 60 * 60 * 1000, // Cookie TTL in milliseconds (e.g., 14 days)
    secure: process.env.NODE_ENV === 'production', // Set to true for HTTPS in production
    httpOnly: true // Prevents client-side JS from accessing the cookie
  }
}));
// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Require social auth service to set up strategies
require('./services/auth/socialAuthService');

const NODE_ENV = process.env.NODE_ENV;
if (NODE_ENV === 'development') {
  app.use(morgan('dev'))
  console.log(`mode ${NODE_ENV}`)
}

// mount routes
mountRoutes(app);

// 404 handler
app.all('*', (req, res, next) => {
  next(new ApiError(`Can't find this route: ${req.originalUrl}`, 404));
});

// global error handler
app.use(globalError);

// server
const PORT = process.env.PORT || 8000;
const HOST = '0.0.0.0'; // This is crucial for cloud platforms like Render

const server = app.listen(PORT, HOST, () => {
  console.log(`Server running on ${HOST}:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});

// handle rejections outside express
process.on('unhandledRejection', (err) => {
  console.log(`Unhandled Rejection: ${err.name} | ${err.message}`);
  server.close(() => {
    console.log('Shutting down...');
    process.exit(1);
  });
});
