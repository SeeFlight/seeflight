var propertiesReader = require('properties-reader');

module.exports = function(app){
	var properties = propertiesReader(__dirname + '/../properties/seeflight.'+process.env.ENV+'.properties');
	app.locals.localPort = properties.get('localPort');
	app.locals.db = properties.get('db');
	app.locals.sabreApiPath = properties.get('sabreApiPath');
	app.locals.sabreApiKey = properties.get('sabreApiKey');
	app.locals.sabreApiSecret = properties.get('sabreApiSecret');
	app.locals.sabreApiProtocol = properties.get('sabreApiProtocol');
	app.locals.cacheDuration = properties.get('cacheDuration');
	app.locals.maxLengthOfStay = properties.get('maxLengthOfStay');
	app.locals.maxSeeflightDepartureDays = properties.get('maxSeeflightDepartureDays');
	app.locals.maxSabreAPILengthOfStay = properties.get('maxSabreAPILengthOfStay');
	app.locals.maxSabreAPILengthDepartureDates = properties.get('maxSabreAPILengthDepartureDates');
	app.locals.saleCountry = properties.get('saleCountry');
};