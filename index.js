require("dotenv").config()
const express = require("express")
const cors = require("cors")
const bodyParser = require("body-parser")
const path = require("path")
const fs = require("fs")
const app = express()
const PORT = process.env.PORT || 5001
const helmet = require("helmet")
const compression = require("compression")
const cluster = require("cluster")
const http = require("http")
const numCPUs = require("os").cpus().length
const morgan = require("morgan")
const rfs = require("rotating-file-stream")
const uuid = require("node-uuid")
const NodeCache = require("node-cache")
const winston = require("winston")
const responseTime = require("response-time")
const cache = new NodeCache()
const myRoute = require("./routes/route")

morgan.token("id", function getId(req) {
	return req.id
})

app.use(cors())
app.use(helmet())
// app.use(compression())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(express.static("public"))


app.use('/api/images', express.static(path.join(__dirname, 'public/image')));

// app.use(assignId)
// app.use(responseTime())

const accessLogStream = rfs.createStream("access.log", {
	interval: "1d",
	path: path.join(__dirname, "log"),
})


// helmet({
// 	crossOriginResourcePolicy: false,
// })
// app.use(
// 	morgan(":date :id :method :url :status :response-time ms", {
// 		stream: accessLogStream,
// 	}),
// )

function assignId(req, res, next) {
	req.id = uuid.v4()
	next()
}

const logger = winston.createLogger({
	level: "info",
	format: winston.format.json(),
	defaultMeta: { service: "user-service" },
	transports: [
		new winston.transports.File({ filename: "error.log", level: "error" }),
		new winston.transports.File({ filename: "combined.log" }),
	],
})

// if (process.env.NODE_ENV !== "production") {
// 	logger.add(
// 		new winston.transports.Console({
// 			format: winston.format.simple(),
// 		}),
// 	)
// }

// const handleRequest = (request, response) => {
// 	const key = request.url
// 	const cachedResponse = cache.get(key)
// 	if (cachedResponse) {
// 		console.log(`Serving from cache: ${key}`)
// 		return response.status(200).json(cachedResponse)
// 	}

// 	console.log(`Processing request: ${key}`)
// 	setTimeout(() => {
// 		const responseData = {
// 			message: "This Backend Server Created By A1UM1",
// 		}
// 		cache.set(key, responseData)
// 		console.log(`Caching response: ${key}`)
// 		return response.status(200).json(responseData)
// 	}, 1000)
// }
app.use("/api", myRoute)
app.get("*", (req, res) => {
	res.status(404).json({ message: "This Backend Server" })
})


app.listen(PORT, () => {
	console.log(`Worker ${process.pid} is up on localhost:${PORT}`)
})
