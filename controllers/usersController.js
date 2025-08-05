const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const prisma = new PrismaClient();

async function createUser(req, res) {
    try {
        let { firstName, lastName, email, password } = req.body;
        if (!firstName || !lastName || !email || !password) {
            return res.status(400).json({
                message: "Missing fields"
            })
        }

        firstName = firstName[0].toUpperCase() + firstName.slice(1).toLowerCase()
        lastName = lastName[0].toUpperCase() + lastName.slice(1).toLowerCase()
        email = email.toLowerCase()

        const existingUser = await prisma.user.findUnique({
            where: {
                email
            }
        })

        if (existingUser) {
            return res.status(409).json({
                message: "Email is already registered"
            })
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const user = await prisma.user.create({
            data: {
                firstName,
                lastName,
                email,
                password: hashedPassword
            }
        })

        if (!user) {
            throw new Error("Failed to create new user")
        }

        const { password: discard, ...safeUser } = user;

        res.status(201).json({ message: "User created successfully" })

    } catch (error) {
        res.status(503).json({
            message: "Internal server error"
        })
    }
}

async function AuthenticateUser(req, res) {
    try {
        let { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Missing fields" })
        }

        const user = await prisma.user.findFirst({
            where: {
                email: {
                    equals: email,
                    mode: 'insensitive'
                }
            }
        })

        if (!user) {
            return res.status(404).json({ message: "Invalid email" })
        }

        const isMatch = await bcrypt.compare(password, user.password)

        if (!isMatch) {
            return res.status(401).json({ message: "Invalid password" })
        }

        const token = jwt.sign(
            { id: user.id },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        )

        return res.status(200).json({ token })

    } catch (error) {
        res.status(503).json({
            message: "Internal server error"
        })
    }
}

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader?.split(' ')[1]

    if (!token) {
        return res.status(401).json({ message: "Unauthorized" })
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: "Not authorized" })
        }
        req.user = user;
        next()
    })
}

async function updateUserSettings(req, res) {
    try {
        const { firstName, lastName, email, password } = req.body;

        const updateData = {}

        if (firstName) updateData.firstName = firstName[0].toUpperCase() + firstName.slice(1).toLowerCase();
        if (lastName) updateData.lastName = lastName[0].toUpperCase() + lastName.slice(1).toLowerCase();
        if (email) updateData.email = email.toLowerCase();
        if (password) updateData.password = await bcrypt.hash(password, 10);

        const userId = req.user.id;

        await prisma.user.update({
            where: {
                id: userId,
            },
            data: updateData
        })

        res.status(200).json({ updated: true })

    } catch (error) {
        console.log("updateUserSettings", error)
        res.status(503).json({
            message: "Internal server error"
        })
    }
}

async function retrieveUser(req, res) {
    try {
        const id = Number(req.params.id);
        if (!id) return res.status(400).json({ message: "Missing friend Id" })

        const friend = await prisma.user.findUnique({
            where: {
                id
            },
            select: {
                id: true,
                firstName: true,
                lastName: true
            }
        })

        if (!friend) return res.status(404).json({ message: "User not found" })

        return res.status(200).json({ friend })

    } catch (error) {
        console.log("retrieveUser", error)
        res.status(503).json({
            message: "Internal server error"
        })
    }
}


module.exports = {
    createUser,
    AuthenticateUser,
    authenticateToken,
    updateUserSettings,
    retrieveUser,
}