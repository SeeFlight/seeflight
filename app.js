'use strict';
/**
 * Module dependencies.
 */
var mongoose = require('mongoose');
var app = require('./config/init')();
var properties = require('./services/propertiesLoader.js')(app);

// Bootstrap db connection
var db = mongoose.connect(app.locals.db, function(err) {
	if (err) {
		console.error('Could not connect to MongoDB!');
	}
});

// Start the app by listening on <port>
app.listen(app.locals.localPort);