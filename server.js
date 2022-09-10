require('dotenv').config({ path: './config.env' });

// Uncaught Exception Error
process.on('uncaughtException', err => {
  console.log(err.name, err.message, err);
  console.log('UNCAUGHT EXCEPTION! Shutting Down...');

  process.exit(1);
});

const mongoose = require('mongoose');
const app = require('./app');

const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);
mongoose
  .connect(DB)
  .then(console.log('Connection made successfully with the DB.'))
  .catch(err => {
    console.log('Error connecting to the DB');
    console.log(err.name, err.message);
  });

const port = process.env.PORT || 8000;
const server = app.listen(port, () => console.log(`Listening to port ${port}`));

// Handling Unhandled Rejections
process.on('unhandledRejection', err => {
  console.log(err);
  console.log('UNHANDLED REJECTION! Shutting Down...');

  server.close(() => process.exit(1));
});
