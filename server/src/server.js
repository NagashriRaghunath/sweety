const app = require('./app');

const PORT = process.env.PORT || 5000;
app.listen(PORT, (err) => {
  if (err) {
    console.error(`Could not start server on port ${PORT}:`, err.message);
    process.exit(1);
  }
  console.log(`Sweety API running on http://localhost:${PORT}`);
});