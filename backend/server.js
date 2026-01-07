const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load env vars
dotenv.config();

// Import Routes
const authRoutes = require('./routes/auth');
const dataRoutes = require('./routes/data');
const reportRoutes = require('./routes/report');
const shelterRoutes = require('./routes/shelter');
const chatRoutes = require('./routes/chat'); 

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Middleware Logger
app.use((req, res, next) => {
  console.log(`[REQUEST] ${req.method} ${req.url}`);
  next();
});

// --- REGISTER ROUTES ---
app.use('/api/auth', authRoutes);

// [FIX] KEMBALIKAN KE '/api/data' SUPAYA DASHBOARD TIDAK HILANG
app.use('/api/data', dataRoutes); 

app.use('/api/report', reportRoutes);
app.use('/api/shelter', shelterRoutes);
app.use('/api/chat', chatRoutes);

// Root Check
app.get('/', (req, res) => {
  res.send('Server PeduliKucing is Running...');
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});