const { db: db2 } = require("../db/db2")
const updatePrice = async (req, res) => {
	try {
		const { Update_price, user, produce_id } = req.body;
		const [data] = await db2.execute("CALL Update_Produce_Price(?,?)", [produce_id, Update_price])
		res.status(200).json({
			message: "Price updated successfully",
			data: data,
		})
	} catch (e) {
		res.status(400).json({
			message: "Error Occured",
			error: e.message,
		})
	}
}

const GetProduceName = async (req, res) => {
	try {
		const [data] = await db2.query(
			`SELECT 
    p.*,
    DATE_FORMAT(ph.transaction_date, '%d-%m-%Y') AS transaction_date,
    ph.unit_value,
    ph.wastage,
    ph.price 
FROM 
    Price_to_update p
INNER JOIN 
    (
        SELECT 
            pod_item, 
            MAX(transaction_date) AS latest_transaction_date
        FROM 
            produce_history
        GROUP BY 
            pod_item
    ) AS latest_ph 
    ON latest_ph.pod_item = p.produce_id	
INNER JOIN 
    produce_history ph 
    ON ph.pod_item = latest_ph.pod_item 
    AND ph.transaction_date = latest_ph.latest_transaction_date`)

		const [availability_off] = await db2.query(
			`SELECT Produce_availability_0.*, setup_produce.Available from Produce_availability_0 INNER JOIN setup_produce on setup_produce.produce_id=Produce_availability_0.produce_id`
		)
		const [availability_on] = await db2.query(
			`SELECT Produce_availability_1.*, setup_produce.Available from Produce_availability_1 INNER JOIN setup_produce on setup_produce.produce_id=Produce_availability_1.produce_id`
		)
		res.status(200).json({
			message: "Produce name",
			data: data,
			availability_off: availability_off,
			availability_on: availability_on
		})
	} catch (e) {
		res.status(400).json({
			message: "Error Occured",
			error: e.message
		})
	}
}


const updateFxRateHistory = async (req, res) => {
	try {
		//fx_rate_history
		const { fx_id, fx_rate } = req.body;

		const [data] = await db2.execute("CALL Update_FX(?,?)", [fx_id, fx_rate])
		res.status(200).json({
			message: "Fx Rate inserted successfully",
			data: data,
		})

	} catch (error) {
		res.status(400).json({
			message: "Error Occured",
			error: error.message,
		})
	}
}

const GetFxRate = async (req, res) => {
	try {
		const [data] = await db2.query(
			`SELECT dc.currency_id,
       dc.currency,
       dc.currency_adjustment,
       dc.status,
       dc.created AS currency_created,
       dc.updated AS currency_updated,
       dc.currency AS currency_name,
       frh.fx_id,
       frh.fx_rate
FROM dropdown_currency dc
INNER JOIN (
    SELECT fx_id, MAX(id) AS max_id
    FROM fx_rate_history
    GROUP BY fx_id
) AS latest_fx_id ON dc.currency_id = latest_fx_id.fx_id
JOIN fx_rate_history frh ON latest_fx_id.fx_id = frh.fx_id AND latest_fx_id.max_id = frh.id
ORDER BY dc.currency_id;
`);

		res.status(200).json({
			message: "Produce name",
			data: data,
		})
	} catch (e) {
		res.status(400).json({
			message: "Error Occured",
			error: e.message
		})
	}
}

const updateProduceAvailability = async (req, res) => {
	try {
		const { produce_id } = req.body;
		const [data] = await db2.query(`select Available from setup_produce where produce_id='${produce_id}'`)
		if (data.length) {
			let status;
			if (data[0].Available == 1) {
				status = 0;
			}
			else {
				status = 1;
			}
			const [details] = await db2.query(`
				UPDATE setup_produce 
				SET Available = '${status}' WHERE produce_id = '${produce_id}'
			  `);
			res.status(200).json({
				success: true,
				message: "Update status successfully"
			})
		}
		else {
			res.status(400).json({
				success: false,
				message: "Data not found"
			})
		}
	} catch (error) {
		res.status(400).json({
			message: "Error Occured",
			error: error.message,
		})
	}
}

const AslList = async (req, res) => {
	try {
		const [Data] = await db2.query(`SELECT * FROM asl_list`);
		res.status(200).json({
			success: true,
			message: "ASL List",
			data: Data
		})
	} catch (error) {
		res.status(400).json({
			message: "Error Occured",
			error: error.message,
		})
	}
}

const HPLList = async (req, res) => {
	try {
		const [Data] = await db2.query(`SELECT * FROM HPL`);
		res.status(200).json({
			success: true,
			message: "HPL List",
			data: Data
		})
	} catch (error) {
		res.status(400).json({
			message: "Error Occured",
			error: error.message,
		})
	}
}

const getCompanyAddress = async (req, res) => {
	try {
		// Construct the SQL query and parameters
		const [Data] = await db2.query(`SELECT * FROM Company_Address`);
		res.status(200).json({
			success: true,
			data: Data
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: "Error occurred",
			error: error.message
		});
	}
}

const updateCompanyAddress = async (req, res) => {
	try {
		// Extract company ID, address lines, and optional logo from request body
		const { companyId, Line_1, Line_2, Line_3, Line_4 } = req.body;
		const logo = req.file; // Access the uploaded file

		// Check if companyId and address lines are provided
		if (!companyId) {
			return res.status(400).json({
				success: false,
				message: "Company ID are required."
			});
		}

		// Construct the SQL query and parameters
		let updateQuery = `UPDATE Company_Address SET Line_1 = ?, Line_2 = ?, Line_3 = ?, Line_4 = ?`;
		let params = [Line_1, Line_2, Line_3, Line_4];

		if (logo) {
			// Save the file path in the database
			updateQuery += `, logo = ?`;
			params.push(logo.filename); // Save the path of the uploaded file
		}

		updateQuery += ` WHERE ID = ?`;
		params.push(companyId);

		// Execute the update query
		const [result] = await db2.query(updateQuery, params);

		// Check if any rows were affected
		if (result.affectedRows === 0) {
			return res.status(404).json({
				success: false,
				message: "Company not found."
			});
		}

		// Respond with success message
		res.status(200).json({
			success: true,
			message: "Company address updated successfully."
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: "Error occurred",
			error: error.message
		});
	}
};


const addCompanyAddress = async (req, res) => {
	try {
		// Extract address lines and optional logo from request body
		const { Line_1, Line_2, Line_3, Line_4 } = req.body;
		const logo = req.file; // Access the uploaded logo file if any

		let insertQuery = `INSERT INTO Company_Address (Line_1, Line_2, Line_3, Line_4`;
		let params = [Line_1, Line_2, Line_3 || '', Line_4 || ''];

		// If logo is provided, add it to the query and parameters
		if (logo) {
			insertQuery += `, logo`; // Add the logo column to the query
			params.push(logo.filename); // Add the logo filename to the parameters
		}

		insertQuery += `) VALUES (?, ?, ?, ?`; // Base placeholders for the address fields

		if (logo) {
			insertQuery += `, ?`; // Add a placeholder for the logo if it's provided
		}

		insertQuery += `)`; // Close the VALUES part of the query properly

		// Execute the insert query
		const [result] = await db2.query(insertQuery, params);

		// Check if the insertion was successful
		if (result.affectedRows === 0) {
			return res.status(400).json({
				success: false,
				message: "Failed to add company address."
			});
		}

		// Respond with success message
		res.status(200).json({
			success: true,
			message: "Company address added successfully."
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: "Error occurred",
			error: error.message
		});
	}
};

module.exports = {
	updatePrice, GetProduceName, updateFxRateHistory, GetFxRate, updateProduceAvailability,
	AslList, HPLList, updateCompanyAddress, getCompanyAddress, addCompanyAddress
}
