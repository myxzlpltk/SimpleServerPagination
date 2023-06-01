const express = require('express')
const app = express()
const port = 3000

const { faker } = require('@faker-js/faker');
const collect = require('collect.js');

function createUser(id) {
  faker.seed(42 + id);

  return {
    "_seed": id,
    "id": faker.string.uuid(),
    "email": faker.internet.email().toLowerCase(),
    "imageUrl": faker.image.urlLoremFlickr({ category: 'nature' }),
    "result": faker.helpers.arrayElement(["healthy", "disease-1", "disease-2", "disease-3", "disease-4"]),
    "inferenceTime": faker.number.int({ min: 2_000, max: 10_000 }),
    "createdAt": (1685572000 - id * 3600) * 1000,
    "detectedAt": (1685572000 - id * 3600) * 1000,
  }
}

const data = collect(Array.from({ length: 1000 }, (v, i) => i + 1).map(i => createUser(i)))

app.use(express.urlencoded())

app.get('/', (req, res) => {
  res.send("Hello, world!")
})

app.get('/megatron', (req, res) => {
  // Get data and query parameters
  var { start, perPage, startDate, endDate, labels } = req.query
  var list = data

  // Pagination
  if (start) {
    list = list.skipUntil(item => {
      return item.id == start
    })
    list = list.skip(1)
  }

  // Filter date
  if (startDate && endDate) {
    list = list.filter(value => value.createdAt >= startDate && value.createdAt <= endDate)
  }

  // Filter label
  if (labels) {
    list = list.filter(value => labels.includes(value.result))
  }

  // Limit
  list = list.take(Math.max(10, Math.min(perPage ?? 10, 50)))

  // Send data
  res.setHeader('Content-Type', 'application/json');
  res.json(list.toArray())
})


app.listen(port, () => {
  console.log(`Listening on port ${port}`)
})