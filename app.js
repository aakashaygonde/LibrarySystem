// UPGRADED FULL WEBSITE: LIBRARY MANAGEMENT SYSTEM
// TECH: NODE.JS + EXPRESS + MONGODB + HTML/CSS/JS
// FEATURES ADDED:
// - Login Authentication
// - Search Books
// - Delete Books
// - Fine Tracking
// - Better UI
// - Admin Dashboard (basic)

// ================= BACKEND =================

const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());
app.use(cors());
app.use(express.static('public'));

mongoose.connect('mongodb://127.0.0.1:27017/library')
.then(()=>console.log("MongoDB Connected"))
.catch(err=>console.log(err));

// SCHEMAS
const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: 'customer' }
});

const bookSchema = new mongoose.Schema({
    title: String,
    author: String,
    quantity: { type: Number, default: 1 }
});

const issueSchema = new mongoose.Schema({
    userId: String,
    bookId: String,
    issueDate: Date,
    returnDate: Date,
    fine: Number
});

const User = mongoose.model('User', userSchema);
const Book = mongoose.model('Book', bookSchema);
const Issue = mongoose.model('Issue', issueSchema);

// AUTH
app.post('/register', async (req, res) => {
    try {
        const user = new User(req.body);
        await user.save();
        res.json({ message: 'Registered successfully' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email, password });
        if (user) {
            res.json(user);
        } else {
            res.status(401).json({ error: "Invalid login" });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PROFILE
app.get('/profile/:userId', async (req, res) => {
    try {
        const issues = await Issue.find({ userId: req.params.userId });
        res.json(issues);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// BOOKS
app.post('/addBook', async (req, res) => {
    try {
        const book = new Book({ ...req.body, quantity: Number(req.body.quantity) || 1 });
        await book.save();
        res.json({ message: 'Book Added' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/books', async (req, res) => {
    try {
        const books = await Book.find();
        res.json(books);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/search/:text', async (req, res) => {
    try {
        const books = await Book.find({ title: { $regex: req.params.text, $options: 'i' } });
        res.json(books);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/delete/:id', async (req, res) => {
    try {
        await Book.findByIdAndDelete(req.params.id);
        res.json({ message: 'Deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ISSUE
app.post('/issue', async (req, res) => {
    try {
        const { userId, bookId } = req.body;
        if (!userId || !bookId) return res.status(400).json({ error: "Missing userId or bookId" });

        const activeIssuesCount = await Issue.countDocuments({ userId, returnDate: null });
        if (activeIssuesCount >= 3) {
            return res.status(400).json({ error: "Limit reached: You can issue a maximum of 3 books. Please return a book first." });
        }

        const book = await Book.findById(bookId);
        if (!book) return res.status(404).json({ error: "Book not found" });
        if (book.quantity <= 0) return res.status(400).json({ error: "Out of Stock" });

        const issue = new Issue({ userId, bookId, issueDate: new Date(), fine: 0 });
        await issue.save();

        book.quantity -= 1;
        await book.save();

        res.json({ message: 'Issued successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// RETURN + FINE
app.post('/return', async (req, res) => {
    try {
        const { userId, bookId } = req.body;
        if (!userId || !bookId) return res.status(400).json({ error: "Missing userId or bookId" });

        const issue = await Issue.findOne({ bookId, userId, returnDate: null });
        if (!issue) return res.status(404).json({ error: "Active issue not found" });

        const days = Math.floor((new Date() - issue.issueDate)/(1000*60*60*24));
        let fine = days > 7 ? (days-7)*5 : 0;

        issue.returnDate = new Date();
        issue.fine = fine;
        await issue.save();

        const book = await Book.findById(bookId);
        if (book) {
            book.quantity += 1;
            await book.save();
        }

        res.json({ message: `Returned. Fine: Rs ${fine}` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// FINE TRACKING
app.get('/fines', async (req, res) => {
    try {
        const data = await Issue.find({ fine: { $gt: 0 } });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));

