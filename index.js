const express = require('express');
const apiRoutes = require('./apiRoutes');  // Import the API routes

const app = express();
const PORT = 3001;

app.use('/api', apiRoutes);  // Use the API routes

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
