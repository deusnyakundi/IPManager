const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

// Middleware to check admin role
const isAdmin = (req, res, next) => {
  console.log('User in request:', req.user); // Debug log
  console.log('User role:', req.user?.role); // Debug log
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

router.use(authenticateToken);

router.get('/', userController.getUsers);
router.post('/', userController.createUser);
router.put('/:id', isAdmin, userController.updateUser);
router.delete('/:id', userController.deleteUser);
router.post('/:id/toggle-2fa', isAdmin, userController.toggle2FA);

module.exports = router;