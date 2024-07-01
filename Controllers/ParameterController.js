const { matchedData, validationResult } = require("express-validator");
const tb_parameter = "parameters";
const { insertData, selectDataWithCondition } = require("./HelperController");

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
		insertData({ code_type, code_desc, status }, tb_parameter, result => {
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
		});
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

//this function will get all parameters for license generation form
const getLicenseFormParameters = async (req, res) => {
	try {
		//select all bank parameters
		const bankParams = await selectData(tb_parameter, "code_type = Bank");
		console.log(bankParams);return;
		//select all license type parameters
		const licenseTypeParams = await selectData(tb_parameter, "code_type = LicenseType");

		//select all license frequency parameters
		const licenseFrequencyParams = await selectData(tb_parameter, "code_type = LicenseFrequency");

		//select all notification frequency parameters
		const notificationFrequencyParams = await selectData(tb_parameter, "code_type = NotificationFrequency");

	} catch (error) {
		console.log(error);
		res.status(500).json({ status: "500", result: "Contact system admin" });
	}
}

//update parameters
const updateParam = async (req, res) => {
	//get the code type and id from request
	const { code_type, id } = req.body;
}

module.exports = {
	addParam,
	getParam,
	getLicenseFormParameters
};
