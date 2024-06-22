// middleware/ValidatorResponse.js
const { validationResult } = require("express-validator");

function validatorResponse(req, res, next) {
	const result = validationResult(req);
	if (!result.isEmpty()) {
		console.log("Validation failed");
		return res.status(400).json({ status: "400", errors: result.array() });
	}
	console.log("Validation passed");
	next(); // Call next() to move to the next middleware
}

module.exports = {
	validatorResponse
};
