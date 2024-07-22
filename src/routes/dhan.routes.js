import { Router } from 'express';
import { uploadDhanDataToDb } from '../controllers/dhan.controllers.js';


const router = Router();


router.route("/uploadToDb").post(uploadDhanDataToDb)

export default router