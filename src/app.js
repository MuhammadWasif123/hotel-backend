import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import indexRoutes from "./routes/index.route.js"


const app = express()


app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}))

app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({extended:true,limit:"16kb"}))
app.use(express.static("public"))
app.use(cookieParser())


// This is the index route
app.use("/api/v1/",indexRoutes)

export {app}

