'use strict';

module.exports = function(app) {
	var searches = require('../controllers/searchController');
	var cities = require('../controllers/cityController');
	
	app.route('/searches').get(searches.getAllByCriteria);
	app.route('/searches/:searchId/flights/:flightId/prices').get(searches.getFlightProviderByName);


	app.route('/cities').get(cities.processCities);
};
