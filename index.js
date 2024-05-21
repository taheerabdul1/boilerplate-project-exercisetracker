require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const app = express();
const bodyParser = require("body-parser");

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());
app.use(cors());
app.use(express.static("public"));

const exerciseSchema = new mongoose.Schema({
  username: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: Date, required: true },
});

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
});

const logSchema = new mongoose.Schema({
  username: { type: String, required: true },
  count: { type: Number, required: true },
  log: [{ type: mongoose.Schema.Types.ObjectId, ref: "Exercise" }],
});

const Log = mongoose.model("Log", logSchema);
const User = mongoose.model("User", userSchema);
const Exercise = mongoose.model("Exercise", exerciseSchema);

mongoose.connect(process.env.MONGODB_URI);

/*
ROUTES
*/
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.post("/api/users", async (req, res) => {
  let newUser = new User({
    username: req.body.username,
  });
  await newUser.save();
  res.json(newUser);
});

app.get("/api/users", async (req, res) => {
  let users = await User.find();
  res.json(users);
});

app.post("/api/users/:_id/exercises", async (req, res) => {
  let user = await User.findById(req.params._id);
  let exercise = new Exercise({
    username: user.username,
    description: req.body.description,
    duration: req.body.duration,
    date: req.body.date || new Date().toDateString(),
  });
  await exercise.save();
  res.json({
    username: user.username,
    description: exercise.description,
    duration: exercise.duration,
    date: exercise.date.toDateString(),
    _id: user._id,
  });
});

app.get("/api/users/:_id/logs", async (req, res) => {
  let from = req.query.from ? new Date(req.query.from) : null;
  let to = req.query.to ? new Date(req.query.to) : null;
  let limit = req.query.limit ? parseInt(req.query.limit) : null;

  let user = await User.findById(req.params._id);
  let exercises = await Exercise.find({ username: user.username });
  if (from) {
    exercises = exercises.filter((exercise) => exercise.date >= from);
  }
  if (to) {
    exercises = exercises.filter((exercise) => exercise.date <= to);
  }
  if (limit) {
    exercises = exercises.slice(0, limit);
  }
  res.json({
    _id: user._id,
    username: user.username,
    count: exercises.length,
    log: exercises.map((exercise) => ({
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date.toDateString(),
    })),
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
