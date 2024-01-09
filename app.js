const express = require('express');
const connectDB = require('./config/db');
const routes = require("./routes/api/albums");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();

app.use(cors({ origin: true, credentials: true }));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/api/books", routes);

connectDB();

app.get('/', (req, res) => res.send('Hello world!'));
const port = process.env.PORT || 8082;
app.listen(port, () => console.log(`Server running on port ${port}`));