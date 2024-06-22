const { insertData, selectData } = require("./HelperController");
const tb_license = "tb_license";

/***********************************************************************************************************
 * handles all parameters in the system
 * 
 * Activities in {
	* generateLicense() - for generating license,
 * }
 ***************************************************************************************************************/

//generate license function
const generateLicense = async (req, res) => {
	try {
		//get all data from request
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
						result: "Data inserted",
						code: "200"
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
		res.satus(500).json({ status: "500", result: "Contact system admin" });
	}
};
