/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	Flight = mongoose.model('Flight'),
	Search = mongoose.model('Search'),
	_ = require('lodash'),
	seeflightService = require('../services/seeflightService'),
	providerService = require('../services/providerService'),
	providerDAO = require('../dao/providerDAO'),
	cityDAO = require('../dao/cityDAO'),
	searchDAO = require('../dao/searchDAO'),
	moment = require('moment');

exports.getAllByCriteria = function(req, res){
	var origin = req.query.origin.toUpperCase();
	var destination = req.query.destination.toUpperCase();
	var pointOfSale = req.query.pointOfSale.toUpperCase();
	var errorMessage;

	if(origin && destination && pointOfSale){
		searchDAO.getByOriginAndDestination(origin, destination, {$gt:new Date().getTime()-req.app.locals.cacheDuration}, function(err, search){
			if (err) {
				return res.status(400).send({
					message: errorHandler.getErrorMessage(err)
				});
			} else {
				if(search){
					res.json(search);
				}else{
					seeflightService.getAndStoreFlights(res, origin, destination, pointOfSale, function(err, data){
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
};

exports.getFlightProviderByName = function(req, res){
	var provider = req.query.provider;
	var flightId = req.params.flightId;
	var searchId = req.params.searchId;
	searchDAO.getFlightProvider(searchId, flightId, provider, function(err, search){
		if(err){
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		}else{
			if(search){
				var i=0;
				var found = false;
				while(i<search.flights[0].prices.length && !found){
					if(search.flights[0].prices[i].provider === provider){
						found = true;
					}
					i++;
				}
				if(found){
					res.json(search.flights[0].prices.splice(i-1, 1));
				}else{
					res.status(404).send();
				}
			}else{
				providerDAO.getByName(provider, function(err, search){
					if (err) {
						return res.status(400).send({
							message: errorHandler.getErrorMessage(err)
						});
					} else {
						if(search){
							providerService[search.callback](res, search, searchId, flightId, function(err, data){
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
			}
		}
	});
};