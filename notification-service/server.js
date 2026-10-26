const express = require("express");

const app = express();
const PORT = 3007;
app.use(express.json());

// Simulated classroom delivery: no email/SMS provider is contacted.
const notifications = [
    {
        id: 701,
        studentId: 1,
        message: "Your enrollment has been confirmed.",
        type: "EMAIL",
        status: "SENT",
        delivery: "SIMULATED"
    }
];
let nextId = 702;

app.get("/notifications", (req, res) => {
    res.status(200).json(notifications);
});

app.get("/notifications/:id", (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id <= 0) {
        return res.status(400).json({ message: "ID must be a positive integer" });
    }
    const notification = notifications.find(item => item.id === id);
    if (!notification) return res.status(404).json({ message: "Notification not found" });
    res.status(200).json(notification);
});

app.post("/notifications", (req, res) => {
    const body = req.body;
    if (!body || !Number.isSafeInteger(body.studentId) || body.studentId <= 0
        || typeof body.message !== "string" || !body.message.trim()
        || typeof body.type !== "string" || !body.type.trim()) {
        return res.status(400).json({
            message: "Provide a positive integer studentId, a message, and a notification type"
        });
    }
    const notification = {
        id: nextId++,
        studentId: body.studentId,
        message: body.message,
        type: body.type,
        status: "SENT",
        delivery: "SIMULATED"
    };
    notifications.push(notification);
    res.status(201).json({ message: "Notification sent successfully", notification });
});

app.use((error, req, res, next) => {
    if (error.type === "entity.parse.failed") {
        return res.status(400).json({ message: "Invalid JSON body" });
    }
    console.error(error.message);
    res.status(500).json({ message: "Internal server error" });
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Notification Service running on port ${PORT}`);
});
