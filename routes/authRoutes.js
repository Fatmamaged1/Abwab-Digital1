const express = require('express');
const {
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
} = require('../validators/authValidator');

const {
  signup,
  login,
  forgotPassword,
  verifyPassResetCode,
  resetPassword,
} = require('../services/authServices');

const router = express.Router();

router.post('/signup', registerValidator, signup);
router.post('/login', loginValidator, login);
router.post('/forgotPassword', forgotPasswordValidator, forgotPassword);
router.post('/verifyResetCode', verifyPassResetCode);
router.put('/resetPassword', resetPasswordValidator, resetPassword);

module.exports = router;