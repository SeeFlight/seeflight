var propertiesReader = require('properties-reader');

module.exports = function(app){
	var properties = propertiesReader(__dirname + '/properties/seeflight.'+process.env.ENV+'.properties');
	app.locals.distantHost = properties.get('distantHost');
	app.locals.distantPort = properties.get('distantPort');
	app.locals.localHost = properties.get('localHost');
	app.locals.localPort = properties.get('localPort');
	app.locals.cookieSecretKey = properties.get('cookieSecretKey');
	app.locals.localSecurePort = properties.get('localSecurePort');
	app.locals.protocole = properties.get('protocole');
	app.locals.certificateKey = properties.get('certificateKey');
	app.locals.certificateCert = properties.get('certificateCert');
	app.locals.trustExternalCARoot = properties.get('trustExternalCARoot');
	app.locals.comodoRSAAddTrustCA = properties.get('comodoRSAAddTrustCA');
	app.locals.extendedValidationSecureServerCA = properties.get('extendedValidationSecureServerCA');
	app.locals.db = properties.get('db');
};