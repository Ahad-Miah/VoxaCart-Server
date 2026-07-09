const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");
const cors = require("cors");
const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

const uri =
  "mongodb+srv://VoxaCart:PotFl5vNmxgxWXP5@cluster0.hrpcy.mongodb.net/?appName=Cluster0";
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
    const productCollection = database.collection("products");
    const wishListCollection = database.collection("wishlists");
    const cartCollection = database.collection("Carts");

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
    // get user role
    app.get("/user/role/:email", async (req, res) => {
      const email = req.params.email;
      const filter = { email };
      const result = await usersCollection.findOne(filter);
      res.send({ role: result?.role });
    });
    // get all category
    app.get("/category", async (req, res) => {
      const result = await categoryCollection.find().toArray();
      res.send(result);
    });
    // get all products
    app.get("/products", async (req, res) => {
      const result = await productCollection.find().toArray();
      res.send(result);
    });
    // get specific product by id
    app.get("/products/:id", async (req, res) => {
      const id = req.params.id;

      const query = { _id: new ObjectId(id) };
      const result = await productCollection.findOne(query);
      res.send(result);
    });
    // get specific product by email added by vendor
        app.get('/myProduct/:email', async (req, res) => {
            const email = req.params.email;
            const query = { vendorEmail: email };
            const result = await productCollection.find(query).toArray();
            res.send(result);
        })
    // add user
app.post('/users/:email', async (req, res) => {
  try {
    const email = req.params.email;
    const user = req.body;
    const query = { email: email };
    
    const updateDoc = {
      // 1. Ei data gulo PROTTIBAR update hbe (login korle ba refresh korle)
      $set: {
        name: user.name,
        image: user.image
      },
      // 2. 🔥 Ei data-ti SHUDHU PROTHOM BAR (Insert hobar shomoy) set hbe
      // Porer bar update-er shomoy eita ar change hbe na
      $setOnInsert: {
        role: user.role || "customer" 
      }
    };
    
    const options = { upsert: true, returnDocument: 'after' };
    
    const result = await usersCollection.findOneAndUpdate(query, updateDoc, options);
    
    res.send(result);
    
  } catch (error) {
    console.error("Error upserting user:", error);
    res.status(500).send("Internal Server Error");
  }
  // update products
app.put('/product/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) };
        const option = { upsert: true }; 
        
        const updatedData = req.body;
        const updatedProduct = {
            $set: {
                name: updatedData.name,
                description: updatedData.description,
                price: Number(updatedData.price),
                category: updatedData.category,
                image: updatedData.image,
                vendor: updatedData.vendor, 
                rating: Number(updatedData.rating) || 4.5,
                reviewsCount: Number(updatedData.reviewsCount) || 0,
                stock: Number(updatedData.stock),
                
                
                sizes: updatedData.sizes || [],
                colors: updatedData.colors || [],
                tags: updatedData.tags || [],
                
                
                material: updatedData.material || ""
            }
        };

        
        const result = await productCollection.updateOne(filter, updatedProduct, option);
        
        if (result.matchedCount === 0 && result.upsertedCount === 0) {
            return res.status(404).send({ message: "Product not found or failed to update" });
        }

        
        res.send(result);

    } catch (error) {
        console.error("Error updating product:", error);
        res.status(500).send({ error: true, message: "Internal Server Error" });
    }
});
// delete product
 // delete a property
        app.delete('/product/:id',  async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await productCollection.deleteOne(query);
            res.send(result);
        })
});
  //  add product
   app.post('/add-product', async (req, res) => {

            const property = req.body;
            const result = await productCollection.insertOne(property);
            res.send(result);
        })
    // add a product to wishlist
   app.post("/wishlist", async (req, res) => {
  const wishList = req.body;
  

  const query = { 
    userEmail: wishList.userEmail, 
    productId: wishList.productId 
  };
  
  const existingItem = await wishListCollection.findOne(query);

  if (existingItem) {
    
    return res.status(409).send({ 
      success: false, 
      message: "This product is already locked into your wishlist!" 
    });
  }

  
  const result = await wishListCollection.insertOne(wishList);
  res.send(result);
});
// add product to cart
app.post("/cart", async (req, res) => {
  const cartItem = req.body;
  
  
  const query = { 
    userEmail: cartItem.userEmail, 
    productId: cartItem.productId 
  };
  
  
  const existingItem = await cartCollection.findOne(query);

  if (existingItem) {
    
    const updateDoc = {
      $inc: { quantity: 1 }
    };
    const result = await cartCollection.updateOne(query, updateDoc);
    return res.send({ 
      success: true, 
      message: "Product quantity updated in cart!", 
      result 
    });
  } else {
    
    cartItem.quantity = 1;
    const result = await cartCollection.insertOne(cartItem);
    return res.send({ 
      success: true, 
      message: "Product added to cart!", 
      result 
    });
  }
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
