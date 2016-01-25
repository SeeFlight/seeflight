/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	Flight = mongoose.model('Flight'),
	Search = mongoose.model('Search'),
	_ = require('lodash');
	seeflightService = require('../services/seeflightService')
	cityDAO = require('../dao/cityDAO'),
	flightDAO = require('../dao/flightDAO');

exports.getAllByCriteria = function(req, res){
	var origin = req.query.origin;
	var destination = req.query.destination;
	var events = ["origin", "destination"];
	var originCity;
	var destinationCity;
	var errorMessage;

	cityDAO.getByCity(origin, function(err, city){
		if (err) {
			errorMessage = errorHandler.getErrorMessage(err);
			callback("origin");
		} else {
			if(city){
				originCity = city;
			}

			callback("origin");
		}
	});

	cityDAO.getByCity(destination, function(err, city){
		if (err) {
			errorMessage = errorHandler.getErrorMessage(err);
			callback("destination");
		} else {
			if(city){
				destinationCity = city;
			}

			callback("destination");
		}
	});

	function callback(event){
		var trouve = false;
		var i = 0;
		while(i<events.length && !trouve){
			if(events[i]===event){
				trouve = true;
			}
			i++;
		}
		if(trouve){
			events.splice(i-1,1);
		}
		if(events.length === 0){
			
			if(originCity && destinationCity){
				var originRegex = new RegExp('^'+originCity.cityCode+'$', 'i');
				var destinationRegex = new RegExp('^'+destinationCity.cityCode+'$', 'i');
				var originCode;
				var destinationCode;

				origin.match(originRegex) ? originCode = origin.toUpperCase() : originCode = originCity.cityCode;
				destination.match(destinationRegex) ? destinationCode = destination.toUpperCase() : destinationCode = destinationCity.cityCode;

				flightDAO.getByOriginAndDestination(originCode, destinationCode, {$gt:new Date().getTime()-req.app.locals.cacheDuration}, function(err, search){
					if (err) {
						return res.status(400).send({
							message: errorHandler.getErrorMessage(err)
						});
					} else {
						if(search){
							res.json(search);
						}else{
							seeflightService.getAndStoreFlights(res, originCode, destinationCode, originCity.pointOfSale, destinationCity.pointOfSale, function(err, data){
								if(err){
									var error = {
										message : err
									};
									res.json(error);
								}else{
									res.json(data);
								}
							});
						}
					}
				});
			}else{
				if(errorMessage){
					res.status(500).send(errorMessage);
				}else{
					res.status(400).send();
				}
			}
		}
	}
};