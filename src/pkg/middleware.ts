import auth from 'basic-auth';
import { NextFunction, Request, RequestHandler, Response } from 'express';
import compare from 'tsscmp';

function bookingCredsMiddleware(bookingSrv: any) {
    return async (req: Request, res: Response, next: NextFunction) => {
        var id = req.params.id;
        const b = await bookingSrv.get(req.params.id);
        var userName = b.get('MieterEmail')[0];
        var pin = b.get('PIN');
        res.locals.customerUserName = userName;
        res.locals.pin = pin
        next()
      }
}

function authMiddleware(validUser: string, validPass: string, tryCookie: boolean) {
    return (req: Request, res: Response, next: NextFunction) => {
      var credentials = null;
      if(tryCookie && req.cookies && req.cookies['cs-creds']) {
        const basicAuthCreds = Buffer.from(req.cookies['cs-creds'], 'base64').toString('utf8');
        const c = basicAuthCreds.split(':');
        credentials = { name: c[0], pass: c[1] };
      } else {
        credentials = auth(req);
      }
  
      if (!credentials || !check(credentials.name, credentials.pass, validUser, validPass)) {
        res.statusCode = 401;
        res.setHeader('WWW-Authenticate', 'Basic realm="Glesi21"');
        res.end('Access denied');
      } else {
        next();
      }
    }
  }
  
  function check(providedUserame: string, providedPass: string, validUsername: string, validPass:string): boolean {
    var valid = true;
  
    valid = compare(providedUserame, validUsername) && valid;
    valid = compare(providedPass, validPass) && valid;
  
    return valid;
  }

  const asyncMiddleware = (fn: (rq: Request, rs: Response, n: NextFunction) => any): (req: Request, res: Response, next: NextFunction) => void => {
    return (req: Request, res: Response, next: NextFunction) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  };

 export {
    asyncMiddleware,
    bookingCredsMiddleware,
    authMiddleware
  };