import expres from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';

const app = expres();

app.use(cors({
    origin: process.env.CORS_0RIGIN,
    credentials: true,
}))

app.use(expres.json({limit : '50kb'}))
app.use(expres.urlencoded({extended : true , limit : '50kb'}))
app.use(expres.static("public"))
app.use(cookieParser())
app.use(morgan('dev'))

//routes 

import dhanRouter from './routes/dhan.routes.js';


//routes declaration
app.use("/api/v1/dhan", dhanRouter)

export {app}