const jwt = require('jsonwebtoken');
const md5 = require('md5');

const UserModel = require('./user.model');
const ValidatorUtils = require('../../utils/validator');
const CommonUtils = require('../../utils/common');

class Auth {
  static async loginValidator(req, res, next) {
    req.checkBody('email', 'Email not valid.').notEmpty().isEmail();
    req.checkBody('password', 'Password not valid').notEmpty();
    return await ValidatorUtils.errorMapped(req, res, next);
  }

  static async login(req, res) {
    const {email, password} = req.body;
    const passwordMd5 = md5(password);
    try {
      const user = await UserModel.find({
        where: {
          email,
          password: passwordMd5
        }
      });
      if (!user) {
        throw new Error('Missing or invalid authentication credentials.');
      }
      return res.json({
        id: user.id,
        token: jwt.sign({email, password: passwordMd5}, process.env.secret)
      });
    } catch (err) {
      return CommonUtils.catchError(res, err);
    }
  }

  static authValidator(role = 0) {
    return async (req, res, next) => {
      let token = req.body.token || req.query.token || req.headers['x-auth-token'];

      if (token) {
        return jwt.verify(token, process.env.secret, async (err, decoded) => {
          if (err) {
            return res.status(401).json({
              reason: 'Failed to authenticate token.'
            });
          }

          req.user = await UserModel.find({
            when: {
              id: decoded._id
            }
          });

          if (!req.user) {
            return res.status(401).json({
              reason: 'Failed to authenticate token.'
            });
          }

          if (req.user.role < role) {
            return res.status(401).json({
              reason: 'Permission denied.'
            });
          }

          return next();
        });
      }

      return res.status(400).json({
        reason: 'No token provided.'
      });
    }
  }
}

module.exports = Auth;
