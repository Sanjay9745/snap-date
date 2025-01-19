const express = require('express');
const userController = require('./users');
const userAuth = require('../../middlewares/userAuth');
const router = express.Router();


router.post('/createOrFind', userController.createOrFind);
router.get('/getUsers', userAuth, userController.getUsers);
router.get('/getUser', userAuth, userController.getUser);
router.put('/updateLocation', userAuth, userController.updateLocation);
router.get('/protected', userAuth, userController.protected);
router.post('/updateUser',userAuth, userController.updateUser);
router.delete('/deleteUser',userAuth, userController.deleteUser);

module.exports = router;