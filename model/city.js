'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	Airport = mongoose.model('Airport').schema,
	Schema = mongoose.Schema;

/**
 * City Schema
 */
var CitySchema = new Schema({
	id: Schema.Types.ObjectId,
	cityCode : String,
	cityName : [String],
	pointOfSale : String,
	airports : [Airport]
}, { collection: 'cities' });

mongoose.model('City', CitySchema);