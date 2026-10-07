const authService = require('../services/authService');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');

const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  success(res, 201, result);
});

const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  success(res, 200, result);
});

const me = asyncHandler(async (req, res) => {
  const user = await authService.getMe(req.user.id);
  success(res, 200, user);
});

const logout = asyncHandler(async (req, res) => {
  // Stateless JWT: logout is handled client-side by discarding the token.
  success(res, 200, { message: 'Logged out' });
});

module.exports = { register, login, me, logout };
