const { check } = require("express-validator");

/***********************************************************************************************************
 * handles all request validations
 * 
 * Activities in {
	* ParamsValidator() - for validating parameter requests
 * }
 ***************************************************************************************************************/

const validationRules = {
	addParam: [
		check("code_type")
			.notEmpty()
			.isLength({ max: 24 })
			.withMessage(
				"code_type is required and length must be less than 24 characters"
			),
		check("code_desc")
			.notEmpty()
			.isLength({ max: 24 })
			.withMessage(
				"code_desc is required and length must be less than 24 characters"
			),
		check("status").notEmpty().withMessage("status is required")
	],

	selectParam: [check("code_type").trim().notEmpty().withMessage("code type is required")]
};

module.exports = validationRules;
