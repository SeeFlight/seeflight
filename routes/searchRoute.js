'use strict';

module.exports = function(app) {
	var searches = require('../controllers/searchController');
	
	app.route('/searches').get(searches.getAllByCriteria);
	app.route('/searches/:searchId/flights/:flightId/prices').get(searches.getFlightProviderByName);
};
