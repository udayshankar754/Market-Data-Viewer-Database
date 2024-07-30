import { Router } from 'express';
import {  uploadDhanDataToDbGroww } from '../controllers/groww.controllers.js';


const router = Router();


router.route("/uploadToDb").post(uploadDhanDataToDbGroww)

export default router