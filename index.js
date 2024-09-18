const express = require('express')
const bodyParser = require('body-parser')
const session = require('express-session')
require('dotenv').config()
const cors = require('cors')
const helmet = require('helmet')
const { config } = require('./constants.js')

const initialJobPostings = require('./initialJobPostings')

const app = express()
const port = process.env.PORT || 3000

var corsOptions = {
	credentials: true,
	preflightContinue: true,
	methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
	origin: config.client_url,
	optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
}
// Needed because the POST request has custom header to send JSON object
app.options('*', cors(corsOptions))
app.use(cors(corsOptions))

// Helmet for security-related HTTP headers
app.use(helmet())

// Trust first proxy
app.set('trust proxy', 1) // Indicate that the server is behind a proxy (like a load balancer) it should trust.

app.use(bodyParser.json())
app.use(
	session({
		secret: process.env.SESSION_SECRET, // Use an environment variable for the session secret
		resave: false,
		saveUninitialized: true,
		cookie: config.cookie,
	})
)

// Middleware to initialize session store with job postings
app.use((req, res, next) => {
	if (!req.session.jobPostings) {
		req.session.jobPostings = [...initialJobPostings]
	}
	next()
})

// GET /jobs - Get all jobs
app.get('/jobs', (req, res) => {
	res.json(req.session.jobPostings)
})

// GET /jobs/:id - Get a job by ID
app.get('/jobs/:id', (req, res) => {
	const job = req.session.jobPostings.find((job) => job.id === parseInt(req.params.id))
	if (job) {
		res.json(job)
	} else {
		res.status(404).send('Job not found')
	}
})

// POST /jobs - Create a new job
app.post('/jobs', (req, res) => {
	const newJob = req.body
	// find the max id and increment by 1
	maxId = Math.max(...req.session.jobPostings.map((job) => job.id))
	newJob.id = maxId + 1
	req.session.jobPostings.push(newJob)
	res.status(201).json(newJob)
})

// PUT /jobs/:id - Update a job with a specific ID
app.put('/jobs/:id', (req, res) => {
	const index = req.session.jobPostings.findIndex((job) => job.id === parseInt(req.params.id))
	if (index !== -1) {
		req.session.jobPostings[index] = { ...req.body, id: parseInt(req.params.id) }
		res.json(req.session.jobPostings[index])
	} else {
		res.status(404).send('Job not found')
	}
})

// DELETE /jobs/:id - Delete a job with a specific ID
app.delete('/jobs/:id', (req, res) => {
	const index = req.session.jobPostings.findIndex((job) => job.id === parseInt(req.params.id))
	if (index !== -1) {
		const deletedJob = req.session.jobPostings.splice(index, 1)
		res.json(deletedJob)
	} else {
		res.status(404).send('Job not found')
	}
})

// Basic error handling middleware
app.use((err, req, res, next) => {
	console.error(err.stack)
	res.status(500).send('Something broke!')
})

app.listen(port, () => {
	console.log(`Server is running on http://localhost:${port}`)
})
