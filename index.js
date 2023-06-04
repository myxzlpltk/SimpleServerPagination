const express = require('express')
const app = express()
const port = 80

const { faker } = require('@faker-js/faker');
const collect = require('collect.js');

function createUser(id) {
  faker.seed(42 + id);

  let isDetected = faker.datatype.boolean(0.8)

  return {
    "_seed": id,
    "filename": faker.string.uuid(),
    "email": faker.internet.email().toLowerCase(),
    "fileURL": faker.image.urlLoremFlickr({ category: 'nature' }),
    "isDetected": isDetected,
    "label": isDetected ? faker.helpers.arrayElement(["Healthy", "Phoma", "Miner", "Rust"]) : "",
    "inferenceTime": isDetected ? faker.number.int({ min: 2_000, max: 10_000 }) : 0,
    "createdAt": (1685572000 - id * 3600) * 1000,
    "detectedAt": isDetected ? (1685572000 - id * 3600) * 1000 : 0,
  }
}

const data = collect(Array.from({ length: 1000 }, (v, i) => i + 1).map(i => createUser(i)))

app.use(express.urlencoded())

app.get('/', (req, res) => {
  res.send("Hello, world!")
})

app.get('/megatron', (req, res) => {
  // Get data and query parameters
  var { after, perPage, startDate, endDate, labels } = req.query
  var list = data

  // Pagination
  if (after) {
    list = list.skipUntil(item => {
      return item.filename == after
    })
    list = list.skip(1)
  }

  // Filter date
  if (startDate && endDate) {
    list = list.filter(value => value.createdAt >= startDate && value.createdAt <= endDate)
  }

  // Filter label
  if (labels) {
    list = list.filter(value => !value.isDetected || labels.includes(value.label))
  }

  // Limit
  list = list.take(Math.max(10, Math.min(perPage ?? 10, 50)))

  // Send data
  res.setHeader('Content-Type', 'application/json');
  res.json(list.toArray())
})

app.get('/freaky', (req, res) => {
  // Get data and query parameters
  var { id } = req.query
  var list = data

  // Find data
  try {
    var single = list.firstOrFail(item => item.filename == id)
    res.json(single)
  } catch (err) {
    res.status(404).send({message: "Not found"})
  }
})


app.listen(port, () => {
  console.log(`Listening on port ${port}`)
})