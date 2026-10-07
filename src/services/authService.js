const userRepository = require('../repositories/userRepository');
const { hashPassword, comparePassword } = require('../utils/password');
const { signAccessToken } = require('../utils/jwt');
const ApiError = require('../utils/ApiError');
const { ROLES } = require('../config/constants');

function toPublicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,
  };
}

async function register({ name, email, password, role }) {
  const existing = await userRepository.findByEmail(email);
  if (existing) {
    throw ApiError.conflict('An account with this email already exists');
  }

  const hashed = await hashPassword(password);
  const user = await userRepository.create({
    name,
    email,
    password: hashed,
    role: role === ROLES.ORGANIZER ? ROLES.ORGANIZER : ROLES.USER,
  });

  const token = signAccessToken({ sub: user.id, role: user.role });
  return { user: toPublicUser(user), token };
}

async function login({ email, password }) {
  const user = await userRepository.findByEmail(email);
  if (!user) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const valid = await comparePassword(password, user.password);
  if (!valid) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const token = signAccessToken({ sub: user.id, role: user.role });
  return { user: toPublicUser(user), token };
}

async function getMe(userId) {
  const user = await userRepository.findById(userId);
  if (!user) throw ApiError.notFound('User not found');
  return toPublicUser(user);
}

module.exports = { register, login, getMe, toPublicUser };
