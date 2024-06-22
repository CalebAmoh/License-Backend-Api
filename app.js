//IMPORTS
require("dotenv").config();
const express = require("express");
const cors = require("cors");

//create express app and get port for connection
const app = express(); //create express app
const port = process.env.PORT || 4000; //port for serve

app.use(express.json());
app.use(cors());

app.use("/v1/api/license/", require("./Routes/routes"));

//server connection
app.listen(port, () => {
	console.log(`App listening on port ${port}`);
});
