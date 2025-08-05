const express = require('express')
require('dotenv').config()

const usersRouter = require('./routes/usersRouter')

const app = express()

// app.use(cors({
//     origin: process.env.CORS_URL,
//     credentials: true
// }))
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

app.use('/api/users', usersRouter)

const PORT = process.env.PORT || 4044

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})