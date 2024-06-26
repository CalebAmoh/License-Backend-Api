const {
	insertData,
	selectData,
	selectCustomData
} = require("./HelperController");
const tb_license = "tb_license";
require("dotenv").config();
const oracledb = require("oracledb");
const util = require("util");
const collect = require("collect.js");

const user = process.env.DB_USER;
const password = process.env.DB_PASSWORD;
const connectString = process.env.DB_CONNECTION_STRING;
const timeout = process.env.DB_CONNECTION_TIMEOUT;
const encrypt_key = process.env.ENCRYPT_KEY;

/***********************************************************************************************************
 * handles all parameters in the system
 * 
 * Activities in {
	* generateLicense() - for generating license,
 * }
 ***************************************************************************************************************/

//generate license function1
const generateLicense = async (req, res) => {
	try {
		//get all data from request
		const test = ({
			bank_id,
			license_frequency_id,
			license_type_id,
			start_date,
			end_date,
			notification_start,
			notification_frequency_id,
			grace_period
		} = req.body);
		
		const collection = collect(test);
		const newTest = collection.toArray();

		//once data has been saved encrypt the data
		const db = await oracledb.getConnection({
			user: user,
			password: password,
			connectString: connectString,
			timeout: timeout
		});

		const execute = util.promisify(db.execute).bind(db);

		//execute the query1
		let encryption = await execute(
			`select CBXDMX.pkg_toolkit_modified.fnen('${newTest}','${encrypt_key}') as encrypted from dual`
		);

		// console.log(encryption.rows[0][0]);
		const encrypted_value = Buffer.from(encryption.rows[0][0]).toString("hex");
		// console.log(encrypted_value);
		// console.log(Buffer.from(encrypted_value, "hex"));
		let ttt = Buffer.from(encrypted_value, "hex");

		let encryption1 = await execute(
			`select CBXDMX.pkg_toolkit_modified.fnde('${encrypted_value}','${encrypt_key}') as encrypted from dual`
		);

		// Log the raw data to see what it contains
		// console.log("Raw query result:", encryption1);
		console.log("Raw encrypted value:", encryption1.rows[0]);
		const resultString = encryption1.rows[0][0];
		console.log(resultString)
		

		/**
			* insert data into table
      * helper.insertData(@dataParam->the data to be inserted, @tableParam->table to insert data, @result->result from insert)
      */
		insertData(
			{
				bank_id,
				license_frequency_id,
				license_type_id,
				start_date,
				end_date,
				notification_start,
				notification_frequency_id,
				grace_period
			},
			tb_license,
			result => {
				//return a success message if insertion is successful else error message
				if (result.status === "success") {
					res.status(200).json({
						result: "Encryption successful",
						data: encrypted_value,
						code: "000"
					});
				} else {
					res.status(300).json({
						result: "An error occured",
						code: "300"
					});
				}
			}
		);
	} catch (error) {
		console.log(error);
		res.status(500).json({ status: "500", result: "Contact system admin" });
	}
};

const decrypt = async (req, res) => {
	const { data } = req.body;
};

//reactivate license
const getBankDetails = async (req, res) => {
	try {
		//select the current license details of the bank
		const query = `select bank_id,(select code_desc from parameters where id = bank_id) as bank_desc,license_frequency_id,(select code_desc from parameters where id = license_frequency_id) license_frequency,license_type_id,(select code_desc from parameters where id = license_type_id) license_type,start_date,end_date,notification_start,notification_frequency_id,(select code_desc from parameters where id = notification_frequency_id) notification_frequency from tb_license where bank_id = ${req
			.query.bank_id}`;

		//select all the license details related to the bank
		selectCustomData(query, result => {
			//return a success message if insertion is successful else error message
			if (result.status === "success") {
				res.status(200).json({ result: result.data, code: "200" });
			} else {
				res.status(300).json({ result: "An error occured", code: "300" });
			}
		});
	} catch (error) {
		console.log(error);
		res.satus(500).json({ status: "500", result: "Contact system admin" });
	}
};

module.exports = {
	generateLicense,
	getBankDetails
};
