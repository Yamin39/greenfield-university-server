const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.6fu63x8.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // collections
    const instructorsCollection = client.db("greenfieldUniversityDB").collection("instructors");
    const blogsCollection = client.db("greenfieldUniversityDB").collection("blogs");
    const announcementsCollection = client.db("greenfieldUniversityDB").collection("announcements");
    const universityIdsCollection = client.db("greenfieldUniversityDB").collection("universityIds");
    const usersCollection = client.db("greenfieldUniversityDB").collection("users");
    const faqsCollection = client.db("greenfieldUniversityDB").collection("faqs");
    const galleryImagesCollection = client.db("greenfieldUniversityDB").collection("galleryImages");
    const testimonialsCollection = client.db("greenfieldUniversityDB").collection("testimonials");
    const coursesCollection = client.db("greenfieldUniversityDB").collection("courses");

    // registration related apis

    // registration
    app.patch("/auth/register", async (req, res) => {
      const { id, role, name, email } = req.body;
      const filter = { universityId: id };
      const updateDoc = {
        $set: {
          isRegistered: true,
        },
      };
      const updateIsRegistered = await universityIdsCollection.updateOne(filter, updateDoc);

      if (updateIsRegistered.modifiedCount === 1) {
        const user = await usersCollection.insertOne({ name, email, role, universityId: id });
        if (user.insertedId) {
          res.send({ success: true, message: "Successfully registered" });
        } else {
          res.send({ success: false, message: "Failed to register" });
        }
      } else {
        res.send({ success: false, message: "Failed to register" });
      }
    });

    // id validation
    app.post("/auth/validate", async (req, res) => {
      const { id, role } = req.body;
      const universityId = await universityIdsCollection.findOne({ universityId: id });
      if (universityId) {
        if (universityId.isRegistered) {
          res.send({ success: false, message: `${role} already registered` });
        } else {
          res.send({ success: true, message: "ID is valid" });
        }
      } else {
        res.send({ success: false, message: `Invalid ${role} ID` });
      }
    });

    // instructor related apis

    app.get("/instructors", async (req, res) => {
      const result = await instructorsCollection.find().toArray();
      res.send(result);
    });

    app.get('/instructor/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await instructorsCollection.findOne(query);
      res.send(result)
    })

    // blogs related apis

    app.get("/blogs", async (req, res) => {
      const result = await blogsCollection.find().toArray();
      res.send(result);
    });

    app.get("/blogs/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await blogsCollection.findOne(query);
      res.send(result);
    });

    // post a comment
    app.patch("/blogs/:id/comment", async (req, res) => {
      const id = req.params.id;
      const newComment = req.body;
      const query = { _id: new ObjectId(id) };
      const updateDoc = {
        $push: {
          comments: newComment,
        },
      };
      const result = await blogsCollection.updateOne(query, updateDoc);
      res.send(result);
    });

// announcements related apis

    app.get("/announcements", async (req, res) => {
      const result = await announcementsCollection.find().toArray();
      res.send(result);
    });

    app.get("/announcement/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await announcementsCollection.findOne(query);
      res.send(result);
    });

    app.post('/announcement', async (req, res) => {
      const announcement = req.body;
      const result = await announcementsCollection.insertOne(announcement);
      res.send(result)
    })

    app.delete('/announcement/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await announcementsCollection.deleteOne(query);
      res.send(result)
    })

    // faqs related apis

    app.get("/faqs", async (req, res) => {
      const result = await faqsCollection.find().toArray();
      res.send(result);
    });

    // gallery images related apis

    app.get("/gallery", async (req, res) => {
      const result = await galleryImagesCollection.find().sort({_id : -1}).toArray();
      res.send(result);
    });

    app.post('/gallery', async (req, res) => {
      const image = req.body;
      const result = await galleryImagesCollection.insertOne(image);
      res.send(result)
    })

    app.delete('/gallery/:id', async(req, res) =>{
      const id = req.params.id;
      const query = {_id : new ObjectId(id)};
      const result = await galleryImagesCollection.deleteOne(query);
      res.send(result);
    })

    // testimonials related apis

    app.get("/testimonials", async (req, res) => {
      const result = await testimonialsCollection.find().toArray();
      res.send(result);
    });

    // courses related apis

    app.get("/courses", async (req, res) => {
      const result = await coursesCollection.find().toArray();
      res.send(result);
    });

    app.get("/course/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await coursesCollection.findOne(query);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Greenfield University server is running");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
