'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

/**
 * Flight Schema
 */
var FlightSchema = new Schema({
	id: Schema.Types.ObjectId,
	requestDate:Date,
	origin: String,
	destination: String,
	lengthOfStay:Number,
	departureDate: Date,
	returnDate:Date,
	lowestFare:Number,
	currencyCode:String,
	pointOfSaleCountry:String,
	seeflightId: Number,
	daysToDeparture:Number,
	daysToReturn:Number
});

mongoose.model('Flight', FlightSchema);