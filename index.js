import express from "express";
import { MongoClient, ObjectId } from "mongodb";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(express.json());

const uri = "mongodb://127.0.0.1:27017";
const client = new MongoClient(uri);

const secretKey = process.env.SECRET_KEY; // Load the secret key from your .env file

// Middleware to verify the API key
function verifyApiKey(req, res, next) {
  const apiKey = req.headers.authorization;
  console.log(apiKey);
  console.log(secretKey);

  if (apiKey === secretKey) {
    next(); // Proceed to the next middleware or route
  } else {
    res
      .status(403)
      .json({ message: "Unauthorized. API key is missing or invalid." });
  }
}

async function connectToDatabase() {
  try {
    await client.connect();
    console.log("Connected to the database");
  } catch (error) {
    console.error("Error connecting to the database:", error);
  }
}

connectToDatabase().then(() => {
  const database = client.db("booksDB");
  const books = database.collection("books");

  // GET a book by ID
  app.get("/books/:id", async (req, res) => {
    try {
      const bookId = req.params.id;
      const filter = { _id: new ObjectId(bookId) };
      const book = await books.findOne(filter);
      if (book) {
        res.json(book);
      } else {
        res.status(404).json({ message: "Book not found" });
      }
    } catch (error) {
      console.error("Error retrieving book by ID:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // GET all books
  app.get("/books", async (req, res) => {
    try {
      const allBooks = await books.find({}).toArray();
      res.json(allBooks);
    } catch (error) {
      console.error("Error retrieving all books:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // PUT (Update) a book by ID (Protected with API key)
  app.put("/books/:id", verifyApiKey, async (req, res) => {
    try {
      const bookId = req.params.id;
      const updatedBook = req.body;
      const filter = { _id: new ObjectId(bookId) };
      const updateResult = await books.updateOne(filter, { $set: updatedBook });
      if (updateResult.matchedCount === 1) {
        res.json({ message: "Book updated" });
      } else {
        res.status(404).json({ message: "Book not found" });
      }
    } catch (error) {
      console.error("Error updating a book:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // POST a new book (Protected with API key)
  app.post("/books", verifyApiKey, async (req, res) => {
    try {
      const newBook = req.body;
      const result = await books.insertOne(newBook);
      res.status(201).json({ message: "Book added" });
    } catch (error) {
      console.error("Error adding a new book:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // DELETE a book by ID (Protected with API key)
  app.delete("/books/:id", verifyApiKey, async (req, res) => {
    try {
      const bookId = req.params.id;
      const filter = { _id: new ObjectId(bookId) };
      const deleteResult = await books.deleteOne(filter);
      if (deleteResult.deletedCount === 1) {
        res.json({ message: "Book deleted" });
      } else {
        res.status(404).json({ message: "Book not found" });
      }
    } catch (error) {
      console.error("Error deleting a book:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.listen(3000, () => {
    console.log("Server is running on port 3000");
  });
});
