/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	providerDAO = require('../dao/providerDAO'),
	providerService = require('../services/providerService');

exports.getByName = function(req, res){
	var name = req.query.name;
	var departureDate = req.query.departureDate;
	var returnDate = req.query.returnDate;
	var flightId = req.query.flightId;
	providerDAO.getByName(name, function(err, search){
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			if(search){
				providerService[search.callback](res, search, flightId, departureDate, returnDate, function(err, data){
					if(err){
						var error = {
							message : err
						};
						res.status(404).json(error);
					}else{
						res.json(data);
					}
				});
			}else{
				res.status(404).send();
			}
		}
	});

};