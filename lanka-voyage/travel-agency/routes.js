'use strict';
const crypto = require('crypto');
const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Package, Booking, Inquiry } = require('./models');

const SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');
if (!process.env.JWT_SECRET) console.warn('JWT_SECRET not set: using a temporary secret. Logins reset on restart.');
const isProd = process.env.NODE_ENV === 'production';

const str = (v, max = 200) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const emailOk = e => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);
const wrap = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const bad = (res, msg, code = 400) => res.status(code).json({ error: msg });

function startSession(res, user) {
  const token = jwt.sign({ id: user._id }, SECRET, { expiresIn: '2h' });
  res.cookie('token', token, { httpOnly: true, sameSite: 'strict', secure: isProd, maxAge: 2 * 60 * 60 * 1000 });
}

const auth = wrap(async (req, res, next) => {
  try {
    const { id } = jwt.verify(req.cookies.token || '', SECRET);
    req.user = await User.findById(id);
  } catch (e) { req.user = null; }
  if (!req.user) return bad(res, 'Please log in first.', 401);
  next();
});

/* ---------- Auth ---------- */
router.post('/auth/register', wrap(async (req, res) => {
  const name = str(req.body.name, 80), email = str(req.body.email).toLowerCase(), password = str(req.body.password, 72);
  if (name.length < 2) return bad(res, 'Enter your name.');
  if (!emailOk(email)) return bad(res, 'Enter a valid email address.');
  if (password.length < 8) return bad(res, 'Password must be at least 8 characters.');
  if (await User.findOne({ email })) return bad(res, 'An account with this email already exists.', 409);
  try {
    const user = await User.create({ name, email, password: await bcrypt.hash(password, 10) });
    startSession(res, user);
    res.status(201).json({ name: user.name, email: user.email });
  } catch (e) {
    if (e.code === 11000) return bad(res, 'An account with this email already exists.', 409);
    throw e;
  }
}));

router.post('/auth/login', wrap(async (req, res) => {
  const email = str(req.body.email).toLowerCase(), password = str(req.body.password, 72);
  const user = email && password ? await User.findOne({ email }) : null;
  if (!user || !(await bcrypt.compare(password, user.password))) return bad(res, 'Email or password is incorrect.', 401);
  startSession(res, user);
  res.json({ name: user.name, email: user.email });
}));

router.post('/auth/logout', (req, res) => { res.clearCookie('token'); res.json({ ok: true }); });

router.get('/auth/me', wrap(async (req, res) => {
  try {
    const { id } = jwt.verify(req.cookies.token || '', SECRET);
    const u = await User.findById(id);
    return res.json(u ? { name: u.name, email: u.email } : null);
  } catch (e) { return res.json(null); }
}));

/* ---------- Packages ---------- */
router.get('/packages', wrap(async (req, res) => {
  const filter = {};
  const q = str(req.query.q, 60), category = str(req.query.category, 30), maxPrice = Number(req.query.maxPrice);
  if (q) {
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ title: rx }, { destination: rx }, { summary: rx }];
  }
  if (category) filter.category = category;
  if (maxPrice > 0) filter.price = { $lte: maxPrice };
  const sort = req.query.sort === 'price' ? { price: 1 } : { rating: -1 };
  res.json(await Package.find(filter).sort(sort).select('-itinerary -includes -__v').lean());
}));

router.get('/packages/:slug', wrap(async (req, res) => {
  const p = await Package.findOne({ slug: str(req.params.slug, 80) }).select('-__v').lean();
  if (!p) return bad(res, 'Package not found.', 404);
  res.json(p);
}));

/* ---------- Bookings ---------- */
router.post('/bookings', auth, wrap(async (req, res) => {
  const pkg = await Package.findOne({ slug: str(req.body.slug, 80) });
  if (!pkg) return bad(res, 'Package not found.', 404);
  const date = new Date(str(req.body.date, 10));
  const travellers = parseInt(req.body.travellers, 10);
  if (isNaN(date.getTime()) || date <= new Date()) return bad(res, 'Choose a future travel date.');
  if (!(travellers >= 1 && travellers <= 20)) return bad(res, 'Travellers must be between 1 and 20.');
  const b = await Booking.create({ user: req.user._id, pkg: pkg._id, date, travellers, total: pkg.price * travellers });
  res.status(201).json({ id: b._id, total: b.total, status: b.status });
}));

router.get('/bookings/me', auth, wrap(async (req, res) => {
  const list = await Booking.find({ user: req.user._id }).populate('pkg', 'title destination').sort('-createdAt').lean();
  res.json(list.map(b => ({
    id: b._id, title: b.pkg ? b.pkg.title : 'Package no longer available',
    date: b.date, travellers: b.travellers, total: b.total, status: b.status
  })));
}));

/* ---------- Inquiries ---------- */
router.post('/inquiries', wrap(async (req, res) => {
  const name = str(req.body.name, 80), email = str(req.body.email), message = str(req.body.message, 1500);
  if (name.length < 2) return bad(res, 'Enter your name.');
  if (!emailOk(email)) return bad(res, 'Enter a valid email address.');
  if (message.length < 10) return bad(res, 'Tell us a little more about your trip (10 characters minimum).');
  await Inquiry.create({ name, email, message });
  res.status(201).json({ ok: true });
}));

module.exports = router;
