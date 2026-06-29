import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import config from './config/config.js';
import apiRouter from './routes/index.js';
import globalErrorHandler from './middleware/errorMiddleware.js';

const app = express();

// Apply security headers
app.use(helmet());

// Configure CORS
app.use(cors({
  origin: config.corsOrigin,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// HTTP Request logging
if (config.env === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Enable payload parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount all API endpoints
app.use('/api', apiRouter);

// Catch all unregistered endpoints
app.use((req, res, next) => {
  const error = new Error(`Endpoint not found: [${req.method}] ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
});

// Attach global error capture handler
app.use(globalErrorHandler);

export default app;
