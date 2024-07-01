import express from 'express';
import { deleteUser, getUser, getUserListings, test, updateUser } from '../controllers/user.controller.js';
import { verifyToken } from '../utilis/verifyUser.js';

const userRouter =express.Router();

userRouter.get('/test',test);
userRouter.post('/update/:id', verifyToken, updateUser);
userRouter.delete('/delete/:id', verifyToken, deleteUser);
userRouter.get('/listings/:id', verifyToken, getUserListings);
userRouter.get('/:id', verifyToken, getUser);

export default userRouter;