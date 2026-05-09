const Project = require('../models/Project');
const Task = require('../models/Task');

// Helper: check if user is member or owner of project
const isMember = (project, userId) => {
  const isOwner = project.owner.toString() === userId.toString();
  const inMembers = project.members.some(m => m.user.toString() === userId.toString());
  return isOwner || inMembers;
};

// @GET /api/projects
const getProjects = async (req, res) => {
  try {
    const query = req.user.role === 'admin'
      ? {}
      : { $or: [{ owner: req.user._id }, { 'members.user': req.user._id }] };

    const projects = await Project.find(query)
      .populate('owner', 'name email')
      .populate('members.user', 'name email')
      .sort({ createdAt: -1 });

    // Get task counts per project
    const projectIds = projects.map(p => p._id);
    const taskCounts = await Task.aggregate([
      { $match: { project: { $in: projectIds } } },
      { $group: { _id: '$project', total: { $sum: 1 }, done: { $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] } } } }
    ]);

    const countMap = {};
    taskCounts.forEach(t => { countMap[t._id.toString()] = t; });

    const projectsWithCounts = projects.map(p => ({
      ...p.toObject(),
      taskCount: countMap[p._id.toString()]?.total || 0,
      doneCount: countMap[p._id.toString()]?.done || 0
    }));

    res.json({ success: true, projects: projectsWithCounts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @POST /api/projects
const createProject = async (req, res) => {
  try {
    const { name, description, deadline, priority, color } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Project name is required.' });

    const project = await Project.create({
      name, description, deadline, priority, color,
      owner: req.user._id,
      members: [{ user: req.user._id, role: 'admin' }]
    });

    await project.populate('owner', 'name email');
    res.status(201).json({ success: true, message: 'Project created successfully.', project });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @GET /api/projects/:id
const getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email role')
      .populate('members.user', 'name email role');

    if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });
    if (req.user.role !== 'admin' && !isMember(project, req.user._id)) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.json({ success: true, project });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @PUT /api/projects/:id
const updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });

    const { name, description, status, deadline, priority, color } = req.body;
    if (name) project.name = name;
    if (description !== undefined) project.description = description;
    if (status) project.status = status;
    if (deadline !== undefined) project.deadline = deadline;
    if (priority) project.priority = priority;
    if (color) project.color = color;

    await project.save();
    await project.populate('owner', 'name email');
    await project.populate('members.user', 'name email');
    res.json({ success: true, message: 'Project updated.', project });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @DELETE /api/projects/:id
const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });

    await Task.deleteMany({ project: project._id });
    await Project.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Project and its tasks deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @POST /api/projects/:id/members
const addMember = async (req, res) => {
  try {
    const { userId, role } = req.body;
    if (!userId) return res.status(400).json({ success: false, message: 'User ID is required.' });

    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });

    const alreadyMember = project.members.some(m => m.user.toString() === userId);
    if (alreadyMember) {
      return res.status(409).json({ success: false, message: 'User is already a member.' });
    }

    project.members.push({ user: userId, role: role || 'member' });
    await project.save();
    await project.populate('members.user', 'name email role');
    res.json({ success: true, message: 'Member added.', project });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @DELETE /api/projects/:id/members/:userId
const removeMember = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });

    if (project.owner.toString() === req.params.userId) {
      return res.status(400).json({ success: false, message: 'Cannot remove the project owner.' });
    }

    project.members = project.members.filter(m => m.user.toString() !== req.params.userId);
    await project.save();
    res.json({ success: true, message: 'Member removed.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getProjects, createProject, getProject, updateProject, deleteProject, addMember, removeMember };
