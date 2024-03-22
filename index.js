const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
require('dotenv').config()
require('mongodb');

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  count: {
    type: Number,
    default: 0,
  },
  log: [{
    description: String,
    duration: Number,
    date: { type: Date, default: Date.now }
  }]
});

let User = mongoose.model('User', userSchema)


// Middleware para analizar el cuerpo de la solicitud en formato de formulario
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


app.get("/api/users", async function(req, res) {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    console.error('Error al obtener los usuarios:', error);
    res.status(500).send('Error interno del servidor');
  }
});

app.post("/api/users", async function(req, res) {
  let newUser = new User({username: req.body.username})
  await newUser.save();
  res.json({username: newUser.username, _id: newUser._id})
})

app.post("/api/users/:_id/exercises", async function(req, res) {
  const {description, duration} = req.body;
  date = new Date().toDateString();
  if (req.body.date) {
    date = new Date(req.body.date).toDateString();
  } 
  id = req.params._id;
  
  try {
    const user = await User.findOneAndUpdate(
      {_id: id},
      {
        $push: { log: { description, duration, date } },
        $inc: { count: 1 }
      },
      {new: true} );
    let responseObject = {_id: id, username: user.username, date: date, duration: parseInt(duration), description: description}
    res.send(responseObject)

  } catch(error) {
    console.error('Error al obtener el usuario:', error);
    res.status(500).send('Error interno del servidor');
  }
})

app.get("/api/users/:_id/logs", async function(req, res) {
  const id = req.params._id;
  const { from, to, limit } = req.query;
  try {
    const user = await User.findById(id);
    console.log(user.log);
    let logs = user.log;

    logs.map(log => {
      date: log.date.toDateString();
    });

    if (from) {
      const fromDate = new Date(from);
      logs = logs.filter(log => new Date(log.date) >= fromDate);
    }

    if (to) {
      const toDate = new Date(to);
      logs = logs.filter(log => new Date(log.date) <= toDate);
    }

    if (limit) {
      logs = logs.slice(0, +limit);
    }

    logs.map(log => {
      date: log.date.toDateString();
    });

    let myLogs = logs.map((l) => ({
      description: l.description,
      duration: l.duration,
      date: l.date.toDateString(),
    }));

    let objSend = {_id: user._id, username: user.username, count: user.count, log: myLogs}

    res.send(objSend);
  } catch(error) {
    console.error('Error al obtener el usuario:', error);
    res.status(500).send('Error interno del servidor');
  }
});


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
