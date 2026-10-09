const express = require("express");

const app = express();
const PORT = 3001;

// Middleware
app.use(express.json());

// Sample student data
let students = [
    {
        id: 1,
        name: "Juan Dela Cruz",
        course: "BSIT",
        year: 4
    },
    {
        id: 2,
        name: "Maria Santos",
        course: "BSCS",
        year: 3
    },
    {
        id: 3,
        name: "Pedro Reyes",
        course: "BSIT",
        year: 2
    }
];

// ======================================
// GET ALL STUDENTS
// ======================================
app.get("/students", (req, res) => {
    res.status(200).json(students);
});

// ======================================
// GET STUDENT BY ID
// ======================================
app.get("/students/:id", (req, res) => {
    const id = parseInt(req.params.id);

    const student = students.find(student => student.id === id);

    if (!student) {
        return res.status(404).json({
            message: "Student not found"
        });
    }

    res.status(200).json(student);
});

// ======================================
// ADD NEW STUDENT
// ======================================
app.post("/students", (req, res) => {
    const newStudent = {
        id: students.length > 0
            ? students[students.length - 1].id + 1
            : 1,
        name: req.body.name,
        course: req.body.course,
        year: req.body.year
    };

    students.push(newStudent);

    res.status(201).json({
        message: "Student added successfully",
        student: newStudent
    });
});

// ======================================
// UPDATE STUDENT
// ======================================
app.put("/students/:id", (req, res) => {
    const id = parseInt(req.params.id);

    const student = students.find(student => student.id === id);

    if (!student) {
        return res.status(404).json({
            message: "Student not found"
        });
    }

    student.name = req.body.name || student.name;
    student.course = req.body.course || student.course;
    student.year = req.body.year || student.year;

    res.status(200).json({
        message: "Student updated successfully",
        student: student
    });
});

// ======================================
// DELETE STUDENT
// ======================================
app.delete("/students/:id", (req, res) => {
    const id = parseInt(req.params.id);

    const studentIndex = students.findIndex(
        student => student.id === id
    );

    if (studentIndex === -1) {
        return res.status(404).json({
            message: "Student not found"
        });
    }

    const deletedStudent = students.splice(studentIndex, 1);

    res.status(200).json({
        message: "Student deleted successfully",
        student: deletedStudent[0]
    });
});

// ======================================
// START SERVER
// ======================================
app.listen(PORT, () => {
    console.log(`Student Service running on port ${PORT}`);
});