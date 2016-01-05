'use strict';

module.exports = function(app) {
	var providerController = require('../controllers/providerController');
	
	app.route('/providers').get(providerController.getByName);
};
