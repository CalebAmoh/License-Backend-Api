const {
	insertData,
	selectData,
	selectCustomData,
	updateData,
	encryptData
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
	* getBankDetails() - get bank details for reactivating license
 * }
 ***************************************************************************************************************/

//generate license function
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

		const testArray = [
			{ key: "bank_id", value: bank_id },
			{ key: "license_frequency_id", value: license_frequency_id },
			{ key: "license_type_id", value: license_type_id },
			{ key: "start_date", value: start_date },
			{ key: "end_date", value: end_date },
			{ key: "notification_start", value: notification_start },
			{ key: "notification_frequency_id", value: notification_frequency_id },
			{ key: "grace_period", value: grace_period }
		];

		// const collection = collect(test);
		// const newTest = collection.toArray();

		// //once data has been saved encrypt the data
		// const db = oracledb.getConnection({
		// 	user: user,
		// 	password: password,
		// 	connectString: connectString,
		// 	timeout: timeout
		// });

		// const execute = util.promisify(db.execute).bind(db);

		// //execute the query1
		// let encryption = await execute(
		// 	`select CBXDMX.pkg_toolkit_modified.fnen('${newTest}','${encrypt_key}') as encrypted from dual`
		// );

		// // console.log(encryption.rows[0][0]);
		// const encrypted_value = Buffer.from(encryption.rows[0][0]).toString("hex");

		//encrypt data
		const encrypted_value = await encryptData(testArray);

		// let encryption1 = await execute(
		// 	`select CBXDMX.pkg_toolkit_modified.fnde('${encrypted_value}','${encrypt_key}') as encrypted from dual`
		// );

		// // Log the raw data to see what it contains1
		// // console.log("Raw query result:", encryption1);
		// console.log("Raw encrypted value:", encryption1.rows[0]);
		// const resultString = encryption1.rows[0][0];
		// console.log(resultString);

		// Check if encryption was successful
		if (!encrypted_value) {
			return res.status(500).json({
				status: "500",
				result: "Encryption failed"
			});
		}

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
				grace_period,
				encrypted_value
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

//get bank details for reactivating license
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

//reactivate license
const reactivateLicense = async (req, res) => {
	try {
		//get all data from request
		const license_details = ({
			bank_id,
			license_frequency_id,
			license_type_id,
			start_date,
			end_date,
			notification_start,
			notification_frequency_id,
			grace_period
		} = req.body);

		//encrypt data
		const encrypted_value = encryptData(license_details);

		if (encrypted_value) {
			//update the expiry status of the already existing bank to expired
			//select condition
			const condition = `bank_id = ${bank_id}`;

			//update column and values
			const data = (expired_status = 1);

			//update table
			updateData(data, tb_license, condition, result => {
				//return a success message if insertion is successful else error message
				if (result.status === "success") {
					//now insert a new bank record
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
							grace_period,
							encrypted_value
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
				} else {
					res.status(300).json({
						result: "An error occured",
						code: "300"
					});
				}
			});
		} else {
			return res.status(500).json({
				status: "500",
				result: "Encryption failed"
			});
		}
	} catch (error) {
		console.log(error);
		res.status(500).json({ status: "500", result: "Contact admin" });
	}
};

//ammend license generation details
const ammendLicenseDetails = async (req, res) => {

	try {
		//get data from request
		const {
			bank_id,
			license_frequency_id,
			license_type_id,
			start_date,
			end_date,
			notification_start,
			notification_frequency_id,
			grace_period
		} = req.body;

		//update the bank license details
		//condition for update
		const condition = `bank_id = ${bank_id}`;
		//data to update
		const data = {
			license_frequency_id,
			license_type_id,
			start_date,
			end_date,
			notification_start,
			notification_frequency_id,
			grace_period
		};

		//update the license details
		updateData(data, tb_license, condition, result => {
			//return a success message if insertion is successful else error message
			if (result.status === "success") {
				res.status(200).json({ result: "License details updated", code: "200" });
			} else {
				res.status(300).json({ result: "An error occured", code: "300" });
			}
		});
	} catch (error) {
		console.log(error);
		res.status(500).json({ status: "500", result: "Contact system admin" });
	}

}

module.exports = {
	generateLicense,
	getBankDetails,
	reactivateLicense,
	ammendLicenseDetails
};
