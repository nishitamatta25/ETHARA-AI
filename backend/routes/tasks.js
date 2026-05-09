const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getTasksByProject, getMyTasks, getDashboardStats,
  createTask, updateTask, deleteTask
} = require('../controllers/taskController');

router.get('/dashboard', protect, getDashboardStats);
router.get('/my-tasks', protect, getMyTasks);
router.get('/project/:projectId', protect, getTasksByProject);
router.post('/', protect, createTask);
router.put('/:id', protect, updateTask);
router.delete('/:id', protect, deleteTask);

module.exports = router;
