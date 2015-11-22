'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

/**
 * Airport Schema
 */
var AirportSchema = new Schema({
	id: Schema.Types.ObjectId,
	airportCode : String
});

mongoose.model('Airport', AirportSchema);