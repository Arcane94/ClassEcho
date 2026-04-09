// Aggregated route table that mounts each backend route group under a single router.
const express = require('express');
const sessionRoutes = require('./sessions');
const teacherRoutes = require('./teacherObservations');
const studentRoutes = require('./studentObservations');
const userRoutes = require('./user');
const visualizationRoutes = require('./visualization');

const router = express.Router();

router.use('/user', userRoutes);
router.use('/sessions', sessionRoutes);
router.use('/observations/teacher', teacherRoutes);
router.use('/observations/student', studentRoutes);
router.use('/visualization', visualizationRoutes);

module.exports = router;
