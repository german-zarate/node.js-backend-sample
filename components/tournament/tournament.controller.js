const ValidatorUtils = require('../../utils/validator');
const CommonUtils = require('../../utils/common');
const {BadRequestError, NotFoundError} = require('../../utils/erros.model.js');
const db = require('../../config/db');
const TournamentModel = require('./tournament.model')(db);

class Tournament {
  static async titleValidator(req, res, next) {
    req.checkBody('title', 'Title not valid.').notEmpty();
    return await ValidatorUtils.errorMapped(req, res, next);
  }

  static async add(req, res) {
    const title = req.body.title;
    try {
      let tournament = await TournamentModel.create({title});
      tournament = await TournamentModel.findById(tournament.id, {
        attributes: {exclude: ['createdAt', 'updatedAt', 'deletedAt']}
      });

      if (!tournament) {
        throw new Error('Cannot create a tournament.');
      }

      return res.status(200).json({
        tournament
      });
    } catch (err) {
      return CommonUtils.catchError(res, err);
    }
  }

  static async idValidator(req, res, next) {
    req.checkParams('id', 'Id not valid.').notEmpty().isInt();
    return await ValidatorUtils.errorMapped(req, res, next);
  }

  static async deleteById(req, res) {
    const {id} = req.params;
    try {
      const tournament = await TournamentModel.destroy({where: {id}});
      if (!tournament) {
        throw new NotFoundError(`Tournament doesn't exist.`);
      }
      return res.status(204).send();
    } catch (err) {
      return CommonUtils.catchError(res, err);
    }
  }

  static async getById(req, res) {
    const {id} = req.params;
    try {
      const tournament = await TournamentModel.findById(id, {
        attributes: {exclude: ['createdAt', 'updatedAt', 'deletedAt']}
      });
      if (!tournament) {
        throw new NotFoundError(`Tournament doesn't exist.`);
      }
      return res.status(200).send({tournament});
    } catch (err) {
      return CommonUtils.catchError(res, err);
    }
  }

  static async updateById(req, res) {
    const {id} = req.params;
    const {title} = req.body;
    try {
      await TournamentModel.update({title}, {where: {id}});
      const tournament = await TournamentModel.findById(id, {
        attributes: {
          exclude: ['updatedAt', 'createdAt', 'deletedAt']
        }
      });

      if (!tournament) {
        throw new NotFoundError(`Tournament doesn't exist.`);
      }

      return res.status(200).json({tournament});
    } catch (err) {
      return CommonUtils.catchError(res, err);
    }
  }

  static async limitOffsetValidator(req, res, next) {
    req.checkQuery('limit', 'Limit is not a number.').optional().isInt();
    req.checkQuery('offset', 'Limit is not a number.').optional().isInt();
    return await ValidatorUtils.errorMapped(req, res, next);
  }

  static async getList(req, res) {
    let options = {
      offset: +req.query.offset || 0,
      limit: +req.query.limit || 30,
      attributes: {
        exclude: ['updatedAt', 'createdAt', 'deletedAt']
      }
    };

    try {
      const tournaments = await TournamentModel.findAll(options);
      return res.status(200).json({tournaments});
    } catch (err) {
      return CommonUtils.catchError(res, err);
    }
  }

  static async start(req, res) {
    const {id} = req.params;
    try {
      let tournament = await TournamentModel.findById(id);

      if (!tournament) {
        throw new NotFoundError(`The Tournament doesn't exist.`);
      }

      if (tournament.stopDate) {
        throw new BadRequestError('The tournament has ended.');
      }

      if (tournament.startDate) {
        throw new BadRequestError('The tournament was already started.');
      }

      const result = await tournament.update({startDate: Math.floor(Date.now() / 1000)}, {returning: true});
      tournament = {
        id: result.id,
        startDate: result.startDate,
        stopDate: result.stopDate,
        title: result.title
      };
      return res.status(200).json({tournament});
    } catch (err) {
      return CommonUtils.catchError(res, err);
    }
  }

  static async stop(req, res) {
    const {id} = req.params;
    try {
      let tournament = await TournamentModel.findById(id);

      if (!tournament) {
        throw new NotFoundError(`The Tournament doesn't exist.`);
      }

      if (tournament.stopDate) {
        throw new BadRequestError('The tournament was already stopped.');
      }

      if (!tournament.startDate) {
        throw new BadRequestError(`The tournament wasn't started.`);
      }

      const result = await tournament.update({stopDate: Math.floor(Date.now() / 1000)}, {returning: true});
      tournament = {
        id: result.id,
        startDate: result.startDate,
        stopDate: result.stopDate,
        title: result.title
      };
      return res.status(200).json({tournament});
    } catch (err) {
      return CommonUtils.catchError(res, err);
    }
  }
}

module.exports = Tournament;
