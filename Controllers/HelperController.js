require("dotenv").config();
const mysql = require("mysql");
const oracledb = require("oracledb");
const collect = require("collect.js");
const util = require("util");

//mysql connection string
const host = process.env.host;
const user = process.env.user;
const database = process.env.database;
const password = process.env.password;

//oracle connection strings
const user_oracle = process.env.DB_USER;
const password_oracle = process.env.DB_PASSWORD;
const connectString_oracle = process.env.DB_CONNECTION_STRING;
const timeout_oracle = process.env.DB_CONNECTION_TIMEOUT;
const encrypt_key = process.env.ENCRYPT_KEY;

// Create a MySQL connection
const connection = mysql.createConnection({
	host: host,
	user: user,
	password: password,
	database: database
});

//connect to oracle db
const connectOracle = async () => {
	try {
		//create oracle connection
		const db = await oracledb.getConnection({
			user: user_oracle,
			password: password_oracle,
			connectString: connectString_oracle,
			timeout: timeout_oracle
		});

		return db;
	} catch (error) {
		console.log(error);
	}
};

// Function to insert data into a MySQL table dynamically
function insertData(data, tableName, type, callback) {
	const executeInsert = insertQuery => {
		connection.query(insertQuery, (error, results, fields) => {
			if (error) {
				console.log("Data error !", error);
				callback({ status: "error", message: error.sqlMessage });
			} else {
				console.log("Data inserted successfully!!");
				callback({ status: "success", message: "data inserted" });
			}
		});
	};

	const generateInsertQuery = (data, tableName) => {
		const columns = Object.keys(data).join(", ");
		const values = Object.values(data).map(value => `"${value}"`).join(", ");
		return `INSERT INTO ${tableName} (${columns}) VALUES (${values})`;
	};

	try {
		if (type === "main") {
			const selectRecord = `SELECT * from ${tableName} WHERE bank_id = ${data.bank_id}`;
			connection.query(selectRecord, (error, results, fields) => {
				if (results && results.length > 0) {
					callback({ status: "error", message: "Bank ID already exists" });
				} else {
					const insertQuery = generateInsertQuery(data, tableName);
					executeInsert(insertQuery);
				}
			});
		} else {
			const insertQuery = generateInsertQuery(data, tableName);
			executeInsert(insertQuery);
		}
	} catch (error) {
		console.error("Error adding row:", error);
		callback({ status: "error", message: "Internal server error" });
	}
}

// Function to update data MySQL table dynamically
function updateData(data, tableName, condition, callback) {
	try {
		// Generate the insert statement dynamically
		const columns = Object.keys(data).join(", ");
		const values = Object.values(data).map(value => `"${value}"`).join(", ");
		const updateQuery = `UPDATE ${tableName} set ${data} where ${condition}`;

		// Execute the insert statement
		connection.query(updateQuery, (error, results, fields) => {
			if (error) {
				console.log("Data error !", error);
				callback({ status: "error", message: error.sqlMessage });
			} else {
				console.log("Data inserted successfully!!");
				callback({ status: "success", message: "data inserted" });
			}
		});
	} catch (error) {
		console.error("Error adding row:", error);
		res.status(500).json({ result: "Internal server error", code: "500" });
	}
}

// Function to select records in MySQL table dynamically based on a condition
function selectDataWithCondition(tableName, condition, callback) {
	try {
		//prepare select query
		const selectRecord = `SELECT * from ${tableName} WHERE ${condition}`;

		console.log("Select query with condition",selectRecord);
		//execute the select query
		connection.query(selectRecord, (error, results, fields) => {
			callback({ status: "success", data: results });
		});
	} catch (error) {
		console.error("Error selecting data:", error);
		res.status(500).json({ result: "Internal server error", code: "500" });
	}
}

// Function to select records in MySQL table dynamically based on a condition
function selectParaWithCondition(tableName, condition) {
    return new Promise((resolve, reject) => {
        try {
            // Prepare select query
            const selectRecord = `SELECT * FROM ${tableName} WHERE ${condition}`;
            console.log("Select query with condition", selectRecord);

            // Execute the select query
            connection.query(selectRecord, (error, results) => {
                if (error) {
                    console.error("Error selecting data:", error);
                    reject(error);
                } else {
                    resolve(results);
                }
            });
        } catch (error) {
            console.error("Error in selectParaWithCondition:", error);
            reject(error);
        }
    });
}

// Example usage
async function fetchData() {
    try {
        const tableName = 'your_table_name';
        const condition = 'your_condition';
        const data = await selectParaWithCondition(tableName, condition);
        console.log('Data:', data);
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

// Function to select records in MySQL table dynamically without any conditions
function selectData(tableName, callback) {
	try {
		//prepare select query
		const selectRecord = `SELECT * from ${tableName}`;

		//execute the select query
		connection.query(selectRecord, (error, results, fields) => {
			callback({ status: "success", data: results });
		});
	} catch (error) {
		console.error("Error selecting data:", error);
		res.status(500).json({ result: "Internal server error", code: "500" });
	}
}

// Function to select records in MySQL table dynamically based on your custom query
function selectCustomData(query, callback) {
	try {
		//prepare select query
		const selectRecord = query;
		//execute the select query
		connection.query(selectRecord, (error, results, fields) => {
			callback({ status: "success", data: results });
		});
	} catch (error) {
		console.error("Error selecting data:", error);
		res.status(500).json({ result: "Internal server error", code: "500" });
	}
}

//this function encrypts data and returns the encrypted value
const encryptData = async data => {
	try {
		//convert object data to array
		const modified_data = collect(data).toArray();

		//connect to oracle db
		const db = await connectOracle();

		//bind database connection
		const execute = util.promisify(db.execute).bind(db);

		//execute the query1
		let encryption = await execute(
			`select CBXDMX.pkg_toolkit_modified.fnen('${modified_data}','${encrypt_key}') as encrypted from dual`
		);

		// console.log(encryption.rows[0][0]);
		const encrypted_value = Buffer.from(encryption.rows[0][0]).toString("hex");

		let encryption1 = await execute(
			`select CBXDMX.pkg_toolkit_modified.fnde('${encrypted_value}','${encrypt_key}') as encrypted from dual`
		);

		console.log(encryption1);
		return encrypted_value;
	} catch (error) {
		console.log(error);
		return;
	}
};

/**
 * Executes a SQL query and returns the result via a callback function.
 * @param {string} query - The SQL query to execute.
 * @param {function} callback - A callback function that takes an error and the result.
 */
const dbQuery = async (query, callback) => {
	try {
		connection.query(query, (error, results, fields) => {
			if (error) {
				console.log("Data error !", error);
				callback({ status: "error", message: error.sqlMessage });
			} else {
				console.log("Data selected successfully!!");
				callback({ status: "success", message: results });
			}
		});
	} catch (error) {
		console.error("Error adding row:", error);
		res.status(500).json({ result: "Internal server error", code: "500" });
	}
};

module.exports = {
	insertData,
	updateData,
	selectDataWithCondition,
	selectParaWithCondition,
	selectData,
	selectCustomData,
	encryptData,
	dbQuery
};
