const express = require("express");

const app = express();
const PORT = 3003;

app.use(express.json());

// Sample enrollment data
let enrollments = [
    {
        id: 1,
        studentId: 1,
        courseId: 101,
        semester: "1st Semester",
        schoolYear: "2026-2027"
    }
];

let nextId = 2;

// GET ALL ENROLLMENTS
app.get("/enrollments", (req, res) => {
    res.status(200).json(enrollments);
});

// GET ENROLLMENT BY ID
app.get("/enrollments/:id", (req, res) => {
    const id = Number(req.params.id);
    const enrollment = enrollments.find(item => item.id === id);

    if (!enrollment) {
        return res.status(404).json({
            message: "Enrollment not found"
        });
    }

    res.status(200).json(enrollment);
});

// ADD NEW ENROLLMENT
app.post("/enrollments", (req, res) => {
    const newEnrollment = {
        id: nextId++,
        studentId: req.body.studentId,
        courseId: req.body.courseId,
        semester: req.body.semester,
        schoolYear: req.body.schoolYear
    };

    enrollments.push(newEnrollment);

    res.status(201).json({
        message: "Enrollment added successfully",
        enrollment: newEnrollment
    });
});

// UPDATE ENROLLMENT
app.put("/enrollments/:id", (req, res) => {
    const id = Number(req.params.id);
    const enrollment = enrollments.find(item => item.id === id);

    if (!enrollment) {
        return res.status(404).json({
            message: "Enrollment not found"
        });
    }

    enrollment.studentId = req.body.studentId ?? enrollment.studentId;
    enrollment.courseId = req.body.courseId ?? enrollment.courseId;
    enrollment.semester = req.body.semester ?? enrollment.semester;
    enrollment.schoolYear = req.body.schoolYear ?? enrollment.schoolYear;

    res.status(200).json({
        message: "Enrollment updated successfully",
        enrollment: enrollment
    });
});

// DELETE ENROLLMENT
app.delete("/enrollments/:id", (req, res) => {
    const id = Number(req.params.id);
    const enrollmentIndex = enrollments.findIndex(item => item.id === id);

    if (enrollmentIndex === -1) {
        return res.status(404).json({
            message: "Enrollment not found"
        });
    }

    const deletedEnrollment = enrollments.splice(enrollmentIndex, 1);

    res.status(200).json({
        message: "Enrollment deleted successfully",
        enrollment: deletedEnrollment[0]
    });
});


// ROUTE TO GET STUDENT INFORMATION THROUGH ENROLLMENT SERVICE
app.get('/student-enrollment/:id', async (req, res) => {
    try {
        const enrollment = enrollments.find(e => e.id == req.params.id);
        if (!enrollment) return res.status(404).json({ error: 'Enrollment not found' });

        const r = await fetch(`${process.env.STUDENT_SERVICE_URL}/students/${enrollment.student_id}`);
        if (!r.ok) return res.status(r.status).json({ error: 'Student not found' });
        const student = await r.json();

        res.json({ enrollment, student });
    } catch (err) {
        res.status(502).json({ error: 'Cannot reach student service', detail: err.message });
    }
});

// START SERVER
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Enrollment Service running on port ${PORT}`);
});