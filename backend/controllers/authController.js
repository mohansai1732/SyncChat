import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

export const signup = async (req, res, next) => {
  console.log('[Auth] signup: request received, body keys:', Object.keys(req.body || {}));
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      console.log('[Auth] signup: validation failed - missing name/email/password');
      return res.status(400).json({ message: 'Name, email and password are required.' });
    }
    console.log('[Auth] signup: checking if user exists for email:', email);
    const exists = await User.findOne({ email });
    if (exists) {
      console.log('[Auth] signup: user already exists');
      return res.status(400).json({ message: 'User already exists with this email.' });
    }
    console.log('[Auth] signup: creating user...');
    const user = await User.create({ name, email, password });
    const token = generateToken(user._id);
    console.log('[Auth] signup: success, userId:', user._id);
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      token,
    });
  } catch (error) {
    console.error('[Auth] signup: error', error.message, error.code || '');
    next(error);
  }
};

export const login = async (req, res, next) => {
  console.log('[Auth] login: request received');
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }
    const match = await user.comparePassword(password);
    if (!match) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }
    const token = generateToken(user._id);
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      token,
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    res.json(req.user);
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { name, avatar } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { ...(name && { name }), ...(avatar !== undefined && { avatar }) },
      { new: true }
    ).select('-password');
    res.json(user);
  } catch (error) {
    next(error);
  }
};
