const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load env vars
dotenv.config();

// Import Routes
const authRoutes = require('./routes/auth');
const dataRoutes = require('./routes/data'); // <--- Pastikan ini ada
const reportRoutes = require('./routes/report');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// --- REGISTER ROUTES ---
app.use('/api/auth', authRoutes);
app.use('/api/data', dataRoutes); // <--- PASTIKAN BARIS INI ADA DI SINI
app.use('/api/report', reportRoutes);

// Root Check
app.get('/', (req, res) => {
  res.send('Server PeduliKucing is Running...');
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});