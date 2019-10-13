var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var bookingsRouter = require('./routes/bookings');
var services = require('../pkg/services');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

const base = require('airtable').base('appdpZhhl9ZVvABFf');
const itemsSrv = new services.ItemsService(base);
const pubCalSrv = new services.PubCalendarService(base);
const timeslotsSrv = new services.TimeSlotsService(base, itemsSrv, pubCalSrv);
const bookingSrv = new services.BookingService(base, timeslotsSrv, pubCalSrv);

app.use('/bookings', bookingsRouter(bookingSrv, itemsSrv, timeslotsSrv));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
