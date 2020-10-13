var auth = require('basic-auth');
var compare = require('tsscmp');

function bookingCredsMiddleware(bookingSrv) {
    return async (req, res, next) => {
        var id = req.params.id;
        const b = await bookingSrv.get(req.params.id);
        var userName = b.get('MieterEmail')[0];
        var pin = b.get('PIN');
        res.locals.customerUserName = userName;
        res.locals.pin = pin
        next()
      }
}

function basicAuth(validUser, validPass) {
    return (req, res, next) => {
      var credentials = auth(req);
  
      if (!credentials || !check(credentials.name, credentials.pass, validUser, validPass)) {
        res.statusCode = 401;
        res.setHeader('WWW-Authenticate', 'Basic realm="example"');
        res.end('Access denied');
      } else {
        next();
      }
    }
  }
  
  function check(providedUserame, providedPass, validUsername, validPass) {
    var valid = true;
  
    valid = compare(providedUserame, validUsername) && valid;
    valid = compare(providedPass, validPass) && valid;
  
    return valid;
  }

  const asyncMiddleware = fn => (req, res, next) => {
    console.log(fn);
    Promise.resolve(fn(req, res, next)).catch(next);
  };

  module.exports = {
    asyncMiddleware: asyncMiddleware,
    bookingCredsMiddleware: bookingCredsMiddleware,
    basicAuthMiddleware: basicAuth
  };