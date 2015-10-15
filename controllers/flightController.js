/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	Flight = mongoose.model('Flight'),
	Search = mongoose.model('Search'),
	_ = require('lodash');
	seeflightService = require('../services/seeflightService');

exports.getAllByCriteria = function(req, res){
	var origin = req.query.origin;
	var destination = req.query.destination;

	var query  = Search.where({ 
		origin : req.query.origin,
		destination : req.query.destination,
		requestDate : {
			$gt:new Date().getTime()-req.app.locals.cacheDuration
		} 
	});
	query.findOne(function (err, search) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			if(search){
				res.json(JSON.stringify(search));
			}else{
				seeflightService.getAndStoreFlights(res, origin, destination, function(err, data){
					if(err){
						res.json(err);
					}else{
						res.json(JSON.stringify(data));
					}
				});
			}
		}
	});
};