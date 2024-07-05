// routes/parameters.js
const express = require("express");
const router = express.Router();
const {
	addParam,
	getParam,
	getLicenseFormParameters
} = require("../Controllers/ParameterController");
const {
	generateLicense,
	getBankDetails,
	reactivateLicense,
	ammendLicenseDetails
} = require("../Controllers/LicenseController");
const { validatorResponse } = require("../middleware/ValidatorResponse");
const validationRules = require("../middleware/RequestValidator");
require("dotenv").config();

// Route definition

//handles paramater activities
router.post(
	"/add-param",
	validationRules.addParam,
	validatorResponse,
	addParam
);
router.get(
	"/get-param",
	validationRules.selectParam,
	validatorResponse,
	getParam
);
router.get(
	"/get-license-parameters",
	getLicenseFormParameters
);

//handles license activities
router.post(
	"/generate-license",
	validationRules.generateLicense,
	validatorResponse,
	generateLicense
);
router.post(
	"/reactivate-license",
	validationRules.generateLicense,
	validatorResponse,
	reactivateLicense
);
router.post(
	"/amend-license-details",
	validationRules.generateLicense,
	validatorResponse,
	ammendLicenseDetails
);
router.get(
	"/get-bank-details",
	validationRules.selectBankDetails,
	validatorResponse,
	getBankDetails
);

router.all("*", (req, res) => {
	res.status(403).json({ code: "404", message: "route not found" });
});

module.exports = router;
