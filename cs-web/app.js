var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var apiRouter = require('./routes/api-router');
var bookingsRouter = require('./routes/router');
var services = require('../pkg/services');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

const base = require('airtable').base('appdpZhhl9ZVvABFf');
const personSrv = new services.PersonService(base);
const itemsSrv = new services.ItemsService(base);
const timeslotsSrv = new services.TimeSlotsService(base, itemsSrv);
const bookingSrv = new services.BookingService(
  base,
  timeslotsSrv,
  personSrv,
  itemsSrv
);

app.use('/api', apiRouter(bookingSrv, itemsSrv, timeslotsSrv));
app.use(
  '/bookings',
  bookingsRouter(bookingSrv, itemsSrv, timeslotsSrv, personSrv)
);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  //console.error(err.)
  console.error(err.stack);
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
