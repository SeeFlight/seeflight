'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

/**
 * Flight Schema
 */
var PriceSchema = new Schema({
	id: Schema.Types.ObjectId,
	deeplink: String,
	provider: String,
	currency : String,
	price: Number
});

mongoose.model('Price', PriceSchema);