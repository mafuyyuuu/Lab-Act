const express = require("express");

const app = express();
const PORT = 3005;

app.use(express.json());

// Sample book data
let books = [
    {
        id: 1,
        title: "Introduction to Programming",
        author: "Juan Dela Cruz",
        year: 2026
    }
];

let nextId = 2;

// GET ALL BOOKS
app.get("/books", (req, res) => {
    res.status(200).json(books);
});

// GET BOOK BY ID
app.get("/books/:id", (req, res) => {
    const id = Number(req.params.id);
    const book = books.find(item => item.id === id);

    if (!book) {
        return res.status(404).json({
            message: "Book not found"
        });
    }

    res.status(200).json(book);
});

// ADD NEW BOOK
app.post("/books", (req, res) => {
    const newBook = {
        id: nextId++,
        title: req.body.title,
        author: req.body.author,
        year: req.body.year
    };

    books.push(newBook);

    res.status(201).json({
        message: "Book added successfully",
        book: newBook
    });
});

// UPDATE BOOK
app.put("/books/:id", (req, res) => {
    const id = Number(req.params.id);
    const book = books.find(item => item.id === id);

    if (!book) {
        return res.status(404).json({
            message: "Book not found"
        });
    }

    book.title = req.body.title ?? book.title;
    book.author = req.body.author ?? book.author;
    book.year = req.body.year ?? book.year;

    res.status(200).json({
        message: "Book updated successfully",
        book: book
    });
});

// DELETE BOOK
app.delete("/books/:id", (req, res) => {
    const id = Number(req.params.id);
    const bookIndex = books.findIndex(item => item.id === id);

    if (bookIndex === -1) {
        return res.status(404).json({
            message: "Book not found"
        });
    }

    const deletedBook = books.splice(bookIndex, 1);

    res.status(200).json({
        message: "Book deleted successfully",
        book: deletedBook[0]
    });
});

// START SERVER
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Library Service running on port ${PORT}`);
});