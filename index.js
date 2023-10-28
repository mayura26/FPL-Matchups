const express = require('express');
const apiRoutes = require('./apiRoutes');  // Import the API routes
const path = require('path');

const app = express();
const PORT = 3001;

app.use('/api', apiRoutes);  // Use the API routes

// Serve static files from the React frontend app
app.use(express.static(path.join(__dirname, 'client/build')));

// Anything that doesn't match the above routes, send back the index.html file
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname + '/client/build/index.html'));
});

app.listen(process.env.PORT || PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
