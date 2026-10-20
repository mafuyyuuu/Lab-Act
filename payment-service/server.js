const express = require("express");

const app = express();
const PORT = 3004;

app.use(express.json());

// Sample payment data
let payments = [
    {
        id: 1001,
        studentId: 1,
        amount: 25000,
        status: "PAID"
    }
];

let nextId = 1002;

// GET ALL PAYMENTS
app.get("/payments", (req, res) => {
    res.status(200).json(payments);
});

// GET PAYMENT BY ID
app.get("/payments/:id", (req, res) => {
    const id = Number(req.params.id);
    const payment = payments.find(item => item.id === id);

    if (!payment) {
        return res.status(404).json({
            message: "Payment not found"
        });
    }

    res.status(200).json(payment);
});

// ADD NEW PAYMENT
app.post("/payments", (req, res) => {
    const newPayment = {
        id: nextId++,
        studentId: req.body.studentId,
        amount: req.body.amount,
        status: req.body.status
    };

    payments.push(newPayment);

    res.status(201).json({
        message: "Payment added successfully",
        payment: newPayment
    });
});

// UPDATE PAYMENT
app.put("/payments/:id", (req, res) => {
    const id = Number(req.params.id);
    const payment = payments.find(item => item.id === id);

    if (!payment) {
        return res.status(404).json({
            message: "Payment not found"
        });
    }

    payment.studentId = req.body.studentId ?? payment.studentId;
    payment.amount = req.body.amount ?? payment.amount;
    payment.status = req.body.status ?? payment.status;

    res.status(200).json({
        message: "Payment updated successfully",
        payment: payment
    });
});

// START SERVER
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Payment Service running on port ${PORT}`);
});