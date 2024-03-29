import express, { Express, Request, Response } from 'express';

import path from 'path'
import cookieParser from 'cookie-parser' 
import logger from 'morgan'

var apiRouter = require('./routes/api-router');
var bookingsRouter = require('./routes/router');
var services = require('./pkg/services');
import winston from 'winston'
import expressWinston from 'express-winston'
import airtable, {Base} from 'airtable'

var app: Express = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


const base = airtable.base(process.env.AIRTABLE_BASE_ID!);
const personSrv = new services.PersonService(base);
const itemsSrv = new services.BookableItemsService(base);
const timeslotsSrv = new services.TimeSlotsService(base, itemsSrv);
const invoiceSrv = new services.InvoiceService(base, itemsSrv);
const bookingSrv = new services.BookingService(
  base,
  timeslotsSrv,
  personSrv,
  invoiceSrv
);
expressWinston.responseWhitelist.push('body');
app.use(expressWinston.logger({
  transports: [
    new winston.transports.Console()
  ],
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.json(),
    winston.format.timestamp()
  ),
  meta: true, // optional: control whether you want to log the meta data about the request (default to true)
  msg: "HTTP {{req.method}} {{req.url}}", // optional: customize the default logging message. E.g. "{{res.statusCode}} {{req.method}} {{res.responseTime}}ms {{req.url}}"
  expressFormat: true, // Use the default Express/morgan request formatting. Enabling this will override any msg if true. Will only output colors with colorize set to true
  colorize: true, // Color the text and status code, using the Express/morgan color palette (text: gray, status: default green, 3XX cyan, 4XX yellow, 5XX red).
}));
app.use('/api', apiRouter(bookingSrv, itemsSrv, personSrv, invoiceSrv, timeslotsSrv));
app.use(
  '/bookings',
  bookingsRouter(bookingSrv, invoiceSrv, timeslotsSrv, personSrv)
);

export {app};
