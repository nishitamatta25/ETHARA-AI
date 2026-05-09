const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/role');
const { getAllUsers, updateRole, deleteUser } = require('../controllers/userController');

router.get('/', protect, adminOnly, getAllUsers);
router.put('/:id/role', protect, adminOnly, updateRole);
router.delete('/:id', protect, adminOnly, deleteUser);

module.exports = router;
