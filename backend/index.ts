import express, { Request, Response, NextFunction } from 'express'
import path from 'path'
import morgan from 'morgan'
import mongoose from 'mongoose'
import bodyParser from 'body-parser'
import expressLayouts from 'express-ejs-layouts'
import Shopify from '@shopify/shopify-api'
require('dotenv').config()

const { DB_URL, API_SECRET_KEY } = process.env

import routes from './routes'
import auth from './auth'
import webhooks from './webhooks'
import gdpr from './gdpr'

const app = express()

app.use(morgan('tiny'))

// Special routes
app.use('/auth', auth)
app.use('/webhooks', webhooks)

app.use(express.static(path.resolve(__dirname, 'public')))
app.use('/files', express.static(path.resolve(__dirname, 'files')))
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(expressLayouts)
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs')
app.set('layout', 'layouts/main')

// Connect database
let options = {
	useNewUrlParser: true,
	useUnifiedTopology: true
} as mongoose.ConnectOptions
mongoose.connect(DB_URL, options )
let db = mongoose.connection
db.on('error', console.error.bind(console, "MongoDB connection errors"))

app.use((req: Request, res: Response, next: NextFunction) => {
	if (req.secure) {
		res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
	}
	next()
})

app.use((req: Request, res: Response, next: NextFunction) =>{
	res.setHeader(
		"Content-Security-Policy", 
		"default-src 'self' ;"
		)
	next()
})

// Routes
app.use('/', routes)
app.use('/gdpr', gdpr)

// Catch All
app.use(/^(?!.*_ah).*$/, async (req: Request, res: Response, next: NextFunction) => {
	res.send("Resource not found.")
})

// Run the app
const port = process.env.PORT || 4000

app.listen(port, () => {
	console.log('your app is now listening on port '+port+' :)... https://'+process.env.HOST);
})