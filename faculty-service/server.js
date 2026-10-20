const express = require("express");

const app = express();
const PORT = 3006;

app.use(express.json());

// Sample faculty data
let faculty = [
    {
        id: 1,
        name: "Maria Santos",
        department: "Information Technology",
        position: "Instructor"
    }
];

let nextId = 2;

// GET ALL FACULTY
app.get("/faculty", (req, res) => {
    res.status(200).json(faculty);
});

// GET FACULTY BY ID
app.get("/faculty/:id", (req, res) => {
    const id = Number(req.params.id);
    const facultyMember = faculty.find(item => item.id === id);

    if (!facultyMember) {
        return res.status(404).json({
            message: "Faculty member not found"
        });
    }

    res.status(200).json(facultyMember);
});

// ADD NEW FACULTY
app.post("/faculty", (req, res) => {
    const newFaculty = {
        id: nextId++,
        name: req.body.name,
        department: req.body.department,
        position: req.body.position
    };

    faculty.push(newFaculty);

    res.status(201).json({
        message: "Faculty member added successfully",
        faculty: newFaculty
    });
});

// UPDATE FACULTY
app.put("/faculty/:id", (req, res) => {
    const id = Number(req.params.id);
    const facultyMember = faculty.find(item => item.id === id);

    if (!facultyMember) {
        return res.status(404).json({
            message: "Faculty member not found"
        });
    }

    facultyMember.name = req.body.name ?? facultyMember.name;
    facultyMember.department = req.body.department ?? facultyMember.department;
    facultyMember.position = req.body.position ?? facultyMember.position;

    res.status(200).json({
        message: "Faculty member updated successfully",
        faculty: facultyMember
    });
});

// DELETE FACULTY
app.delete("/faculty/:id", (req, res) => {
    const id = Number(req.params.id);
    const facultyIndex = faculty.findIndex(item => item.id === id);

    if (facultyIndex === -1) {
        return res.status(404).json({
            message: "Faculty member not found"
        });
    }

    const deletedFaculty = faculty.splice(facultyIndex, 1);

    res.status(200).json({
        message: "Faculty member deleted successfully",
        faculty: deletedFaculty[0]
    });
});

// START SERVER
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Faculty Service running on port ${PORT}`);
});