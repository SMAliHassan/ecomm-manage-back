const express = require('express');
const cookieParser = require('cookie-parser');
const xss = require('xss-clean');
const helmet = require('helmet');
const cors = require('cors');
const mongoSanitize = require('express-mongo-sanitize');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const orderRoutes = require('./routes/orderRoutes');
const productRoutes = require('./routes/productRoutes');
const userRoutes = require('./routes/userRoutes');
const storeRoutes = require('./routes/storeRoutes');

const app = express();

app.use(express.json());

app.use(helmet());
app.use(mongoSanitize());

app.use(xss());

app.use(cookieParser());

if (process.env.NODE_ENV === 'production') {
  app.use(cors({ credentials: true }));
} else {
  app.use(cors({ credentials: true, origin: true }));
}

app.options('*', cors());

app.use('/api/v1/users', userRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/stores', storeRoutes);

app.use('/', express.static('build'));
app.use('/:routes/', express.static('build'));
app.use('/:routes/:more', express.static('build'));
app.use('/:routes/:more/:evenMore', express.static('build'));

app.all('*', (req, res, next) =>
  next(new AppError(404, 'This path does not exist on this server!'))
);

app.use(globalErrorHandler);

module.exports = app;
