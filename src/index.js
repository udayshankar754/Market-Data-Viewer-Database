import { connectDatabase } from './db/db.js';
import dotenv from 'dotenv';
import  {app } from './app.js';
dotenv.config({
    path : './.env'
});

connectDatabase()
.then(
    () => {
        app.listen(process.env.PORT || 3000 , () => {
            console.log(`${process.env.DB_NAME} server listening on port ${process.env.PORT || 3000}`);
        });
    }
)
.catch(err => console.error("Mongo db Connection Failed",err));
