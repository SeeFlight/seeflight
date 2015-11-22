'use strict';

module.exports = function(app) {
	var flights = require('../controllers/flightController');
	
	app.route('/flights').get(flights.getAllByCriteria);
};
