const express = require("express");
const { MongoClient } = require("mongodb");
const cors = require("cors");
const app = express();
const port = 5000;

app.use(cors()); 
app.use(express.json());

const uri = "mongodb+srv://VoxaCart:PotFl5vNmxgxWXP5@cluster0.hrpcy.mongodb.net/?appName=Cluster0";
const client = new MongoClient(uri);

// MongoDB Connect Function
async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("Successfully connected to MongoDB!");
    
    const database = client.db("VoxaCartDB");
    
    // Apni jemon cheyechen—bhetorei const diye collection variable
    const usersCollection = database.collection("users");
 const categoryCollection = database.collection("categories");
    
    // Route ta function-er bhetorei thakbe, jate const usersCollection ke access korte pare
    // get all users
    app.get("/users", async (req, res) => {
      try {
        const result = await usersCollection.find().toArray();
        res.send(result);
      } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).send("Internal Server Error");
      }
    });
     // get all category
      app.get("/category", async(req,res)=>{
        const result=await categoryCollection.find().toArray();
        res.send(result);
      });

  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1); 
  }
}

// Root Route
app.get("/", (req, res) => {
  res.send("Backend is runninngggg");
});

// Start Server
app.listen(port, async () => {
  await connectToMongoDB(); 
  console.log(`Server running on port ${port}`);
});