// routes/parameters.js
const express = require("express");
const router = express.Router();
const { addParam, getParam } = require("../Controllers/ParameterController");
const { validatorResponse } = require("../middleware/ValidatorResponse");
const validationRules = require("../middleware/RequestValidator");
require("dotenv").config();


// Route definition
router.post("/add-param", validationRules.addParam, validatorResponse, addParam);
router.get("/get-param", validationRules.selectParam,validatorResponse, getParam);



router.all("*", (req, res) => {
	res.status(403).json({ code: "404", message: "route not found" });
});

module.exports = router;
