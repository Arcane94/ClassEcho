const express = require('express');
const sessionRoutes = require('./sessions');
const teacherRoutes = require('./teacherObservations');
const studentRoutes = require('./studentObservations');
const userRoutes = require('./user');

const router = express.Router();

router.use('/user', userRoutes);
router.use('/sessions', sessionRoutes);
router.use('/observations/teacher', teacherRoutes);
router.use('/observations/student', studentRoutes);

module.exports = router;
