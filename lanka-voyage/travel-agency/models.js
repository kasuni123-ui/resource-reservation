'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const User = mongoose.model('User', new Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true }
}, { timestamps: true }));

const Package = mongoose.model('Package', new Schema({
  title: String, slug: { type: String, unique: true }, destination: String, category: String,
  days: Number, price: Number, rating: Number, icon: String, hue: Number, summary: String,
  itinerary: [String], includes: [String]
}));

const Booking = mongoose.model('Booking', new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  pkg: { type: Schema.Types.ObjectId, ref: 'Package', required: true },
  date: { type: Date, required: true },
  travellers: { type: Number, min: 1, max: 20, required: true },
  total: { type: Number, required: true },
  status: { type: String, default: 'pending' }
}, { timestamps: true }));

const Inquiry = mongoose.model('Inquiry', new Schema({
  name: String, email: String, message: String
}, { timestamps: true }));

module.exports = { User, Package, Booking, Inquiry };
