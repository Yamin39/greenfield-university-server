const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();
const port = process.env.PORT || 5000;

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://greenfield-university.netlify.app",
    ],
    credentials: true,
  })
);
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const { default: Stripe } = require("stripe");

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
    const eventsCollection = client.db("greenfieldUniversityDB").collection("events");
    const productsCollection = client.db("greenfieldUniversityDB").collection("products");
    const newsCollection = client.db("greenfieldUniversityDB").collection("news");
    const wishlistCollection = client.db("greenfieldUniversityDB").collection("wishlist");
    const cartCollection = client.db("greenfieldUniversityDB").collection("cart");
    const contactCollection = client.db("greenfieldUniversityDB").collection("contact");
    const queryCollection = client.db("greenfieldUniversityDB").collection("query");
    const paidCart = client.db("greenfieldUniversityDB").collection("paidCart");
    const newsletterCollection = client.db("greenfieldUniversityDB").collection("newsletter");
    const purchasedCoursesCollection = client.db("greenfieldUniversityDB").collection("purchasedCourses");

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

      if (role === "Instructor") {
        await instructorsCollection.insertOne({
          name,
          email,
          universityId: id,
          designation: "",
          img: "",
          rating: (Math.random() * (5.0 - 4.1) + 4.1).toFixed(1),
          bio: "",
          address: "",
          phoneNumber: "",
        });
      }

      if (updateIsRegistered.modifiedCount === 1) {
        const user = await usersCollection.insertOne({
          name,
          email,
          role,
          universityId: id,
        });
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
      const universityId = await universityIdsCollection.findOne({
        universityId: id,
      });
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

    // get role
    app.get("/auth/role", async (req, res) => {
      const { email } = req.query;
      const user = await usersCollection.findOne({ email });
      if (user) {
        res.send({ role: user.role.toLowerCase() });
      } else {
        res.send({ role: null });
      }
    });

    // registered students

    app.get("/students", async (req, res) => {
      const result = await usersCollection.find({ role: "Student" }).toArray();
      res.send(result);
    });

    // users related apis

    app.get("/users", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const result = await usersCollection.findOne(query);
      res.send(result);
    });

    app.patch("/users/:email", async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const query = { email: email };
      const updateDoc = {
        $set: user,
      };
      const result = await usersCollection.updateOne(query, updateDoc);
      res.send(result);
    });

    // instructor related apis

    app.get("/instructors", async (req, res) => {
      const { email } = req.query;

      if (email) {
        const query = { email: email };
        const result = await instructorsCollection.findOne(query);
        return res.send(result);
      }

      const result = await instructorsCollection.find().toArray();
      res.send(result);
    });

    app.get("/instructor/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await instructorsCollection.findOne(query);
      res.send(result);
    });

    app.patch("/instructor/:email", async (req, res) => {
      const email = req.params.email;
      const instructor = req.body;
      const query = { email: email };
      const updateDoc = {
        $set: instructor,
      };
      const result = await instructorsCollection.updateOne(query, updateDoc);
      res.send(result);
    });

    // blogs related apis

    // app.get('/approvedBlogs', async(req, res) =>{
    //   const result = await blogsCollection.find({status : 'approved'}).toArray();
    //   res.send(result)
    // })

    app.get("/blogs", async (req, res) => {
      const { email, role } = req.query;

      // return
      if (role === "admin") {
        const result = await blogsCollection.find({ status: "approved" }).toArray();
        return res.send(result);
      } else if (email) {
        const query = { "author.email": email };
        const result = await blogsCollection.find(query).toArray();
        return res.send(result);
      }

      const result = await blogsCollection.find().toArray();
      res.send(result);
    });

    app.get("/blogs/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await blogsCollection.findOne(query);
      res.send(result);
    });

    // delete a blog

    app.delete("/blog/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await blogsCollection.deleteOne(query);
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

    app.post("/blog", async (req, res) => {
      const blog = req.body;
      const result = await blogsCollection.insertOne(blog);
      res.send(result);
    });

    app.patch("/blog/:id", async (req, res) => {
      const id = req.params.id;
      const blog = req.body;
      console.log(blog);
      const query = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          title: blog.title,
          description: blog.description,
          thumbnail: blog.thumbnail,
          timestamp: blog.timestamp,
          tags: blog.tags,
          category: blog.category,
          "author.role": blog.author.role,
        },
      };
      const result = await blogsCollection.updateOne(query, updatedDoc);
      res.send(result);
    });

    app.patch("/approveBlog/:id", async (req, res) => {
      const status = req.body.status;
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          status: status,
        },
      };
      const result = await blogsCollection.updateOne(query, updatedDoc);
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

    app.post("/announcement", async (req, res) => {
      const announcement = req.body;
      const result = await announcementsCollection.insertOne(announcement);
      res.send(result);
    });

    app.delete("/announcement/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await announcementsCollection.deleteOne(query);
      res.send(result);
    });

    app.patch("/announcement/:id", async (req, res) => {
      const id = req.params.id;
      const announcement = req.body;
      const query = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          title: announcement.title,
          timestamp: announcement.timestamp,
          description: announcement.description,
        },
      };

      const result = await announcementsCollection.updateOne(query, updatedDoc);
      res.send(result);
    });

    // faqs related apis

    app.get("/faqs", async (req, res) => {
      const result = await faqsCollection.find().toArray();
      res.send(result);
    });
    app.get("/faqs/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await faqsCollection.findOne(query);
      res.send(result);
    });

    app.post("/addFaq", async (req, res) => {
      const addFaq = req.body;
      const result = await faqsCollection.insertOne(addFaq);
      console.log(result);
      res.send(result);
    });
    app.patch("/updateFaq/:id", async (req, res) => {
      const id = req.params.id;
      const updateFaq = req.body;
      const query = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          title: updateFaq.title,
          description: updateFaq.description,
        },
      };
      const result = await faqsCollection.updateOne(query, updateDoc);
      console.log(result);
      res.send(result);
    });
    app.delete("/deleteFaq/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await faqsCollection.deleteOne(query);
      res.send(result);
    });

    // gallery images related apis

    app.get("/gallery", async (req, res) => {
      const result = await galleryImagesCollection.find().sort({ _id: -1 }).toArray();
      res.send(result);
    });

    app.post("/gallery", async (req, res) => {
      const image = req.body;
      const result = await galleryImagesCollection.insertOne(image);
      res.send(result);
    });

    app.delete("/gallery/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await galleryImagesCollection.deleteOne(query);
      res.send(result);
    });

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

    app.get("/userCourses", async (req, res) => {
      const email = req.query.email;
      const query = { "instructorDetails.email": email };
      const result = await coursesCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/course/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await coursesCollection.findOne(query);
      res.send(result);
    });

    app.post("/course", async (req, res) => {
      const course = req.body;
      console.log(course);
      const result = await coursesCollection.insertOne(course);
      res.send(result);
    });

    app.delete("/course/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await coursesCollection.deleteOne(query);
      res.send(result);
    });

    app.patch("/approveCourse/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const status = req.body.status;
      const updatedDoc = {
        $set: {
          status: status,
        },
      };

      const result = await coursesCollection.updateOne(query, updatedDoc, {
        upsert: true,
      });
      res.send(result);
    });

    // testimonials related api.

    app.post("/testimonial", async (req, res) => {
      const testimonial = req.body;
      console.log(testimonial);
      const result = await testimonialsCollection.insertOne(testimonial);
      res.send(result);
    });

    app.get("/mytestimonial", async (req, res) => {
      const { email } = req.query;

      const query = { email: email };

      const result = await testimonialsCollection.findOne(query);
      console.log("mttest ", result);
      res.send(result);
    });

    app.delete("/testimonial", async (req, res) => {
      const { _id } = req.body;
      console.log("_id in delete  ", _id);
      const query = { _id: new ObjectId(_id) };

      const result = await testimonialsCollection.deleteOne(query);
      console.log("detele result  ", result);
      res.send(result);
    });

    app.put("/mytestimonial", async (req, res) => {
      const { email, updatedTestimonial } = req.body;

      if (!email || !updatedTestimonial) {
        return res.status(400).json({ message: "Email and updatedTestimonial are required" });
      }

      const query = { email: email };
      const updateDoc = {
        $set: updatedTestimonial,
      };

      const result = await testimonialsCollection.updateOne(query, updateDoc);

      if (result.matchedCount === 0) {
        return res.status(404).json({ message: "Testimonial not found" });
      }

      res.json({ message: "Testimonial updated successfully", result });
    });

    // Connect to the MongoDB cluster

    // events related apis

    app.get("/events", async (req, res) => {
      const result = await eventsCollection.find().toArray();
      res.send(result);
    });

    app.get("/event/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await eventsCollection.findOne(query);
      console.log(result);
      res.send(result);
    });

    app.post("/event", async (req, res) => {
      const event = req.body;
      const result = await eventsCollection.insertOne(event);
      res.send(result);
    });

    app.patch("/event/:id", async (req, res) => {
      const id = req.params.id;
      const event = req.body;
      const query = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: event,
      };
      const result = await eventsCollection.updateOne(query, updateDoc);
      res.send(result);
    });

    app.delete("/event/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await eventsCollection.deleteOne(query);
      res.send(result);
    });

    // products related apis

    app.get("/products", async (req, res) => {
      const result = await productsCollection.find().toArray();
      res.send(result);
    });
    app.post("/product", async (req, res) => {
      const product = req.body;
      const result = await productsCollection.insertOne(product);
      res.send(result);
    });
    app.get("/product/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await productsCollection.findOne(query);
      res.send(result);
    });
    app.patch("/updateProduct/:id", async (req, res) => {
      const id = req.params.id;
      const updateProduct = req.body;
      const query = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          name: updateProduct.name,
          category: updateProduct.category,
          pic: updateProduct.pic,
          price: updateProduct.price,
          discount: updateProduct.discount,
          desc: updateProduct.desc,
          timestamp: updateProduct.timestamp,
        },
      };
      const result = await productsCollection.updateOne(query, updateDoc);
      console.log(result);
      res.send(result);
    });
    app.delete("/product/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await productsCollection.deleteOne(query);
      res.send(result);
    });

    app.get("/product/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await productsCollection.findOne(query);
      res.send(result);
    });

    // add a review
    app.patch("/product/:id/review", async (req, res) => {
      const id = req.params.id;
      const newReview = req.body;
      const query = { _id: new ObjectId(id) };
      const updateDoc = {
        $push: {
          reviews: newReview,
        },
      };
      const result = await productsCollection.updateOne(query, updateDoc);
      res.send(result);
    });

    // news related apis

    app.get("/newses", async (req, res) => {
      const result = await newsCollection.find().toArray();
      res.send(result);
    });

    // wishlist related apis

    app.get("/wishlist", async (req, res) => {
      const { email, productId } = req.query;

      let query = {};

      if (productId) {
        query = {
          "user.email": email,
          productId: productId,
        };
      } else {
        query = {
          "user.email": email,
        };
      }

      const result = await wishlistCollection.find(query).toArray();
      res.send(result);
    });

    app.post("/wishlist", async (req, res) => {
      const wishlist = req.body;

      // check if user already has the product in their wishlist
      const query = {
        "user.email": wishlist.user.email,
        productId: wishlist.productId,
      };

      const existingWishlist = await wishlistCollection.findOne(query);

      if (existingWishlist) {
        return res.send({ message: "Product already in wishlist" });
      }

      const result = await wishlistCollection.insertOne(wishlist);
      res.send(result);
    });

    app.delete("/wishlist/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await wishlistCollection.deleteOne(query);
      res.send(result);
    });

    // cart related apis

    app.get("/cart", async (req, res) => {
      const { email } = req.query;

      const query = {
        "user.email": email,
      };

      const result = await cartCollection.find(query).toArray();
      res.send(result);
    });

    app.post("/cart", async (req, res) => {
      const cart = req.body;
      console.log(cart);
      // check if user already has the product in their cart
      const query = {
        "user.email": cart.user.email,
        productId: cart.productId,
      };

      const existingCart = await cartCollection.findOne(query);

      if (existingCart) {
        return res.send({ message: "Product already in cart" });
      }

      const result = await cartCollection.insertOne(cart);
      res.send(result);
    });

    app.delete("/cart/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await cartCollection.deleteOne(query);
      res.send(result);
    });

    //delete all cart items
    app.delete("/carts", async (req, res) => {
      const { email } = req.query;

      const query = {
        "user.email": email,
      };

      const allPaidcart = await cartCollection.find(query).toArray();

      const paidCollection = await paidCart.insertMany(allPaidcart);

      const result = await cartCollection.deleteMany(query);
      res.send(result);
    });

    // update cart quantity

    app.patch("/cart/:id", async (req, res) => {
      const id = req.params.id;
      const updatedCart = req.body;

      const query = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          quantity: updatedCart.quantity,
        },
      };
      const result = await cartCollection.updateOne(query, updateDoc);
      res.send(result);
    });

    // contact related apis

    app.get("/contact", async (req, res) => {
      const result = await contactCollection.find().toArray();
      res.send(result);
    });

    app.post("/contact", async (req, res) => {
      const contact = req.body;
      const result = await contactCollection.insertOne(contact);
      res.send(result);
    });

    app.delete("/contact/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await contactCollection.deleteOne(query);
      res.send(result);
    });

    // query related apis

    app.get("/queries", async (req, res) => {
      const { email } = req.query;

      if (email) {
        const query = { "author.email": email };
        const result = await queryCollection.find(query).toArray();
        return res.send(result);
      }

      const result = await queryCollection.find().toArray();
      res.send(result);
    });

    app.get("/query/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await queryCollection.findOne(query);
      res.send(result);
    });

    app.post("/query", async (req, res) => {
      const query = req.body;
      const result = await queryCollection.insertOne(query);
      res.send(result);
    });

    app.patch("/query/:id", async (req, res) => {
      const id = req.params.id;
      const query = req.body;
      const queryId = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: query,
      };
      const result = await queryCollection.updateOne(queryId, updateDoc);
      res.send(result);
    });

    app.delete("/query/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await queryCollection.deleteOne(query);
      res.send(result);
    });

    app.patch("/query/upvote/add/:id", async (req, res) => {
      const id = req.params.id;
      const { email } = req.body;

      const query = { _id: new ObjectId(id) };
      const updateDoc = {
        $push: {
          upVotes: email,
        },
      };
      const result = await queryCollection.updateOne(query, updateDoc);
      res.send(result);
    });

    app.patch("/query/upvote/remove/:id", async (req, res) => {
      const id = req.params.id;
      const { email } = req.body;

      const query = { _id: new ObjectId(id) };
      const updateDoc = {
        $pull: {
          upVotes: email,
        },
      };
      const result = await queryCollection.updateOne(query, updateDoc);
      res.send(result);
    });

    // add comment to query
    app.patch("/query/comment/add/:id", async (req, res) => {
      const id = req.params.id;
      const newComment = req.body;

      // add a unique id to the comment
      newComment._id = new ObjectId();

      const query = { _id: new ObjectId(id) };
      const updateDoc = {
        $push: {
          comments: newComment,
        },
      };
      const result = await queryCollection.updateOne(query, updateDoc);
      res.send(result);
    });

    // delete a comment from query
    app.patch("/query/comment/remove/:id", async (req, res) => {
      const id = req.params.id;
      const { commentId } = req.body;

      const query = { _id: new ObjectId(id) };
      const updateDoc = {
        $pull: {
          comments: {
            _id: new ObjectId(commentId),
          },
        },
      };
      const result = await queryCollection.updateOne(query, updateDoc);
      res.send(result);
    });

    // like a comment
    app.patch("/query/comment/like/add/:id", async (req, res) => {
      const id = req.params.id;
      const { commentId, email } = req.body;

      const query = {
        _id: new ObjectId(id),
        "comments._id": new ObjectId(commentId),
      };
      const updateDoc = {
        $push: {
          "comments.$.likes": email,
        },
      };
      const result = await queryCollection.updateOne(query, updateDoc);
      res.send(result);
    });

    // unlike a comment
    app.patch("/query/comment/like/remove/:id", async (req, res) => {
      const id = req.params.id;
      const { commentId, email } = req.body;

      const query = {
        _id: new ObjectId(id),
        "comments._id": new ObjectId(commentId),
      };
      const updateDoc = {
        $pull: {
          "comments.$.likes": email,
        },
      };
      const result = await queryCollection.updateOne(query, updateDoc);
      res.send(result);
    });

    // add a reply to a comment in a query
    app.patch("/query/comment/reply/add/:id", async (req, res) => {
      const id = req.params.id;
      const { commentId, reply } = req.body;

      // add a unique id to the reply
      reply._id = new ObjectId();

      const query = {
        _id: new ObjectId(id),
        "comments._id": new ObjectId(commentId),
      };
      const updateDoc = {
        $push: {
          "comments.$.replies": reply,
        },
      };
      const result = await queryCollection.updateOne(query, updateDoc);
      res.send(result);
    });

    // delete a reply from a comment in a query
    app.patch("/query/comment/reply/remove/:id", async (req, res) => {
      const id = req.params.id;
      const { commentId, replyId } = req.body;

      const query = {
        _id: new ObjectId(id),
        "comments._id": new ObjectId(commentId),
      };
      const updateDoc = {
        $pull: {
          "comments.$.replies": {
            _id: new ObjectId(replyId),
          },
        },
      };
      const result = await queryCollection.updateOne(query, updateDoc);
      res.send(result);
    });

    // like a reply to a comment in a query
    app.patch("/query/comment/reply/like/add/:id", async (req, res) => {
      const id = req.params.id;
      const { commentId, replyId, email } = req.body;

      const query = { _id: new ObjectId(id) };

      const updateDoc = {
        $push: {
          "comments.$[comment].replies.$[reply].likes": email,
        },
      };

      const options = {
        arrayFilters: [{ "comment._id": new ObjectId(commentId) }, { "reply._id": new ObjectId(replyId) }],
      };

      const result = await queryCollection.updateOne(query, updateDoc, options);
      res.send(result);
    });

    // unlike a reply to a comment in a query
    app.patch("/query/comment/reply/like/remove/:id", async (req, res) => {
      const id = req.params.id;
      const { commentId, replyId, email } = req.body;

      const query = { _id: new ObjectId(id) };

      const updateDoc = {
        $pull: {
          "comments.$[comment].replies.$[reply].likes": email,
        },
      };

      const options = {
        arrayFilters: [{ "comment._id": new ObjectId(commentId) }, { "reply._id": new ObjectId(replyId) }],
      };

      const result = await queryCollection.updateOne(query, updateDoc, options);
      res.send(result);
    });

    // stripe payment related apis

    const stripeInstance = new Stripe(process.env.STRIPE_KEY);

    app.post("/paymentStripe", async (req, res) => {
      const { price } = req.body;
      console.log("Price:", price);

      const amount = parseInt(price * 100);

      console.log("Amount:", amount);

      const paymentIntent = await stripeInstance.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ["card"],
      });
      console.log("PaymentIntent:", paymentIntent.client_secret);

      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });

    // paid cart related apis
    //all for admin
    app.get("/paidCart", async (req, res) => {
      const result = await paidCart.find().toArray();
      res.send(result);
    });

    app.post("/UserpaidCart", async (req, res) => {
      const { email } = req.body; // Extract email from the request body
      console.log("email", email);

      if (!email) {
        return res.status(400).send({ error: "Email is required" });
      }

      const query = {
        "user.email": email,
      };
      console.log("query", query);

      try {
        const result = await paidCart.find(query).toArray();
        res.send(result);
      } catch (error) {
        console.error("Error fetching purchased books:", error);
        res.status(500).send({ error: "Internal server error" });
      }
    });

    app.get("/unregisteredInstructors", async (req, res) => {
      const result = await universityIdsCollection
        .find({
          universityId: { $regex: "IN$" },
          isRegistered: false,
        })
        .toArray();

      res.send(result);
    });
    app.get("/unregisteredStudets", async (req, res) => {
      const result = await universityIdsCollection
        .find({
          universityId: { $regex: "ST$" },
          isRegistered: false,
        })
        .toArray();

      res.send(result);
    });

    app.get("/unregisteredStudent", async (req, res) => {
      const result = await instructorsCollection.find().toArray();
      res.send(result);
    });

    // newsletter related apis

    app.get("/newsletter", async (req, res) => {
      const result = await newsletterCollection.find().toArray();
      res.send(result);
    });

    app.post("/newsletter", async (req, res) => {
      const newsletter = req.body;
      const result = await newsletterCollection.insertOne(newsletter);
      res.send(result);
    });

    app.delete("/newsletter/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await newsletterCollection.deleteOne(query);
      res.send(result);
    });

    // purchased courses related apis

    app.get("/purchasedCourses", async (req, res) => {
      const { id, email } = req.query;

      console.log(id, email);

      if (id && email) {
        const query = { courseId: id, "author.email": email };
        const result = await purchasedCoursesCollection.findOne(query);
        console.log(result);
        return res.send(result);
      } else if (email) {
        const query = { "author.email": email };
        const result = await purchasedCoursesCollection.find(query).toArray();
        return res.send(result);
      }

      const result = await purchasedCoursesCollection.find().toArray();
      res.send(result);
    });

    app.post("/purchasedCourses", async (req, res) => {
      const purchasedCourse = req.body;
      const result = await purchasedCoursesCollection.insertOne(purchasedCourse);
      res.send(result);
    });

    // student statistics related apis

    /*
    app.get("/studentStatistics", async (req, res) => {
      const { email } = req.query;

      // get enrolled courses
      const enrolledCourses = await purchasedCoursesCollection.find({ "author.email": email }).toArray();

      // get Books Purchased
      const purchasedBooks = await paidCart.find({ "user.email": email }).toArray();

      // get Queries Submitted
      const queries = await queryCollection.find({ "author.email": email }).toArray();

      // get Blogs Written
      const blogs = await blogsCollection.find({ "author.email": email }).toArray();

      // get Blogs Approved
      const approvedBlogs = await blogsCollection.find({ "author.email": email, status: "approved" }).toArray();

      // get Blogs Rejected
      const rejectedBlogs = await blogsCollection.find({ "author.email": email, status: "rejected" }).toArray();

      const result = {
        enrolledCourses: enrolledCourses.length,
        purchasedBooks: purchasedBooks.length,
        queries: queries.length,
        blogs: blogs.length,
        approvedBlogs: approvedBlogs.length,
        rejectedBlogs: rejectedBlogs.length,
      };

      res.send(result);
    });
    */

    // optimized version of student statistics
    app.get("/studentStatistics", async (req, res) => {
      try {
        const { email } = req.query;

        if (!email) {
          return res.status(400).json({ error: "Email is required" });
        }

        const [enrolledCourses, purchasedBooks, queries, blogs] = await Promise.all([
          purchasedCoursesCollection.countDocuments({ "author.email": email }),
          paidCart.countDocuments({ "user.email": email }),
          queryCollection.countDocuments({ "author.email": email }),
          blogsCollection.find({ "author.email": email }).toArray(),
        ]);

        // Count approved & rejected blogs
        const approvedBlogs = blogs.filter((blog) => blog.status === "approved").length;
        const rejectedBlogs = blogs.filter((blog) => blog.status === "rejected").length;

        const result = {
          enrolledCourses,
          purchasedBooks,
          queries,
          blogs: blogs.length,
          approvedBlogs,
          rejectedBlogs,
        };

        res.json(result);
      } catch (error) {
        console.error("Error fetching student statistics:", error);
        res.status(500).json({ error: "Internal Server Error" });
      }
    });

    // instructor statistics related apis: Courses Created, Courses Approved, Blogs Written [optimized version]
    app.get("/instructorStatistics", async (req, res) => {
      try {
        const { email } = req.query;

        if (!email) {
          return res.status(400).json({ error: "Email is required" });
        }

        const [coursesCreated, coursesApproved, blogs] = await Promise.all([
          coursesCollection.countDocuments({ "instructorDetails.email": email }),
          coursesCollection.countDocuments({ "instructorDetails.email": email, status: "approved" }),
          blogsCollection.countDocuments({ "author.email": email }),
        ]);

        const result = {
          coursesCreated,
          coursesApproved,
          blogs,
        };

        res.json(result);
      } catch (error) {
        console.error("Error fetching instructor statistics:", error);
        res.status(500).json({ error: "Internal Server Error" });
      }
    });

    // admin statistics related apis

    app.get("/adminStatistics", async (req, res) => {
      try {
        const [
          revenueResult,
          totalBooksSold,
          totalApprovedCourses,
          totalApprovedBlogs,
          transactions,
          registeredStudents,
          registeredInstructors,
          unregisteredStudents,
          unregisteredInstructors,
          announcements,
          faqs,
          galleryImages,
          testimonials,
          contactRequests,
          newsletterSubscribers,
          events,
        ] = await Promise.all([
          // Revenue
          paidCart
            .aggregate([{ $group: { _id: null, total: { $sum: "$price" } } }])
            .toArray()
            .catch(() => []),

          // Counts with error catching
          paidCart.countDocuments().catch(() => 0),
          coursesCollection.countDocuments({ status: "approved" }).catch(() => 0),
          blogsCollection.countDocuments({ status: "approved" }).catch(() => 0),
          paidCart
            .find()
            .toArray()
            .catch(() => []),
          usersCollection.countDocuments({ role: "Student" }).catch(() => 0),
          usersCollection.countDocuments({ role: "Instructor" }).catch(() => 0),
          universityIdsCollection
            .countDocuments({
              universityId: { $regex: "ST$" },
              isRegistered: false,
            })
            .catch(() => 0),
          universityIdsCollection
            .countDocuments({
              universityId: { $regex: "IN$" },
              isRegistered: false,
            })
            .catch(() => 0),
          announcementsCollection.countDocuments().catch(() => 0),
          faqsCollection.countDocuments().catch(() => 0),
          galleryImagesCollection.countDocuments().catch(() => 0),
          testimonialsCollection.countDocuments().catch(() => 0),
          contactCollection.countDocuments().catch(() => 0),
          newsletterCollection.countDocuments().catch(() => 0),
          eventsCollection.countDocuments().catch(() => 0),
        ]);

        const result = {
          revenue: revenueResult.length > 0 ? revenueResult[0].total : 0,
          totalBooksSold,
          totalApprovedCourses,
          totalApprovedBlogs,
          purchasedItems: transactions,
          registeredStudents,
          registeredInstructors,
          unregisteredStudents,
          unregisteredInstructors,
          announcements,
          faqs,
          galleryImages,
          testimonials,
          contactRequests,
          newsletterSubscribers,
          events,
        };

        res.json(result);
      } catch (error) {
        console.error("Full Error Context:", {
          message: error.message,
          stack: error.stack,
          name: error.name,
        });
        res.status(500).json({
          error: "Failed to load statistics",
          ...(process.env.NODE_ENV === "development" && {
            details: error.message,
            stack: error.stack,
          }),
        });
      }
    });

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
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
