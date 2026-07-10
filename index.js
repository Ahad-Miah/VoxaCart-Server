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
    const reviewCollection = database.collection("reviews");
    const ordersCollection = database.collection("Orders");
    const vendorCollection=database.collection("vendors");

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
    app.get("/myProduct/:email", async (req, res) => {
      const email = req.params.email;
      const query = { vendorEmail: email };
      const result = await productCollection.find(query).toArray();
      res.send(result);
    });
    // get products all review
    // 🔍 GET REVIEWS BY PRODUCT ID
    app.get("/reviews/:productId", async (req, res) => {
      try {
        const productId = req.params.productId;

        // productId match kore review gula khunje ber korbe
        const query = { productId: productId };

        // Sort korbo jate notun review gulo agey dekha jay
        const result = await reviewCollection
          .find(query)
          .sort({ date: -1 })
          .toArray();

        res.send(result);
      } catch (error) {
        console.error("Error fetching reviews:", error);
        res.status(500).send("Internal Server Error");
      }
    });
    // get user orders
    app.get("/orders/:email", async (req, res) => {
      try {
        const email = req.params.email;
        const query = { userEmail: email };
        const result = await ordersCollection
          .find(query)
          .sort({ _id: -1 })
          .toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: "Failed to fetch orders" });
      }
    });
    // get user cart data
    app.get("/cart/:email", async (req, res) => {
      const email = req.params.email;
      const query = { userEmail: email };
      const result = await cartCollection.find(query).toArray();
      res.send(result);
    });
    // get vendor application
    app.get('/vendor-applications', async (req, res) => {
    const result = await vendorCollection.find({ status: 'pending' }).toArray();
    res.send(result);
});
    // get user wishlist data
    app.get("/wishlist/:email", async (req, res) => {
      const email = req.params.email;
      const query = { userEmail: email };
      const result = await wishListCollection.find(query).toArray();
      res.send(result);
    });
    // get vendor request
    app.get("/vendor-requests/:email", async (req, res) => {
    const email = req.params.email;
    const result = await vendorCollection.findOne({ email: email });
    res.send(result);
});
// get verified vendors
app.get("/verified-vendors", async (req, res) => {
  try {

    const verifiedVendors = await vendorCollection
      .find({ status: "verified" })
      .toArray();


    res.send(verifiedVendors);

  } catch (error) {

    console.error(error);
    res.status(500).send({
      message: "Failed to fetch verified vendors"
    });

  }
});
// get users stats
app.get('/admin-stats', async (req, res) => {
    const users = await usersCollection.estimatedDocumentCount();
    const orders = await ordersCollection.estimatedDocumentCount();
    const products = await productCollection.estimatedDocumentCount();
    const vendors = await vendorCollection.estimatedDocumentCount();
    const graphData = [
        { name: 'Jan', value: 400 }, 
        { name: 'Feb', value: 300 }, 
        { name: 'Mar', value: 600 }, 
        { name: 'Apr', value: 800 }, 
        { name: 'May', value: 500 }
    ];

    res.send({ 
       summary: { users, orders, products, vendors },
       graphData: graphData
    });
});
// get all orders
  app.get("/orders", async (req, res) => {
      const result = await ordersCollection.find().toArray();
      res.send(result);
    });
    // add user
    app.post("/users/:email", async (req, res) => {
      try {
        const email = req.params.email;
        const user = req.body;
        const query = { email: email };

        const updateDoc = {
          // 1. Ei data gulo PROTTIBAR update hbe (login korle ba refresh korle)
          $set: {
            name: user.name,
            image: user.image,
          },
          // 2. 🔥 Ei data-ti SHUDHU PROTHOM BAR (Insert hobar shomoy) set hbe
          // Porer bar update-er shomoy eita ar change hbe na
          $setOnInsert: {
            role: user.role || "customer",
          },
        };

        const options = { upsert: true, returnDocument: "after" };

        const result = await usersCollection.findOneAndUpdate(
          query,
          updateDoc,
          options,
        );

        res.send(result);
      } catch (error) {
        console.error("Error upserting user:", error);
        res.status(500).send("Internal Server Error");
      }
    });
    // update products
    app.put("/product/:id", async (req, res) => {
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

            material: updatedData.material || "",
          },
        };

        const result = await productCollection.updateOne(
          filter,
          updatedProduct,
          option,
        );

        if (result.matchedCount === 0 && result.upsertedCount === 0) {
          return res
            .status(404)
            .send({ message: "Product not found or failed to update" });
        }

        res.send(result);
      } catch (error) {
        console.error("Error updating product:", error);
        res.status(500).send({ error: true, message: "Internal Server Error" });
      }
    });
    // cart quantity update
 app.patch("/cart/update/:id", async (req, res) => {
    const { id } = req.params;
    const { quantity } = req.body; 
    const result = await cartCollection.updateOne(
        { _id: new ObjectId(id) }, 
        { $set: { quantity: quantity } }
    );
    res.send(result);
});
// vendor status upate
app.patch('/vendor-applications/:id', async (req, res) => {
    const { id } = req.params;
    const { status, email } = req.body;
    
    await vendorCollection.updateOne({ _id: new ObjectId(id) }, { $set: { status } });
    
    if (status === 'verified') {
        await usersCollection.updateOne({ email: email }, { $set: { role: 'vendor' } });
    }
    
    res.send({ success: true });
});
    // delete product
    app.delete("/product/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await productCollection.deleteOne(query);
      res.send(result);
    });
    // delete users
   app.delete("/users/:id", async (req, res) => {
  const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await usersCollection.deleteOne(query);
      res.send(result);
});
    // delete cart product
    app.delete("/cart/delete/:id", async (req, res) => {
      const result = await cartCollection.deleteOne({
        _id: new ObjectId(req.params.id),
      });
      res.send(result);
    });
    // delete wishlist product
    app.delete("/wishlist/delete/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const result = await wishListCollection.deleteOne({ _id: new ObjectId(id) });
        res.send(result);
    } catch (error) {
        res.status(500).send({ message: "Delete failed", error: error.message });
    }
});
    //  add product
    app.post("/add-product", async (req, res) => {
      const property = req.body;
      const result = await productCollection.insertOne(property);
      res.send(result);
    });
    // add a product to wishlist
    app.post("/wishlist", async (req, res) => {
      const wishList = req.body;

      const query = {
        userEmail: wishList.userEmail,
        productId: wishList.productId,
      };

      const existingItem = await wishListCollection.findOne(query);

      if (existingItem) {
        return res.status(409).send({
          success: false,
          message: "This product is already locked into your wishlist!",
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
        productId: cartItem.productId,
      };

      const existingItem = await cartCollection.findOne(query);

      if (existingItem) {
        const updateDoc = {
          $inc: { quantity: 1 },
        };
        const result = await cartCollection.updateOne(query, updateDoc);
        return res.send({
          success: true,
          message: "Product quantity updated in cart!",
          result,
        });
      } else {
        cartItem.quantity = 1;
        const result = await cartCollection.insertOne(cartItem);
        return res.send({
          success: true,
          message: "Product added to cart!",
          result,
        });
      }
    });
    // add review
    app.post("/reviews", async (req, res) => {
      const review = req.body;
      const result = await reviewCollection.insertOne(review);
      res.send(result);
    });
    // add orders
    app.post("/orders", async (req, res) => {
      const { productId, userEmail } = req.body;

      try {
        // ১. অর্ডার সেভ করা (এটি ঠিক আছে)
        await ordersCollection.insertOne(req.body);

        // ২. প্রোডাক্টের স্টক ১ কমানো (এখানেই ভুল হচ্ছিল, ObjectId কনভার্ট করতে হবে)
        const updateResult = await productCollection.updateOne(
          { _id: new ObjectId(productId) },
          { $inc: { stock: -1 } },
        );

        // চেক করা যে আসলেই আপডেট হয়েছে কি না
        if (updateResult.matchedCount === 0) {
          console.log("Product not found with ID:", productId);
        }

        // ৩. ইউজারের কার্ট থেকে রিমুভ করা
        // এখানেও নিশ্চিত করুন productId স্ট্রিং হিসেবে আছে কি না
        await cartCollection.deleteOne({
          productId: productId,
          userEmail: userEmail,
        });

        res.send({ success: true });
      } catch (error) {
        // এররটি কনসোলে প্রিন্ট করুন যাতে বুঝতে পারেন সমস্যা কোথায়
        console.error("Order API Error:", error);
        res
          .status(500)
          .send({ message: "Transaction failed", error: error.message });
      }
    });
    // checkout
   app.post("/checkout", async (req, res) => {
    const { items, email, userName, total } = req.body;
    try {
        // ১. প্রতিটি আইটেমের জন্য অর্ডার ডাটা তৈরি
        const orderData = items.map(item => ({
            productId: item.productId,
            userName: userName,
            userEmail: email,
            productName: item.name,
            price: Number(item.price),
            image: item.image,
            date: new Date().toLocaleDateString(),
            status: "Paid",
            quantity: item.quantity
        }));

        // ২. অর্ডার কালেকশনে সেভ
        await ordersCollection.insertMany(orderData);

        // ৩. কার্ট ক্লিয়ার
        await cartCollection.deleteMany({ userEmail: email });
        
        res.send({ success: true });
    } catch (error) {
        res.status(500).send({ message: "Checkout failed", error: error.message });
    }
});
// add vendor application
app.post("/vendor-requests", async (req, res) => {
     const vendor = req.body;
      const result = await vendorCollection.insertOne(vendor);
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
