'use strict';

module.exports = function(app) {
	var userController = require('../controllers/userController');
	
	app.route('/users').post(userController.addUser);
};
