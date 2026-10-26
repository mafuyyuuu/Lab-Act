const express = require("express");
const { randomBytes, scryptSync, timingSafeEqual } = require("node:crypto");

const app = express();
const PORT = 3008;
app.use(express.json());

function hashPassword(password) {
    const salt = randomBytes(16).toString("hex");
    return { salt, passwordHash: scryptSync(password, salt, 64) };
}

// Classroom demonstration only. Never enter real credentials here.
// Passwords are stored as salted hashes, and disappear on restart.
const users = [
    { id: 1, username: "juan", role: "student", ...hashPassword("demo123") }
];
let nextId = 2;

function publicUser(user) {
    return { id: user.id, username: user.username, role: user.role };
}

function validCredentials(body) {
    return body && typeof body.username === "string"
        && body.username.trim().length > 0 && body.username.length <= 100
        && typeof body.password === "string"
        && body.password.length >= 6 && body.password.length <= 1024;
}

app.post("/register", (req, res) => {
    if (!validCredentials(req.body)) {
        return res.status(400).json({
            message: "Provide a username (1-100 characters) and a demo password (6-1024 characters)"
        });
    }
    const username = req.body.username.trim();
    if (users.some(user => user.username.toLowerCase() === username.toLowerCase())) {
        return res.status(409).json({ message: "Username already registered" });
    }
    // Public registration always creates a student; clients cannot assign roles.
    const user = {
        id: nextId++, username, role: "student", ...hashPassword(req.body.password)
    };
    users.push(user);
    res.status(201).json({ message: "User registered successfully", user: publicUser(user) });
});

app.post("/login", (req, res) => {
    if (!validCredentials(req.body)) {
        return res.status(400).json({ message: "Provide a valid demo username and password" });
    }
    const username = req.body.username.trim().toLowerCase();
    const user = users.find(item => item.username.toLowerCase() === username);
    if (!user || !timingSafeEqual(scryptSync(req.body.password, user.salt, 64), user.passwordHash)) {
        return res.status(401).json({ message: "Invalid username or password" });
    }
    // Basic login/role behavior requested by the activity, without sessions or JWTs.
    res.status(200).json({ message: "Login successful", role: user.role, user: publicUser(user) });
});

app.get("/users/:id", (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id <= 0) {
        return res.status(400).json({ message: "ID must be a positive integer" });
    }
    const user = users.find(item => item.id === id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json(publicUser(user));
});

app.use((error, req, res, next) => {
    if (error.type === "entity.parse.failed") {
        return res.status(400).json({ message: "Invalid JSON body" });
    }
    console.error(error.message);
    res.status(500).json({ message: "Internal server error" });
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Authentication Service running on port ${PORT}`);
});
