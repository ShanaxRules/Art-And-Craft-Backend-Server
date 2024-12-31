require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const datas = require('./Datas.json');

const app = express();
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 5000;

// MongoDB connection URI
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.7g1j2.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let userCollection, cardCollection, postCollection;

// Connect to MongoDB and initialize the collections
async function run() {
  try {
    await client.connect();
    console.log("Successfully connected to MongoDB!");
    const db = client.db('userDB');
    userCollection = db.collection('user');
    cardCollection = db.collection('card');
    postCollection = db.collection('post');
  } catch (err) {
    console.error("Failed to connect to MongoDB:", err);
    throw err; // Re-throw the error to stop the server startup
  }
}

// Middleware to ensure MongoDB is connected
function ensureDatabaseInitialized(req, res, next) {
  if (!userCollection || !cardCollection || !postCollection) {
    return res.status(500).send({ error: "Database not initialized. Please try again later." });
  }
  next();
}

// Routes
app.get('/', (req, res) => {
  res.send('Hello World!');
});

// Add a new user
app.post('/user', ensureDatabaseInitialized, async (req, res) => {
  try {
    const user = req.body;
    const result = await userCollection.insertOne(user);
    res.send(result);
  } catch (err) {
    console.error("Error inserting user:", err);
    res.status(500).send({ error: "Failed to insert user" });
  }
});

// Update user info
app.post('/update-name', ensureDatabaseInitialized, async (req, res) => {
  const { email, name } = req.body;

  if (!email || !name) {
    return res.status(400).send({ error: "Email and name are required" });
  }

  try {
    const result = await userCollection.updateOne(
      { email },
      { $set: { name } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).send({ error: "User not found" });
    }

    res.send({ success: true, message: "Name updated in MongoDB" });
  } catch (err) {
    console.error("Error updating name in MongoDB:", err);
    res.status(500).send({ error: "Failed to update name" });
  }
});

// Delete user info
app.delete('/delete-user', ensureDatabaseInitialized, async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).send({ error: "Email is required to delete a user" });
  }

  try {
    const result = await userCollection.deleteOne({ email });

    if (result.deletedCount === 0) {
      return res.status(404).send({ error: "User not found" });
    }

    res.send({ success: true, message: "User deleted successfully" });
  } catch (err) {
    console.error("Error deleting user:", err);
    res.status(500).send({ error: "Failed to delete user" });
  }
});

// Insert data into the 'card' collection
app.get('/datas', ensureDatabaseInitialized, async (req, res) => {
  try {
    const options = { ordered: true };
    const result = await cardCollection.insertMany(datas, options);
    res.send(result);
  } catch (err) {
    console.error("Error inserting datas:", err);
    res.status(500).send({ error: "Failed to insert datas" });
  }
});

// Insert data into the 'post' collection
app.post('/insertion', ensureDatabaseInitialized, async (req, res) => {
  try {
    const datasToSend = req.body;
    const result = await postCollection.insertOne(datasToSend);
    res.send(result);
  } catch (err) {
    console.error("Error inserting data into posts:", err);
    res.status(500).send({ error: "Failed to insert data" });
  }
});

// Get all posts
app.get('/userposts', ensureDatabaseInitialized, async (req, res) => {
  try {
    const posts = await postCollection.find({}).toArray();
    res.send(posts);
  } catch (err) {
    console.error("Error fetching posts:", err);
    res.status(500).send({ error: "Failed to fetch posts" });
  }
});

// Get all cards
app.get('/cards', ensureDatabaseInitialized, async (req, res) => {
  try {
    const cards = await cardCollection.find({}).toArray();
    res.send(cards);
  } catch (err) {
    console.error("Error fetching cards:", err);
    res.status(500).send({ error: "Failed to fetch cards" });
  }
});

// Update product info
app.put('/updateitem', ensureDatabaseInitialized, async (req, res) => {
  const { NIM_ID, image, item, subcategory, shortDescrip, price, rating, time, _id } = req.body;

  try {
    const result = await postCollection.updateOne(
      { _id: new ObjectId(_id) },
      {
        $set: {
          NIM_ID,
          image,
          item,
          subcategory,
          shortDescrip,
          price,
          rating,
          time,
        },
      }
    );
    res.send(result);
  } catch (err) {
    console.error("Error updating item:", err);
    res.status(500).send({ error: "Failed to update item" });
  }
});

// Start the server after MongoDB connection is established
async function startServer() {
  try {
    await run();
    console.log("Collections initialized. Starting server...");
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (err) {
    console.error("Error starting server:", err);
    process.exit(1);
  }
}

startServer();

// Ensure MongoDB client closes when the process exits
process.on('SIGINT', async () => {
  console.log('Closing MongoDB client');
  await client.close();
  process.exit();
});

