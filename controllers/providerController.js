/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	providerDAO = require('../dao/providerDAO'),
	providerService = require('../services/providerService');

exports.getByName = function(req, res){
	var name = req.query.name;
	var flightId = req.query.flightId;
	providerDAO.getByName(name, function(err, search){
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			if(search){
				providerService[search.callback](res, search, flightId);
			}else{
				res.status(404).send();
			}
		}
	});

};