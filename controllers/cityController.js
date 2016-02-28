/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	cityDAO = require('../dao/cityDAO');
var sabreAPIService = require('../services/sabreAPIService');

exports.getByCity = function(req, res){
	var city = req.query.city;

	cityDAO.getByCity(city, function(err, search){
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			if(search){
				res.json(search);
			}else{
				res.status(404).send();
			}
		}
	});

};

exports.processCities = function(req, res){
	var airports = [];
	sabreAPIService.getPointOfSaleCountries(res, false, function(err, resp, data){
		if(resp.statusCode === 200){
			data = JSON.parse(data);
			var counter = data.Countries.length;
			for(var i=0; i<data.Countries.length; i++){
				sabreAPIService.findAirport(res, false, function(err, resp, dataAirports){
					counter--;
					if(resp.statusCode === 200){
						dataAirports = JSON.parse(dataAirports);
						for(var j=0; j<dataAirports.OriginDestinationLocations.length; j++){
							var foundInOrigin = false;
							var foundInDestination = false;
							var k =0;
							while(k<airports.length && !foundInOrigin){
								if(airports[k].AirportCode === dataAirports.OriginDestinationLocations[j].OriginLocation.AirportCode){
									foundInOrigin = true;
								}
								k++;
							}
							if(!foundInOrigin){
								airports.push(dataAirports.OriginDestinationLocations[j].OriginLocation); 
							} 
							k=0;
							while(k<airports.length && !foundInDestination){
								if(airports[k].AirportCode === dataAirports.OriginDestinationLocations[j].DestinationLocation.AirportCode){
									foundInDestination = true;
								}
								k++;
							}
							if(!foundInDestination){
								airports.push(dataAirports.OriginDestinationLocations[j].DestinationLocation); 
							} 
						}
						checkAirports(counter);
					}else{
						console.error("error : "+resp.statusCode);
					}
				}, data.Countries[i].CountryCode);
			}
		}
	});

	function checkAirports(counter){
		if(counter === 0){
			var mapAirport = {};
			for(var i=0;i<airports.length;i++){
				if(!mapAirport[airports[i].CityName]){
					var airport = {
						cityCode : airports[i].AirportCode,
						cityName : [airports[i].CityName],
						pointOfSale : airports[i].CountryCode,
						airports : [{
							airportCode : airports[i].AirportCode
						}]
					};
					mapAirport[airports[i].CityName] = airport;
				}else{
					mapAirport[airports[i].CityName].airports.push({airportCode : airports[i].AirportCode});
				}
			}
			for(var k in mapAirport){
				if(mapAirport.hasOwnProperty(k)){
					(function(airport){
						cityDAO.getByCity(airport.cityName, function(err, search){
							if (err) {
								return res.status(400).send({
									message: errorHandler.getErrorMessage(err)
								});
							} else {
								if(!search){
									cityDAO.addCity(airport, function(err, city){
										if(err){
											var error = {
												message : err
											};
											res.status(404).json(error);
										}else{
											res.status(201).send();
										}
									});
								}
							}
						});
					})(mapAirport[k]);
				}
			}

			res.end();
		}
	}
};