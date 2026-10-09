const express = require("express");

const app = express();
const PORT = 3002;

// Middleware
app.use(express.json());

// Sample course data
let courses = [
    {
        id: 1,
        name: "Web Development",
        price: 4500,
        category: "Programming"
    },
    {
        id: 2,
        name: "Graphic Design",
        price: 1500,
        category: "Design"
    },
    {
        id: 3,
        name: "Digital Marketing",
        price: 800,
        category: "Marketing"
    }
];

// ======================================
// GET ALL COURSES
// ======================================
app.get("/courses", (req, res) => {
    res.status(200).json(courses);
});

// ======================================
// GET COURSE BY ID
// ======================================
app.get("/courses/:id", (req, res) => {
    const id = parseInt(req.params.id, 10);

    const course = courses.find(course => course.id === id);

    if (!course) {
        return res.status(404).json({
            message: "Course not found"
        });
    }

    res.status(200).json(course);
});

// ======================================
// ADD COURSE
// ======================================
app.post("/courses", (req, res) => {
    const newCourse = {
        id: courses.length > 0
            ? Math.max(...courses.map(course => course.id)) + 1
            : 1,
        name: req.body.name,
        price: req.body.price,
        category: req.body.category
    };

    courses.push(newCourse);

    res.status(201).json({
        message: "Course added successfully",
        course: newCourse
    });
});

// ======================================
// UPDATE COURSE
// ======================================
app.put("/courses/:id", (req, res) => {
    const id = parseInt(req.params.id, 10);

    const course = courses.find(course => course.id === id);

    if (!course) {
        return res.status(404).json({
            message: "Course not found"
        });
    }

    course.name = req.body.name ?? course.name;
    course.price = req.body.price ?? course.price;
    course.category = req.body.category ?? course.category;

    res.status(200).json({
        message: "Course updated successfully",
        course: course
    });
});

// ======================================
// DELETE COURSE
// ======================================
app.delete("/courses/:id", (req, res) => {
    const id = parseInt(req.params.id, 10);

    const courseIndex = courses.findIndex(
        course => course.id === id
    );

    if (courseIndex === -1) {
        return res.status(404).json({
            message: "Course not found"
        });
    }

    const deletedCourse = courses.splice(courseIndex, 1);

    res.status(200).json({
        message: "Course deleted successfully",
        course: deletedCourse[0]
    });
});

// ======================================
// START SERVER
// ======================================
app.listen(PORT, () => {
    console.log(`Course Service running on port ${PORT}`);
});