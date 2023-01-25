const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fileUpload = require("express-fileupload");
const fs = require("fs-extra");
const { MongoClient, ServerApiVersion } = require("mongodb");
const mongo = require("mongodb");
require("dotenv").config();
const ObjectId = mongo.ObjectId;
const app = express();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static("services"));
app.use(fileUpload());

app.get("/", (req, res) => {
  res.send("Hello World!");
});
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster1.g0q0cnp.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});
client.connect((err) => {
  const serviceCollection = client.db("creativeAgency").collection("services");
  const userSelectedCollection = client
    .db("creativeAgency")
    .collection("userSelectedService");
  const adminCollection = client.db("creativeAgency").collection("userDetails");
  const commentCollection = client.db("creativeAgency").collection("comments");

  app.post("/addService", (req, res) => {
    const file = req.files.file;
    const title = req.body.title;
    const description = req.body.description;
    const filePath = `${__dirname}/services/${file.name}`;
    file.mv(filePath, (err) => {
      if (err) {
        console.log(err);
        res.status.send({ msg: "File Upload Failed" });
      }
      return res.send({ name: file.name, path: `/${file.path}` });
    });
    const newImg = fs.readFileSync(filePath);
    const encImg = newImg.toString("base64");
    const image = {
      contentType: req.files.file.mimetype,
      size: req.files.file.size,
      img: Buffer.from(encImg, "base64"),
    };
    serviceCollection
      .insertOne({ title: title, description: description, image })
      .then((result) => {
        fs.remove(filePath, (error) => {
          if (error) {
            console.log(error);
            res.status(500).send({ msg: "File Upload Failed" });
          }

          res.send(result.acknowledged);
        });
      });
  });

  app.post("/serviceDetails", (req, res) => {
    const data = req.body;

    userSelectedCollection.insertOne(data).then((result) => {
      res.send(result.acknowledged);
    });
    // const filePath = `${__dirname}/services/${file.name}`
    // file.mv(filePath, (err) => {
    //     if (err) {
    //         console.log(err);
    //         res.status.send({ msg: 'File Upload Failed' })
    //     }
    //     return res.send({ name: file.name, path: `/${file.path}` })
    // })
    // const newImg = fs.readFileSync(filePath);
    // const encImg = newImg.toString('base64')
    // const image = {
    //     contentType: req.files.file.mimetype,
    //     size: req.files.file.size,
    //     img: Buffer.from(encImg, 'base64')
    // }
    // userSelectedCollection.insertOne({})
    //     .then(result => {
    //         fs.remove(filePath, (error) => {
    //             if (error) {
    //                 console.log(error);
    //                 res.status(500).send({ msg: 'File Upload Failed' })
    //             }

    //             res.send(result.acknowledged)
    //         })
    //     })
  });
  app.get("/services", (req, res) => {
    serviceCollection.find({}).toArray((err, docoument) => {
      res.send(docoument);
    });
  });
  app.get("/choosenService/:key", (req, res) => {
    const id = req.params.key;

    serviceCollection.find({ _id: ObjectId(id) }).toArray((err, docoument) => {
      res.send(docoument);
    });
  });
  app.post("/makeAdmin", (req, res) => {
    const email = req.body.adminemail;
    adminCollection.insertOne({ adminemail: email }).then((result) => {
      res.send(result.acknowledged);
    });
  });
  app.get("/serviseList", (req, res) => {
    const useremail = req.query.email;
    const filter = {};
    adminCollection
      .find({ adminemail: useremail })
      .toArray((err, docoument) => {
        if (docoument.length === 0) {
          filter.email = useremail;
        }
        userSelectedCollection.find(filter).toArray((err, services) => {
          res.send(services);
          // console.log(services);
        });
      });
  });
  app.post("/isAdmin", (req, res) => {
    const email = req.body.email;
    adminCollection.find({ adminemail: email }).toArray((err, docoument) => {
      res.send(docoument.length > 0);
    });
  });
  app.post("/serviceStatus", (req, res) => {
    const status = req.body.status;
    const serviceId = req.body.serviceId;
    console.log(status, serviceId);
    userSelectedCollection
      .updateOne(
        { _id: ObjectId(serviceId) },
        {
          $set: {
            setviceStatus: status,
          },
        }
      )
      .then((result) => {
        res.send(result.acknowledged);
      });
  });
  app.post("/review", (req, res) => {
    const data = req.body.data;

    commentCollection.insertOne(data).then((result) => {
      res.send(result.acknowledged);
    });
  });
  app.get("/review", (req, res) => {
    commentCollection.find({}).toArray((err, docoument) => {
      res.send(docoument);
    });
  });
});
app.listen(process.env.PORT || 5000);
