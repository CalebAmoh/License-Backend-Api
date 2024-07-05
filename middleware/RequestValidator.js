const { check } = require("express-validator");
const { generateLicense } = require("../Controllers/LicenseController");

/***********************************************************************************************************
 * handles all request validations
 * 
 * Activities in {
	* ParamsValidator() - for validating parameter requests
 * }
 ***************************************************************************************************************/

const validationRules = {
	//validation for adding parameters to be tb_parameters
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

	//validation for updating parameters to parameters table
	updateParam: [
		check("code_type")
			.notEmpty()
			.isLength({ max: 24 })
			.withMessage(
				"code_type is required and length must be less than 24 characters"
			),
		check("id").notEmpty().withMessage("id is required"),
		check("status").notEmpty().withMessage("status is required")
	],
	//validation for selecting parameters from tb_parameters
	selectParam: [
		check("code_type").trim().notEmpty().withMessage("code type is required")
	],

	//validation for selecting bank details
	selectBankDetails: [
		check("bank_id").trim().notEmpty().withMessage("bank id is required")
	],

	//validation for generating license
	generateLicense: [
		check("bank_id").trim().notEmpty().withMessage("bank id is required"),
		check("license_frequency_id")
			.trim()
			.notEmpty()
			.withMessage("license frequence id is required"),
		check("license_type_id")
			.trim()
			.notEmpty()
			.withMessage("license type id is required"),
		check("start_date").trim().notEmpty().withMessage("start date is required"),
		check("end_date").trim().notEmpty().withMessage("end date is required"),
		check("notification_start")
			.trim()
			.notEmpty()
			.withMessage("notification start is required"),
		check("notification_frequency_id")
			.trim()
			.notEmpty()
			.withMessage("notification frequency id is required")
	]
};

module.exports = validationRules;
