import express from 'express';
import mongoose from 'mongoose';
import 'dotenv/config';
import cors from 'cors';
import dns from 'node:dns/promises';
import { initializeFirebase } from './config/firebase.js';
import { createServer } from 'http';
import { Server } from 'socket.io';
import morgan from 'morgan';

// Initialize Firebase
initializeFirebase();

// Initialize Cron Jobs
import './services/cronService.js';

dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const buildMongoConnectionUri = async (rawUri) => {
  if (!rawUri || !rawUri.startsWith('mongodb+srv://')) {
    return rawUri;
  }

  try {
    const parsed = new URL(rawUri);
    const srvHost = parsed.hostname;
    const srvRecords = await dns.resolveSrv(`_mongodb._tcp.${srvHost}`);
    const txtRecords = await dns.resolveTxt(srvHost).catch(() => []);

    if (!srvRecords.length) {
      throw new Error(`No SRV records found for ${srvHost}`);
    }

    const hosts = srvRecords
      .sort((a, b) => a.priority - b.priority || a.weight - b.weight)
      .map((record) => `${record.name}:${record.port}`)
      .join(',');

    const txtOptions = txtRecords
      .flat()
      .map((entry) => entry.trim())
      .filter(Boolean)
      .join('&');

    const directUri = `mongodb://${parsed.username}:${parsed.password}@${hosts}${parsed.pathname}${txtOptions ? `?${txtOptions}` : ''}`;
    console.log(`[DB] Resolved MongoDB Atlas SRV to direct hosts: ${hosts}`);
    return directUri;
  } catch (error) {
    console.warn(`[DB] Failed to resolve MongoDB SRV manually, falling back to original URI. Reason: ${error.message}`);
    return rawUri;
  }
};




const app = express();
const server = createServer(app); // Create HTTP server
const PORT = process.env.PORT || 5000;

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'https://nowstay.in',
      'https://nowstay.in',
      'https://www.nowstay.in',
      'nowstay.in'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
  }
});

// Socket.io Logic
io.on('connection', (socket) => {
  console.log('🔌 New Client Connected:', socket.id);

  // User joins a tracking room (e.g., their booking ID or just a hotel room)
  socket.on('join_tracking', (room) => {
    socket.join(room);
    console.log(`User ${socket.id} joined room: ${room}`);
  });

  // User emits location updates
  socket.on('update_location', (data) => {
    const { room, location } = data;
    // Broadcast to others in the room (e.g., Hotel Dashboard)
    socket.to(room).emit('live_location_update', location);
    // console.log(`Location update from ${socket.id} in ${room}:`, location);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Security Headers for Mobile App WebView (Camera & Base64 support)
app.use((req, res, next) => {
  res.setHeader('Permissions-Policy', 'camera=(self "https://nowstay.in" "https://www.nowstay.in"), microphone=(self "https://nowstay.in" "https://www.nowstay.in")');
  // Support base64 images (data:) and blobs
  res.setHeader('Content-Security-Policy', "img-src 'self' data: https: blob:; connect-src 'self' data: https: http:; frame-src 'self' https:;");
  next();
});

// Middleware
app.use(morgan('dev'));
// Middleware to log request start
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] Incoming Request: ${req.method} ${req.url}`);
  next();
});

// Dynamic CORS to allow local network IPs (192.168.x.x) and localhost.
// IMPORTANT: CORS must run BEFORE the body parsers so cross-origin requests are
// handled/rejected before the server reads the entire request body.
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Check if origin is localhost or local network IP
    const allowedOrigins = [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'https://nowstay.in',
      'https://www.nowstay.in',
      'https://now-stay.vercel.app'
    ];
    // Add 172.16-31 range (often used by hotspots) and 10.x
    const isLocalNetwork =
      origin.startsWith('http://192.168.') ||
      origin.startsWith('http://10.') ||
      origin.startsWith('http://172.');

    if (allowedOrigins.indexOf(origin) !== -1 || isLocalNetwork) {
      callback(null, true);
    } else {
      console.log('Blocked by CORS:', origin); // Log blocked origin for debugging
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], // Added OPTIONS
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import offerRoutes from './routes/offerRoutes.js';
import walletRoutes from './routes/walletRoutes.js';
import infoRoutes from './routes/infoRoutes.js';
import contactRoutes from './routes/contactRoutes.js';
import propertyRoutes from './routes/propertyRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import availabilityRoutes from './routes/availabilityRoutes.js';
import hotelRoutes from './routes/hotelRoutes.js';
import referralRoutes from './routes/referralRoutes.js';
import faqRoutes from './routes/faqRoutes.js';
import partnerRoutes from './routes/partnerRoutes.js';
import blogRoutes from './routes/blogRoutes.js';
import subscriptionRoutes from './routes/subscriptionRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';

// Fail fast if the database is not connected, instead of letting requests
// hang until the socket timeout (~60s) and tripping the frontend timeout.
// mongoose readyState: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting.
app.use('/api', (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    console.warn(`⚠️ DB not ready (state ${mongoose.connection.readyState}) - rejecting ${req.method} ${req.originalUrl}`);
    return res.status(503).json({
      success: false,
      message: 'Service temporarily unavailable, please try again in a moment.'
    });
  }
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/info', infoRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/hotels', hotelRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/faqs', faqRoutes);
app.use('/api/partners', partnerRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/categories', categoryRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  // Blocked cross-origin requests are expected noise (bots, other domains).
  // Return a clean 403 without dumping a full stack trace on every hit.
  if (err && err.message === 'Not allowed by CORS') {
    return res.status(403).json({ success: false, message: 'Origin not allowed' });
  }
  console.error('❌ Global Error Handler:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});


// Basic Route
app.get('/', (req, res) => {
  res.send({ message: 'NowStay API is running successfully' });
});

// MongoDB Connection Options with retry logic
const mongoOptions = {
  serverSelectionTimeoutMS: 10000, // Fail server selection after 10s instead of 30s
  connectTimeoutMS: 10000,
  socketTimeoutMS: 30000,          // Fail a stuck socket before the 60s frontend timeout
  maxIdleTimeMS: 30000,            // Recycle idle sockets sooner so NAT/firewall-dropped connections don't linger in the pool (fixes intermittent hangs)
  family: 4,                       // Use IPv4, skip trying IPv6
  maxPoolSize: 10,
  minPoolSize: 2,
  retryWrites: true,
  retryReads: true,
};

// Database Connection with Retry Logic
const connectWithRetry = async (retries = 5, delay = 5000) => {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`🔄 Attempting MongoDB connection... (Attempt ${i + 1}/${retries})`);

      await mongoose.connect(
        process.env.MONGODB_URL || "mongodb+srv://rukkooin:rukkooin@cluster0.6mzfrnp.mongodb.net/?appName=Cluster0",
        mongoOptions
      );

      console.log('✅ MongoDB connected successfully');

      // Debug: Check Admin counts
      const adminCount = await mongoose.connection.db.collection('admins').countDocuments();
      const userCount = await mongoose.connection.db.collection('users').countDocuments();
      console.log(`📊 DB Status - Admins: ${adminCount}, Users: ${userCount}`);

      // Start server only after successful DB connection
      server.listen(PORT, () => {
        console.log(`🚀 Server is running on port ${PORT}`);
      });

      return; // Exit function on success
    } catch (err) {
      console.error(`? MongoDB connection attempt ${i + 1} failed:`);
      console.dir(err, { depth: null });

      if (i < retries - 1) {
        console.log(`⏳ Retrying in ${delay / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        console.error('❌ All MongoDB connection attempts failed. Please check:');
        console.error('   1. Your internet connection');
        console.error('   2. MongoDB Atlas IP whitelist (add 0.0.0.0/0 for testing)');
        console.error('   3. Your firewall/antivirus settings');
        console.error('   4. DNS settings (try flushing DNS: ipconfig /flushdns)');
        process.exit(1);
      }
    }
  }
};

// Handle MongoDB connection events
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB disconnected. Attempting to reconnect...');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err.message);
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnected successfully');
});

// Start connection
connectWithRetry();
