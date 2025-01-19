const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion } = require("mongodb");

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
    const coursesCollection = client.db("greenfieldUniversityDB").collection("courses");
    const studentsCollection = client.db("greenfieldUniversityDB").collection("students");
    const instructorsCollection = client.db("greenfieldUniversityDB").collection("instructors");
    const announcementsCollection = client.db("greenfieldUniversityDB").collection("announcements");

    // registration related apis

    // registration
    app.patch("/auth/register", async (req, res) => {
      const { id, role, name, email } = req.body;
      const collection = role === "Student" ? studentsCollection : instructorsCollection;
      const filter = { [`${role.toLowerCase()}Id`]: id };
      const updateDoc = {
        $set: {
          isRegistered: true,
          name,
          email,
        },
      };
      const result = await collection.updateOne(filter, updateDoc);

      res.send(result);
    });

    // id validation
    app.post("/auth/validate", async (req, res) => {
      const { id, role } = req.body;
      if (role === "Student") {
        const student = await studentsCollection.findOne({ studentId: id });
        if (student) {
          if (student.isRegistered) {
            res.send({ success: false, message: "Student already registered" });
          } else {
            res.send({ success: true, message: "ID is valid" });
          }
        } else {
          res.send({ success: false, message: "Invalid student ID" });
        }
      } else if (role === "Instructor") {
        const instructor = await instructorsCollection.findOne({ instructorId: id });
        if (instructor) {
          if (instructor.isRegistered) {
            res.send({ success: false, message: "Instructor already registered" });
          } else {
            res.send({ success: true, message: "ID is valid" });
          }
        } else {
          res.send({ success: false, message: "Invalid instructor ID" });
        }
      }
    });

    // course related apis

    app.get("/courses", async (req, res) => {
      const result = await coursesCollection.find().toArray();
      res.send(result);
    });

    // announcements related apis

    app.get("/announcements", async (req, res) => {
      const result = await announcementsCollection.find().toArray();
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
