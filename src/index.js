import dotenv from "dotenv"
import { app } from "./app.js"
import connectDB from "./db/index.js"

dotenv.config({
    path:'./.env'
})


connectDB()

.then(()=>{
    app.on("error",(error)=>{
        console.log("Err: ",error);
        throw error
    })
})

app.listen(process.env.PORT || 8000,()=>{
    console.log(`Server is Running at port : ${process.env.PORT}`)
})

app.get('/',(req,res)=>res.send("API Working Correctly"))
