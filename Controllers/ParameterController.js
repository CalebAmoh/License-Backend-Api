const { matchedData, validationResult } = require("express-validator");
const tb_parameter = "parameters";
const {
	insertData,
	selectDataWithCondition,
	selectParaWithCondition,
	selectData,
	updateData
} = require("./HelperController");

/***********************************************************************************************************
 * handles all parameters in the system
 * 
 * Activities in {
	* addParam() - for add new parameters to the system,
  * getParam() - for getting a category of parameters, requires that a code type value is passed
 * }
 ***************************************************************************************************************/

//adds new parameters
const addParam = async (req, res) => {
	try {
		const { code_type, code_desc, status } = req.body;

		/**
			* insert data into table
      * helper.insertData(@dataParam->the data to be inserted, @tableParam->table to insert data, @result->result from insert)
      */
		const result = await insertData(
			{ code_type, code_desc, status },
			tb_parameter
		);
		//return a success message if insertion is successful else error message
		if (result.status === "success") {
			res.status(200).json({
				result: "Data inserted",
				code: "200"
			});
		} else {
			res.status(300).json({
				result: "An error occured",
				code: "300"
			});
		}
	} catch (error) {
		console.error("Error:", error.message);
		res.status(400).json({ status: "400", errors: error.message });
	}
};

//get parameters based on code type
const getParam = async (req, res) => {
	try {
		//get the code type from request
		const code_type = req.query.code_type;

		//select condition
		const condition = `code_type = ${code_type}`;

		//call the selectdata helper function to get records from db
		selectDataWithCondition(tb_parameter, condition, result => {
			//return a success message if insertion is successful else error message
			if (result.status === "success") {
				console.log(result);
				res.status(200).json({ result: result.data, code: "200" });
			} else {
				res.status(300).json({ result: "An error occured", code: "300" });
			}
		});
	} catch (error) {
		console.error("Error:", error.message);
		res.status(400).json({ status: "400", errors: error.message });
	}
};

//get all parameter types from parameters table
const getAllParam = async (req, res) => {
	try {

		//call the selectdata helper function to get records from db
		selectData(tb_parameter, result => {
			//return a success message if insertion is successful else error message
			if (result.status === "success") {
				console.log(result);
				res.status(200).json({ result: result.data, code: "200" });
			} else {
				res.status(300).json({ result: "An error occured", code: "300" });
			}
		});
	} catch (error) {
		console.error("Error:", error.message);
		res.status(400).json({ status: "400", errors: error.message });
	}
};

//delete parameter
const deleteParam = async (req, res) => {
	try {
		//get the code type from request
		const id = req.query.id;

		//select condition
		const condition = `id = ${id}`;

		//call the deletedata helper function to delete parameter from db
		deleteData(tb_parameter, condition, result => {
			//return a success message if deletion is successful else error message
			if (result.status === "success") {
				console.log(result);
				res.status(200).json({ result: "Data deleted", code: "200" });
			} else {
				res.status(300).json({ result: "An error occured", code: "300" });
			}
		});
	} catch (error) {
		console.error("Error:", error.message);
		res.status(400).json({ status: "400", errors: error.message });
	}
};

//this function will get all parameters for license generation form
// Function to fetch parameters by code type
async function fetchParametersByType(codeType) {
	const condition = `code_type = '${codeType}' and status = 'Active'`;
	return selectParaWithCondition(tb_parameter, condition);
}

const getLicenseFormParameters = async (req, res) => {
	try {
		// Define all code types
		const codeTypes = [
			"Bank",
			"LicenseType",
			"LicenseFrequency",
			"NotificationFrequency"
		];

		// Fetch all parameters concurrently
		const [
			bankParams,
			licenseTypeParams,
			licenseFrequencyParams,
			notificationFrequencyParams
		] = await Promise.all(codeTypes.map(type => fetchParametersByType(type)));

		// Return all parameters
		res.status(200).json({
			bankParams,
			licenseTypeParams,
			licenseFrequencyParams,
			notificationFrequencyParams
		});
	} catch (error) {
		console.log(error);
		res.status(500).json({ status: "500", result: "Contact system admin" });
	}
};

//update parameters
const updateParam = async (req, res) => {
	//get the code type and id from request
	const { code_type, id } = req.body;

	//update condition
	const condition = `code_type = '${code_type}' AND id = ${id}`;

	//call the updateData helper function to update records in db
	updateData(req.body, tb_parameter, condition, result => {
		//return a success message if insertion is successful else error message
		if (result.status === "success") {
			res.status(200).json({ result: "Data updated", code: "200" });
		} else {
			res.status(300).json({ result: "An error occured", code: "300" });
		}
	});
};

module.exports = {
	addParam,
	getParam,
	getLicenseFormParameters,
	getAllParam,
	updateParam
};
