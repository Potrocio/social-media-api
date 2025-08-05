const express = require('express')
const usersController = require('../controllers/usersController')



const usersRouter = express.Router();

usersRouter.post('/signup', usersController.createUser)
usersRouter.post('/login', usersController.AuthenticateUser)
usersRouter.get('/:id/dashboard', usersController.authenticateToken,)
usersRouter.get('/:id/friends', usersController.authenticateToken,)
usersRouter.get('/:id/messages', usersController.authenticateToken,)
usersRouter.patch('/:id/settings', usersController.authenticateToken, usersController.updateUserSettings)
usersRouter.get('/:id', usersController.authenticateToken, usersController.retrieveUser)


module.exports = usersRouter;