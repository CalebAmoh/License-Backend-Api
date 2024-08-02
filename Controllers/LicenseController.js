const {
	insertData,
	selectData,
	selectCustomData,
	updateData,
	encryptData,
	selectDataWithCondition,
	dbQuery
} = require("./HelperController");
const tb_license = "tb_license";
const tb_license_history = "tb_license_history";
require("dotenv").config();

/***********************************************************************************************************
 * handles all parameters in the system
 * 
 * Activities in {
	* generateLicense() - for generating license,
	* getBankDetails() - get bank details for reactivating license
	* reactivateLicense() - reactivating license
	* ammendLicenseDetails() - ammend license details
 * }
 ***************************************************************************************************************/

//generate license function
const generateLicense = async (req, res) => {
	try {
		//get all data from request
		const {
			bank_id,
			bank_desc,
			license_frequency_id,
			license_type_id,
			start_date,
			end_date,
			notification_start,
			notification_frequency_id,
			grace_period
		} = req.body;

		//format the data to be encrypted
		const formatted_string = [
			"bank_desc",
			"license_frequency_id",
			"license_type_id",
			"start_date",
			"end_date",
			"notification_start",
			"notification_frequency_id",
			"grace_period"
		]
			.map((key, i) => `${key}:${req.body[key]}`)
			.join(",");

		//encrypt data
		const encrypted_value = await encryptData(formatted_string);

		//return a success message if insertion is successful else error message
		if (!encrypted_value)
			return res
				.status(500)
				.json({ status: "500", result: "Encryption failed" });

		//insert the encrypted data into the database
		const result = await insertData(
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
			"main"
		);

		res.status(result.status === "success" ? 200 : 300).json({
			result:
				result.status === "success" ? "Encryption successful" : result.message,
			data: result.status === "success" ? encrypted_value : undefined,
			code: result.status === "success" ? "200" : "300"
		});
	} catch (error) {
		console.log(error);
		res.status(500).json({ status: "500", result: "Contact system admin" });
		return;
	}
};

//get bank details for reactivating license//
const getBankDetails = async (req, res) => {
	try {
		//select the current license details of the bank
		const query = `select bank_id,(select code_desc from parameters where id = bank_id) as bank_desc,license_frequency_id,(select code_desc from parameters where id = license_frequency_id) license_frequency,license_type_id,(select code_desc from parameters where id = license_type_id) license_type,start_date,end_date,notification_start,notification_frequency_id,(select code_desc from parameters where id = notification_frequency_id) notification_frequency,grace_period from tb_license where bank_id = ${req
			.body.bank_id} and expired_status = 0`;

		//select all the license details related to the bank
		selectCustomData(query, result => {
			res.status(result.status === "success" ? 200 : 300).json({
				result:
					result.status === "success" ? "Data retrieved" : "An error occurred",
				message: result.status === "success" ? result.data : undefined,
				code: result.status === "success" ? "200" : "300"
			});
			return;
		});
	} catch (error) {
		console.log(error);
		res.satus(500).json({ status: "500", result: "Contact system admin" });
		return;
	}
};

//reactivate license
// Define an asynchronous function to reactivate a license
const reactivateLicense = async (req, res) => {
	try {
		// Destructure request body to extract license details
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

		// Format request body into a string for encryption
		const formattedString = Object.entries(req.body)
			.map(([key, value]) => `${key}:${value}`)
			.join(",");

		// Encrypt the formatted string
		const encryptedValue = await encryptData(formattedString);

		// If encryption fails, return a 500 error
		if (!encryptedValue) {
			return res
				.status(500)
				.json({ status: "500", result: "Encryption failed" });
		}

		// Call the function with a specific bank_id
		const moved = copyLicenseToHistory(bank_id);

		if (moved) {
			// Insert the encrypted data into the database
			const result = await insertData(
				{
					bank_id,
					license_frequency_id,
					license_type_id,
					start_date,
					end_date,
					notification_start,
					notification_frequency_id,
					grace_period,
					encrypted_value: encryptedValue
				},
				tb_license,
				"reactivate"
			);

			res.status(result.status === "success" ? 200 : 300).json({
				result:
					result.status === "success"
						? "Encryption successful"
						: result.message,
				data: result.status === "success" ? encryptedValue : undefined,
				code: result.status === "success" ? "200" : "300"
			});
		} else {
			res.status(300).json({ result: "An error occured", code: "300" });
			return;
		}
	} catch (error) {
		// Log any errors and return a 500 status
		console.log(error);
		res.status(500).json({ status: "500", result: "Contact admin" });
		return;
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
				res
					.status(200)
					.json({ result: "License details updated", code: "200" });
				return;
			} else {
				res.status(300).json({ result: "An error occured", code: "300" });
				return;
			}
		});
	} catch (error) {
		console.log(error);
		res.status(500).json({ status: "500", result: "Contact system admin" });
		return;
	}
};

//get all licensed banks
const getLicensedBanks = async(req,res) => {
	try {
		//select all the licensed banks
		const query = `select bank_id,(select code_desc from parameters where id = bank_id) as bank_desc,"Active" as status from tb_license where expired_status = 0 group by bank_id`;

		//call select custom data helper function to perform query
		selectCustomData(query, result => {
			res.status(result.status === "success" ? 200 : 300).json({
				result:
					result.status === "success" ? "Data retrieved" : "An error occurred",
				message: result.status === "success" ? result.data : undefined,
				code: result.status === "success" ? "200" : "300"
			});
			return;
		});
	} catch (error) {
		console.log(error);
		res.satus(500).json({ status: "500", result: "Contact system admin" });
		return;
	}
};


//moves data from the main license table to the history table
async function copyLicenseToHistory(bank_id) {
	try {
		// Select data from the main license table
		const selectQuery = `SELECT * FROM tb_license WHERE bank_id = ${bank_id}`;
		dbQuery(selectQuery, result => {
			if (result.message && result.message.length > 0) {
				const dd = new Date(result.message[0].start_date);
				// Format the date as "YYYY-MM-DD"
				const customFormattedDate = `${dd.getFullYear()}-${String(
					dd.getMonth() + 1
				).padStart(2, "0")}-${String(dd.getDate()).padStart(2, "0")}`;
				// console.log("date log", customFormattedDate);

				// Prepare data for insertion into the history table
				const insertData = result.message.map(row => ({
					bank_id: row.bank_id,
					license_frequency_id: row.license_frequency_id,
					license_type_id: row.license_type_id,
					start_date: `${row.start_date.getFullYear()}-${String(
						row.start_date.getMonth() + 1
					).padStart(2, "0")}-${String(row.start_date.getDate()).padStart(
						2,
						"0"
					)}`,
					end_date: `${row.end_date.getFullYear()}-${String(
						row.end_date.getMonth() + 1
					).padStart(2, "0")}-${String(row.end_date.getDate()).padStart(
						2,
						"0"
					)}`,
					notification_start: row.notification_start,
					notification_frequency_id: row.notification_frequency_id,
					grace_period: row.grace_period,
					expired_status: 1 // Assuming you want to set expired_status to 1 for all entries
				}));

				// Insert each row into the history table
				for (const data of insertData) {
					const insertQuery = `INSERT INTO tb_license_history (bank_id, license_frequency_id, license_type_id, start_date, end_date, notification_start, notification_frequency_id, grace_period, expired_status) VALUES ('${data.bank_id}', '${data.license_frequency_id}', '${data.license_type_id}', '${data.start_date}', '${data.end_date}', '${data.notification_start}', '${data.notification_frequency_id}', '${data.grace_period}', '${data.expired_status}')`;
					// console.log("log the insert query", insertQuery);
					dbQuery(insertQuery, result => {
						if (result.status === "error") {
							return false;
						} else {
							return true;
						}
					});
				}

				// console.log("Data copied to history table successfully.");
			} else {
				return false;
			}
		});
	} catch (error) {
		console.error("Error copying data to history table:");
	}
}


module.exports = {
	generateLicense,
	getBankDetails,
	reactivateLicense,
	ammendLicenseDetails,
	getLicensedBanks
};
