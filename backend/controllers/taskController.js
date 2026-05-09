const Task = require('../models/Task');
const Project = require('../models/Project');

// Helper: check membership
const isMember = (project, userId) => {
  const isOwner = project.owner.toString() === userId.toString();
  const inMembers = project.members.some(m => m.user.toString() === userId.toString());
  return isOwner || inMembers;
};

// @GET /api/tasks/project/:projectId
const getTasksByProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });
    if (req.user.role !== 'admin' && !isMember(project, req.user._id)) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const tasks = await Task.find({ project: req.params.projectId })
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @GET /api/tasks/my-tasks
const getMyTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ assignedTo: req.user._id })
      .populate('project', 'name color')
      .populate('createdBy', 'name')
      .sort({ dueDate: 1, createdAt: -1 });

    res.json({ success: true, tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @GET /api/tasks/dashboard
const getDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    const matchQuery = req.user.role === 'admin'
      ? {}
      : { assignedTo: req.user._id };

    const [stats, recent, overdue] = await Promise.all([
      Task.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),
      Task.find({ ...matchQuery })
        .populate('project', 'name color')
        .populate('assignedTo', 'name')
        .sort({ createdAt: -1 })
        .limit(5),
      Task.find({ ...matchQuery, dueDate: { $lt: now }, status: { $ne: 'done' } })
        .populate('project', 'name color')
        .populate('assignedTo', 'name')
        .sort({ dueDate: 1 })
        .limit(5)
    ]);

    const statsMap = { todo: 0, 'in-progress': 0, done: 0 };
    stats.forEach(s => { statsMap[s._id] = s.count; });
    const total = statsMap.todo + statsMap['in-progress'] + statsMap.done;

    res.json({
      success: true,
      stats: { total, ...statsMap, overdue: overdue.length },
      recentTasks: recent,
      overdueTasks: overdue
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @POST /api/tasks
const createTask = async (req, res) => {
  try {
    const { title, description, project, assignedTo, status, priority, dueDate, tags } = req.body;
    if (!title || !project) {
      return res.status(400).json({ success: false, message: 'Title and project are required.' });
    }

    const proj = await Project.findById(project);
    if (!proj) return res.status(404).json({ success: false, message: 'Project not found.' });
    if (req.user.role !== 'admin' && !isMember(proj, req.user._id)) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const task = await Task.create({
      title, description, project, assignedTo: assignedTo || null,
      status: status || 'todo', priority: priority || 'medium',
      dueDate: dueDate || null, tags: tags || [],
      createdBy: req.user._id
    });

    await task.populate('assignedTo', 'name email');
    await task.populate('createdBy', 'name email');
    res.status(201).json({ success: true, message: 'Task created.', task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @PUT /api/tasks/:id
const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });

    // Members can only update their own tasks' status
    const isAdmin = req.user.role === 'admin';
    const isAssignee = task.assignedTo && task.assignedTo.toString() === req.user._id.toString();
    const isCreator = task.createdBy.toString() === req.user._id.toString();

    if (!isAdmin && !isAssignee && !isCreator) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const { title, description, assignedTo, status, priority, dueDate, tags } = req.body;

    if (isAdmin || isCreator) {
      if (title) task.title = title;
      if (description !== undefined) task.description = description;
      if (assignedTo !== undefined) task.assignedTo = assignedTo || null;
      if (priority) task.priority = priority;
      if (dueDate !== undefined) task.dueDate = dueDate || null;
      if (tags) task.tags = tags;
    }
    // Everyone can update status
    if (status) task.status = status;

    await task.save();
    await task.populate('assignedTo', 'name email');
    await task.populate('createdBy', 'name email');
    res.json({ success: true, message: 'Task updated.', task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @DELETE /api/tasks/:id
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });

    const isAdmin = req.user.role === 'admin';
    const isCreator = task.createdBy.toString() === req.user._id.toString();
    if (!isAdmin && !isCreator) {
      return res.status(403).json({ success: false, message: 'Only admins or task creators can delete tasks.' });
    }

    await Task.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Task deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getTasksByProject, getMyTasks, getDashboardStats, createTask, updateTask, deleteTask };
