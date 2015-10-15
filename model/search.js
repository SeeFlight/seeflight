'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	Flight = mongoose.model('Flight').schema,
	Schema = mongoose.Schema;

/**
 * Flight Schema
 */
var SearchSchema = new Schema({
	id:Schema.Types.ObjectId,
	requestDate:String,
	origin: String,
	destination: String,
	flights : [Flight]
});

mongoose.model('Search', SearchSchema);