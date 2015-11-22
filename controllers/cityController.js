/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	cityDAO = require('../dao/cityDAO');

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