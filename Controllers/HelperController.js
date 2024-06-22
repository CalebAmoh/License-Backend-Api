require("dotenv").config();
const mysql = require("mysql");

const conn = process.env.connection;
const host = process.env.host;
const user = process.env.user;
const database = process.env.database;
const password = process.env.password;

// Create a MySQL connection
const connection = mysql.createConnection({
	host: host,
	user: user,
	password: password,
	database: database
});

// Function to insert data into a MySQL table dynamically
function insertData(data, tableName, callback) {
	try {
		// Generate the insert statement dynamically
		const columns = Object.keys(data).join(", ");
		const values = Object.values(data).map(value => `"${value}"`).join(", ");
		const insertQuery = `INSERT INTO ${tableName} (${columns}) VALUES (${values})`;

		// Execute the insert statement
		connection.query(insertQuery, (error, results, fields) => {
			if (error) {
				console.log("Data error !", error);
				callback({ status: "error", message: error.sqlMessage });
			} else {
				console.log("Data inserted successfully!!");
				callback({ status: "success", message: "data inserted" });
			}
		});
	} catch (error) {
		console.error("Error adding role:", error);
		res.status(500).json({ result: "Internal server error", code: "500" });
	}
}

// Function to delete a record in MySQL table dynamically
function selectData(tableName, condition, callback) {
	try {
		//prepare select query
		const selectRecord = `SELECT * from ${tableName} WHERE ${condition}`;

		//execute the select query 
		connection.query(selectRecord, (error, results, fields) => {
			callback({ status: "success", data: results });
		});
	} catch (error) {
		console.error("Error adding role:", error);
		res.status(500).json({ result: "Internal server error", code: "500" });
	}
}

module.exports = {
	insertData,
	selectData
};
