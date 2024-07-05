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

// Function to insert data into a specified table
async function insertData(data, tableName, type) {
    // Function to execute the insert query
    const executeInsert = async insertQuery => {
        try {
            const [results] = await query(insertQuery);
            // console.log("Data inserted successfully!!");
            return { status: "success", message: "data inserted" };
        } catch (error) {
            console.log("Data error !", error);
            return { status: "error", message: error.sqlMessage };
        }
    };

    // Function to generate an insert query from the provided data
    const generateInsertQuery = (data, tableName) => {
        const columns = Object.keys(data).join(", ");
        const values = Object.values(data).map(value => `"${value}"`).join(", ");
        return `INSERT INTO ${tableName} (${columns}) VALUES (${values})`;
    };

    // Wrap connection.query in a Promise
    const query = (sql) => new Promise((resolve, reject) => {
        connection.query(sql, (error, results, fields) => {
            if (error) reject(error);
            else resolve([results, fields]);
        });
    });

    try {
        if (type === "main" || type === "reactivate") {
            const selectRecord = `SELECT * from ${tableName} WHERE bank_id = ${data.bank_id}`;
            const [selectResults] = await query(selectRecord);

            if (selectResults && selectResults.length > 0) {
                if (type === "reactivate") {
                    const deleteRecord = `DELETE FROM ${tableName} WHERE bank_id = ${data.bank_id}`;
                    await query(deleteRecord);
                } else {
                    return { status: "error", message: "Bank ID already exists" };
                }
            }
        }

        const insertQuery = generateInsertQuery(data, tableName);
        return await executeInsert(insertQuery);
    } catch (error) {
        console.error("Error adding row:", error);
        return { status: "error", message: "Internal server error" };
    }
}

// Function to update data MySQL table dynamically
function updateData(data, tableName, condition, callback) {
    try {
        // Generate the update statement dynamically
        const updateParts = Object.keys(data).map(key => `${key} = ?`).join(", ");
        const values = Object.values(data);
        const updateQuery = `UPDATE ${tableName} SET ${updateParts} WHERE ${condition}`;

        // Execute the update statement using parameterized query for safety
        connection.query(updateQuery, values, (error, results, fields) => {
            if (error) {
                console.log("Data error !", error);
                callback({ status: "error", message: error.sqlMessage });
            } else {
                callback({ status: "success", message: "data updated" }); // Corrected message
            }
        });
    } catch (error) {
        console.error("Error updating row:", error);
        // Since `res` is not available, you might need to adjust error handling here
        callback({ status: "error", message: "Internal server error" });
    }
}

// Function to select records in MySQL table dynamically based on a condition
function selectDataWithCondition(tableName, condition, callback) {
	try {
		//prepare select query
		const selectRecord = `SELECT * from ${tableName} WHERE ${condition}`;

		console.log("Select query with condition", selectRecord);
		//execute the select query
		connection.query(selectRecord, (error, results, fields) => {
			callback({ status: "success", data: results });
		});
	} catch (error) {
		console.error("Error selecting data:", error);
		res.status(500).json({ result: "Internal server error", code: "500" });
		return
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
		return
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
		return
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

		// let encryption1 = await execute(
		// 	`select CBXDMX.pkg_toolkit_modified.fnde('${encrypted_value}','${encrypt_key}') as encrypted from dual`
		// );

		// console.log(encryption1);
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
		return
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
