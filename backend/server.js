require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/categories', require('./src/routes/categoryRoutes'));
app.use('/api/users', require('./src/routes/userRoutes'));
app.use('/api/freelancers', require('./src/routes/freelancerRoutes'));
app.use('/api/gigs', require('./src/routes/gigRoutes'));
app.use('/api/orders', require('./src/routes/orderRoutes'));
app.use('/api/briefs', require('./src/routes/briefRoutes'));
app.use('/api/messages', require('./src/routes/messageRoutes'));

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
