const { log } = require("winston");
const { db: db2 } = require("../db/db2")

const getAllQuotation = async (req, res) => {
	try {
		const { role, userId, status } = req.query;
		// Define the base SQL query
		let sql = `
            SELECT quotations.*, 
                DATE_FORMAT(quotations.load_Before_date, '%d-%m-%Y') AS load_Before_date, 
                setup_ports.port_name, 
                setup_ports.IATA_code AS Airport_IATA_code,  
                dropdown_currency.currency AS currency, 
                vendors.name AS clearance_name,
                clients.client_name AS client_name, 
                clients.client_address AS client_address, 
                setup_location.name AS location_name, 
                consignee.consignee_name, 
                consignee.consignee_address,
                clients.client_tax_number, 
                clients.client_email,
                clients.client_phone, 
                consignee.consignee_tax_number, 
                consignee.consignee_email, 
                consignee.consignee_phone,
                users.name AS created_by,
                setup_liner.liner_name AS Airline, 
                setup_liner.liner_code AS Airline_liner_code
            FROM quotations
            INNER JOIN clients ON quotations.Client_ID = clients.client_id
            INNER JOIN setup_location ON quotations.loading_location = setup_location.id
            INNER JOIN consignee ON consignee.consignee_id = quotations.Consignee_ID
            INNER JOIN setup_ports ON setup_ports.port_id = quotations.Destination_Port
            INNER JOIN dropdown_currency ON dropdown_currency.currency_id = quotations.FX_ID
            INNER JOIN vendors ON vendors.vendor_id = quotations.Q_Clearance_Provider
            INNER JOIN users ON users.id = quotations.user
            INNER JOIN setup_liner ON setup_liner.liner_id = quotations.Liner_ID`;
		// Add WHERE condition based on role
		let whereClauses = [];

		// Add conditions based on role
		if (role === 'Client') {
			whereClauses.push(`quotations.Client_ID = ?`);
		} else if (role === 'Consignee') {
			whereClauses.push(`quotations.Consignee_ID = ?`);
		}

		// Add status filter if provided
		if (status && status != 4) {
			if (status == 0) {
				// For 'active', include both status 0 and 1
				whereClauses.push(`quotations.Status IN (0, 1)`);
			} else if (status == 1) {
				whereClauses.push(`quotations.Status = 1`);
			} else if (status == 2) {
				whereClauses.push(`quotations.Status = 2`);
			}
		}
		else if (!role && status != 4) {
			// Default status to 0 and 1 only if no role is provided
			whereClauses.push(`quotations.Status IN (0, 1)`);
		}

		// Append WHERE clause if there are any conditions
		if (whereClauses.length > 0) {
			sql += ` WHERE ${whereClauses.join(' AND ')}`;
		}
		// Add ORDER BY clause
		sql += ` ORDER BY CAST(SUBSTRING_INDEX(quotations.Quotation_number, '-', -1) AS UNSIGNED) DESC`;

		// Execute the query with parameters
		const [data] = await db2.query(sql, [userId]);
		res.status(200).json({
			message: "All Quotation",
			data: data,
		});
	} catch (e) {
		res.status(400).json({
			message: "Error Occurred",
			error: e,
		});
	}
};


const addQuotation = async (req, res) => {
	const quotationData = req.body
	try {
		const [data] = await db2.execute("CALL Quotation_Calculate(?,?, @Message_EN, @Message_TH, @Freight_Cost, @Message_EN_OK, @Message_TH_OK)", [quotationData.quotation_id, quotationData.user_id])
		const [results] = await db2.execute("SELECT @Message_EN AS Message_EN, @Message_TH AS Message_TH, @Freight_Cost AS Freight_Cost, @Message_EN_OK AS Message_EN_OK, @Message_TH_OK AS Message_TH_OK");
		const resultData = results[0]
		if (resultData.Message_EN !== null && resultData.Message_EN !== "Freight OK") {
			res.status(200).json({ success: false, results: results, message: resultData.Message_EN });
		}
		else {
			const [quotation_details] = await db2.execute(
				`SELECT quotations.*, DATE_FORMAT(quotations.created, '%d/%m/%Y') as created, DATE_FORMAT(quotations.load_Before_date, '%Y-%m-%d') AS load_Before_date, 
					setup_ports.port_name, users.name,
					clients.client_name AS client_name, setup_location.name AS location_name, consignee.consignee_name
					FROM quotations
					JOIN clients ON quotations.Client_ID = clients.client_id
					JOIN setup_location ON quotations.loading_location = setup_location.id
					JOIN consignee ON consignee.consignee_id = quotations.Consignee_ID
					JOIN setup_ports ON setup_ports.port_id = quotations.Destination_Port
					INNER JOIN users ON users.id = quotations.user
						WHERE quotations.Quotation_ID = '${quotationData.quotation_id}'`,
			)
			let title = 'New Quotation Created'
			let body = `A new quotation has been created on Siam Eats.
				Quotation Number: ${quotation_details[0].Quotation_number}
				Quotation Date: ${quotation_details[0].created}
				Location Name: ${quotation_details[0].location_name}
				Port Name: ${quotation_details[0].port_name}
				Client Name: ${quotation_details[0].client_name}
				Consignee Name: ${quotation_details[0].consignee_name}
				Load Date: ${quotation_details[0].load_Before_date}
				Created by: ${quotation_details[0].name}`

			const [notification_id] = await db2.execute(
				`SELECT * FROM notification_details WHERE notify_on = '${1}' and client='${quotation_details[0].client_id}' and consignee='${quotation_details[0].consignee_id}'`,
			)
			if (notification_id.length > 0) {

				const [notification_msg] = await db2.execute(
					`SELECT notification_name, notification_message FROM notification_messages WHERE id = '${notification_id[0].notification_id}'`,
				)
				const [notification_users] = await db2.execute(
					`SELECT user FROM notifications WHERE notification_id = '${notification_id[0].notification_id}'`,
				)

				notification_users.forEach(item => {

					db2.execute(
						"INSERT INTO notification_history (notification_id, user_id, order_id, title, messages) VALUES (?, ?, ?, ?, ?)",
						[
							notification_id[0].notification_id,
							item.user,
							quotationData.quotation_id,
							title,
							body
						],
					)
				})
			}
			else {
				return res.status(200).json({ success: true, message: "Quotation Added, but no notifications sent.", data: quotationData.quotation_id });
			}
			res.status(200).json({
				success: true,
				message: "Quotation Added",
				data: quotationData.quotation_id,
			})
		}

	} catch (err) {
		res.status(400).json({
			message: "Error Occured",
			error: err.message,
		})
	}
}
const addQuotationDetails = async (req, res) => {
	const { quotation_id, data, user_id } = req.body

	const o = []
	try {
		for (const d of data) {
			const [i] = await db2.execute(
				"INSERT INTO quotation_details (Quotation_ID, ITF, QOD_QTY, QOD_Unit) VALUES (?, ?, ?, ?);",
				[quotation_id, d.ITF, d.itf_quantity, d.itf_unit],
			)
			o.push(i.insertId)
		}
		await db2.execute("CALL Quotation_Confirm(?,?)", [quotation_id, user_id || null])
		let i = 0
		for (const v of o) {
			await db2.execute(
				"UPDATE quotation_details SET 	QOD_QP = ? WHERE QOD_ID = ?",
				[data[i].quotation_price || null, v],
			)
			i++
		}
		res.status(200).json({
			message: "Quotation Details Added",
		})
	} catch (err) {
		res.status(400).json({
			message: "Error Occured",
			error: err,
		})
	}
}

const calculateQuotation = async (req, res) => {
	const { quotationData, input } = req.body

	try {
		await db2.execute(
			`UPDATE quotations SET Brand_ID = ?, Client_ID = ?, loading_location = ?, Q_Freight_Provider = ?,
			Liner_ID = ?, Origin_Port = ?, Destination_Port = ?, Q_Clearance_Provider = ?, Q_Transportation_Provider = ?, Consignee_ID = ?, FX_ID = ?, Q_FX_rate = ?, Q_Markup = ?, Q_Rebate = ?, palletized = ?, Chamber = ?, load_Before_date = ?, created = ?, updated = current_timestamp(), user = ? WHERE Quotation_ID = ?`,
			[
				input.brand_id,
				input.client_id,
				input.loading_location,
				input.Freight_provider_,
				input.liner_id,
				input.from_port_,
				input.destination_port_id,
				input.Clearance_provider,
				input.Transportation_provider,
				input.consignee_id,
				input.fx_id,
				input.fx_rate,
				input.mark_up || 0,
				input.rebate || 0,
				input.palletized ? "YES" : "NO",
				input.Chamber ? "YES" : "NO",
				input.load_date,
				input.created,
				input.user_id,
				input.quotation_id,
			]
		);

		const [data] = await db2.execute("CALL Quotation_Calculate(?,?, @Message_EN, @Message_TH, @Freight_Cost, @Message_EN_OK, @Message_TH_OK)", [input.quotation_id, input.user_id])
		const [results] = await db2.execute("SELECT @Message_EN AS Message_EN, @Message_TH AS Message_TH, @Freight_Cost AS Freight_Cost, @Message_EN_OK AS Message_EN_OK, @Message_TH_OK AS Message_TH_OK");

		const resultData = results[0]
		if (resultData.Message_EN !== null && resultData.Message_EN !== "Freight OK") {
			res.status(200).json({ success: false, results: results, message: resultData.Message_EN });
		}
		else {
			return res.status(200).json({
				success: true,
				message: "Calculated",
				data: data,
			})
		}
	} catch (e) {
		return res.status(400).json({
			message: "Error Occured",
			error: e.message,
		})
	}
}

const getQuotationDetials = async (req, res) => {
	const { quote_id } = req.query
	try {
		const [data] = await db2.query(
			`SELECT a.*, b.profit_percentage
			FROM quotation_details as a
			INNER JOIN quotation_cost as b
			ON a.QOD_ID = b.qod_id
			WHERE a.Quotation_ID = ?
			`,
			[quote_id],
		)
		res.status(200).json({
			message: "Quotation Details",
			data: data,
		})
	} catch (e) {
		res.status(400).json({
			message: "Error Occured",
			error: e,
		})
	}
}

const getQuotationSummary = async (req, res) => {
	const { quote_id } = req.query
	try {
		const [data] = await db2.query(
			"SELECT * FROM `quotations` WHERE `Quotation_ID` = ?",
			[quote_id],
		)
		res.status(200).json({
			message: "Quotation Summary",
			data: data[0],
		})
	} catch (e) {
		res.status(400).json({
			message: "Error Occured",
			error: e,
		})
	}
}

const deleteQuotationDetials = async (req, res) => {
	const { qod_id, user_id, quotation_id } = req.body
	try {

		await db2.execute(
			"DELETE FROM quotation_details WHERE QOD_ID = ? LIMIT 1",
			[qod_id],
		)

		const [data] = await db2.execute(
			`INSERT INTO Transaction_records (Transaction_description, Transaction_ref, USER) VALUES(?,?,?)`,
			[
				"Delete Quotation Details",
				qod_id,
				user_id
			],
		)
		// Execute the Calculate_Quotation stored procedure
		await db2.execute(
			"CALL Quotation_Calculate(?, ?, @Message_EN, @Message_TH, @Freight_Cost, @Message_EN_OK, @Message_TH_OK)",
			[quotation_id, user_id]
		);

		// Retrieve the output parameter values
		const [results] = await db2.execute(
			"SELECT @Message_EN AS Message_EN, @Message_TH AS Message_TH, @Freight_Cost AS Freight_Cost, @Message_EN_OK AS Message_EN_OK, @Message_TH_OK AS Message_TH_OK"
		);

		// Access the first row of the results
		const resultData = results[0];

		// Check the Message_EN output parameter for any errors
		if (resultData.Message_EN !== null && resultData.Message_EN !== "Freight OK") {
			return res.status(200).json({ success: false, results: results, message: resultData.Message_EN });
		}

		// Send a success response if no errors are found
		return res.status(200).json({
			success: true,
			message: "Quotation deleted Successfully",
		});

	} catch (e) {
		res.status(400).json({
			message: "Error Occured",
			error: e.message,
		})
	}
}

const updateQuotation = async (req, res) => {
	const quotationData = req.body;
	try {
		await db2.execute(
			`UPDATE quotations SET Brand_ID = ?, Client_ID = ?, loading_location = ?, Q_Freight_Provider = ?,
			Liner_ID = ?, Origin_Port = ?, Destination_Port = ?, Q_Clearance_Provider = ?, Q_Transportation_Provider = ?, Consignee_ID = ?, FX_ID = ?,
			Q_FX_rate = ?, Q_Markup = ?, Q_Rebate = ?, palletized = ?, Chamber = ?, load_Before_date = ?, created = ?, updated = current_timestamp(), user = ?
			WHERE Quotation_ID = ?`,
			[
				quotationData.brand_id,
				quotationData.client_id,
				quotationData.loading_location,
				quotationData.Freight_provider_,
				quotationData.liner_id,
				quotationData.from_port_,
				quotationData.destination_port_id,
				quotationData.Clearance_provider,
				quotationData.Transportation_provider,
				quotationData.consignee_id,
				quotationData.fx_id,
				quotationData.fx_rate,
				quotationData.mark_up || 0,
				quotationData.rebate || 0,
				quotationData.palletized ? "YES" : "NO",
				quotationData.Chamber ? "YES" : "NO",
				quotationData.load_date,
				quotationData.created,
				quotationData.user_id,
				quotationData.quotation_id,
			]
		);

		const { quotation_id, user_id } = quotationData;

		if (quotation_id == null || user_id == null) {
			throw new Error('Missing required parameters: quotation_id or user_id');
		}


		const [data] = await db2.execute("CALL Quotation_Calculate(?,?, @Message_EN, @Message_TH, @Freight_Cost, @Message_EN_OK, @Message_TH_OK)", [quotationData.quotation_id, quotationData.user_id])
		const [results] = await db2.execute("SELECT @Message_EN AS Message_EN, @Message_TH AS Message_TH, @Freight_Cost AS Freight_Cost, @Message_EN_OK AS Message_EN_OK, @Message_TH_OK AS Message_TH_OK");
		const resultData = results[0]
		if (resultData.Message_EN !== null && resultData.Message_EN !== "Freight OK") {
			res.status(200).json({ success: false, results: results, message: resultData.Message_EN });
		}
		else {
			const [quotation_details] = await db2.execute(
				`SELECT quotations.*, DATE_FORMAT(quotations.created, '%d/%m/%Y') as created, DATE_FORMAT(quotations.load_Before_date, '%Y-%m-%d') AS load_Before_date, 
				setup_ports.port_name, users.name,
				clients.client_name AS client_name, setup_location.name AS location_name, consignee.consignee_name
				FROM quotations
				JOIN clients ON quotations.Client_ID = clients.client_id
				JOIN setup_location ON quotations.loading_location = setup_location.id
				JOIN consignee ON consignee.consignee_id = quotations.Consignee_ID
				JOIN setup_ports ON setup_ports.port_id = quotations.Destination_Port
				INNER JOIN users ON users.id = quotations.user
				WHERE quotations.Quotation_ID = ?`,
				[quotation_id]
			);

			let title = 'Quotation Adjusted';
			let body = `A quotation has been adjusted on Siam Eats.
			Quotation Number: ${quotation_details[0].Quotation_number}
			Quotation Date: ${quotation_details[0].created}
			Location Name: ${quotation_details[0].location_name}
			Port Name: ${quotation_details[0].port_name}
			Client Name: ${quotation_details[0].client_name}
			Consignee Name: ${quotation_details[0].consignee_name}
			Load Date: ${quotation_details[0].load_Before_date}
			Created by: ${quotation_details[0].name}`;

			const [notification_id] = await db2.execute(
				`SELECT * FROM notification_details WHERE notify_on = ? and client='${quotation_details[0].client_id}' and consignee='${quotation_details[0].consignee_id}'`,
				[2]
			);

			if (notification_id.length > 0) {
				const [notification_msg] = await db2.execute(
					`SELECT notification_name, notification_message FROM notification_messages WHERE id = ?`,
					[notification_id[0].notification_id]
				);

				const [notification_users] = await db2.execute(
					`SELECT user FROM notifications WHERE notification_id = ?`,
					[notification_id[0].notification_id]
				);

				notification_users.forEach(item => {
					db2.execute(
						"INSERT INTO notification_history (notification_id, user_id, order_id, title, messages) VALUES (?, ?, ?, ?, ?)",
						[
							notification_id[0].notification_id,
							item.user,
							quotation_id,
							title,
							body
						]
					);
				});
			} else {
				return res.status(200).json({ success: true, message: "Quotation Updated, but no notifications sent." });
			}

			return res.status(200).json({ success: true, message: "Quotation Updated" });
		}

	} catch (e) {
		return res.status(400).json({ message: "Error Occurred", error: e.message });
	}
};

const updateQuotationDetails = async (req, res) => {
	const { data } = req.body
	try {
		for (const d of data) {
			await db2.execute(
				"UPDATE quotation_details SET ITF = ?, QOD_QTY = ?, QOD_Unit = ? WHERE QOD_ID = ?",
				[d.ITF, d.itf_quantity, d.itf_unit, d.qod_id],
			)
			await db2.execute(
				"UPDATE quotation_details SET QOD_QP = ? WHERE QOD_ID = ?",
				[d.adjusted_price || null, d.qod_id],
			)
		}

		res.status(200).json({
			message: "Quotation Details Updated",
		})
	} catch (e) {
		res.status(400).json({
			message: "Error Occured",
			error: e,
		})
	}
}
const confirmQuotation = async (req, res) => {
	const { quote_id } = req.body
	try {
		await db2.execute(`CALL Quotation_Confirm(${quote_id})`, [])
		res.status(200).json({
			message: "Quotation Confirmed",
		})
	} catch (e) {
		res.status(400).json({
			message: "Error Occured",
			error: e,
		})
	}
}

const InsertQuotationDetails = async (req, res) => {
	const { input, details } = req.body;
	try {
		if (!input.quotation_id) {
			const [data] = await db2.execute(
				`INSERT INTO quotations (Brand_ID, Client_ID, loading_location, Q_Freight_Provider,
					Liner_ID, Origin_Port, Destination_Port, Q_Clearance_Provider, Q_Transportation_Provider, Consignee_ID, FX_ID,
					Q_FX_rate, Q_Markup, Q_Rebate, palletized, Chamber, load_Before_date, created, updated, user, Status)
				VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, current_timestamp(), ?, '0')`,
				[
					input.brand_id,
					input.client_id,
					input.loading_location,
					input.Freight_provider_,
					input.liner_id,
					input.from_port_,
					input.destination_port_id,
					input.Clearance_provider,
					input.Transportation_provider,
					input.consignee_id,
					input.fx_id,
					input.fx_rate,
					input.mark_up || 0,
					input.rebate || 0,
					input.palletized ? "YES" : "NO",
					input.Chamber ? "YES" : "NO",
					input.load_date,
					input.created,
					input.user,
				],
			);

			const [rows] = await db2.query(
				"SET @QOD_ID = ''; CALL Quotation_Details_Insert(?, ?, ?, ?, ?, ?, ?, @QOD_ID); SELECT @QOD_ID AS QOD_ID",
				[
					details.ITF || null,
					details.Quantity || null,
					details.Unit || null,
					details.Brand || null,
					details.user || null,
					data.insertId || null,
					details.quotation_price || null


				]
			);
			const qod_id = "";
			await db2.execute("CALL Quotation_Number");

			// Execute the Calculate_Quotation procedure
			await db2.execute(
				"CALL Quotation_Calculate(?, ?, @Message_EN, @Message_TH, @Freight_Cost, @Message_EN_OK, @Message_TH_OK)",
				[data.insertId, input.user]
			);

			// Retrieve the output parameter values
			const [results] = await db2.execute(
				"SELECT @Message_EN AS Message_EN, @Message_TH AS Message_TH, @Freight_Cost AS Freight_Cost, @Message_EN_OK AS Message_EN_OK, @Message_TH_OK AS Message_TH_OK"
			);

			const resultData = results[0];

			// Check the Message_EN output parameter
			if (resultData.Message_EN !== null && resultData.Message_EN !== "Freight OK") {
				return res.status(200).json({ success: false, insertId: data.insertId, results: results, message: resultData.Message_EN });
			}

			res.status(200).json({
				success: true,
				message: "Quotation Details Added",
				qod_id: qod_id,
				insertId: data.insertId
			});

		} else {

			await db2.execute(
				`UPDATE quotations SET Brand_ID = ?, Client_ID = ?, loading_location = ?, Q_Freight_Provider = ?,
					Liner_ID = ?, Origin_Port = ?, Destination_Port = ?, Q_Clearance_Provider = ?, Q_Transportation_Provider = ?, Consignee_ID = ?, FX_ID = ?,
					Q_FX_rate = ?, Q_Markup = ?, Q_Rebate = ?, palletized = ?, Chamber = ?, load_Before_date = ?, created = ?, updated = current_timestamp(), user = ?
				WHERE Quotation_ID = ?`,
				[
					input.brand_id,
					input.client_id,
					input.loading_location,
					input.Freight_provider_,
					input.liner_id,
					input.from_port_,
					input.destination_port_id,
					input.Clearance_provider,
					input.Transportation_provider,
					input.consignee_id,
					input.fx_id,
					input.fx_rate,
					input.mark_up || 0,
					input.rebate || 0,
					input.palletized ? "YES" : "NO",
					input.Chamber ? "YES" : "NO",
					input.load_date,
					input.created,
					input.user,
					input.quotation_id,
				],
			);

			if (!details.qod_id) {
				// Insert new quotation details
				const [rows] = await db2.query(
					"SET @QOD_ID = ''; CALL Quotation_Details_Insert(?, ?, ?, ?, ?, ?, ?, @QOD_ID); SELECT @QOD_ID AS QOD_ID",
					[
						details.ITF || null,
						details.Quantity || null,
						details.Unit || null,
						details.Brand || null,
						details.user || null,
						input.quotation_id || null,
						details.quotation_price || null


					]
				);

				const qod_id = "";
				const [quotation_details] = await db2.execute(
					`SELECT quotations.*, DATE_FORMAT(quotations.created, '%d/%m/%Y') as created, DATE_FORMAT(quotations.load_Before_date, '%Y-%m-%d') AS load_Before_date, 
					setup_ports.port_name, users.name,
					clients.client_name AS client_name, setup_location.name AS location_name, consignee.consignee_name
					FROM quotations
					JOIN clients ON quotations.Client_ID = clients.client_id
					JOIN setup_location ON quotations.loading_location = setup_location.id
					JOIN consignee ON consignee.consignee_id = quotations.Consignee_ID
					JOIN setup_ports ON setup_ports.port_id = quotations.Destination_Port
					INNER JOIN users ON users.id = quotations.user
						WHERE quotations.Quotation_ID = ?`,
					[input.quotation_id],
				);

				let title = 'Quotation Adjusted';
				let body = `A quotation has been adjusted on Siam Eats.
				Quotation Number: ${quotation_details[0].Quotation_number}
				Quotation Date: ${quotation_details[0].created}
				Location Name: ${quotation_details[0].location_name}
				Port Name: ${quotation_details[0].port_name}
				Client Name: ${quotation_details[0].client_name}
				Consignee Name: ${quotation_details[0].consignee_name}
				Load Date: ${quotation_details[0].load_Before_date}
				Created by: ${quotation_details[0].name}`;

				await handleNotifications(input.quotation_id, 2, title, body);

				await db2.execute(
					"CALL Quotation_Calculate(?, ?, @Message_EN, @Message_TH, @Freight_Cost, @Message_EN_OK, @Message_TH_OK)",
					[input.quotation_id, input.user]
				);

				// Retrieve the output parameter values
				const [results] = await db2.execute(
					"SELECT @Message_EN AS Message_EN, @Message_TH AS Message_TH, @Freight_Cost AS Freight_Cost, @Message_EN_OK AS Message_EN_OK, @Message_TH_OK AS Message_TH_OK"
				);

				const resultData = results[0];

				// Check the Message_EN output parameter
				if (resultData.Message_EN !== null && resultData.Message_EN !== "Freight OK") {
					return res.status(200).json({ success: false, insertId: input.quotation_id, results: results, message: resultData.Message_EN });
				}

				// Send a success response if the condition is met
				res.status(200).json({
					success: true,
					message: "Quotation Updated",
					qod_id: qod_id,
					insertId: input.quotation_id
				});

			} else {

				await db2.execute(
					`UPDATE quotation_details SET
					ITF = ?,
					QOD_QTY = ?,
					QOD_Unit = ?,
					QOD_Brand = ?,
					QOD_QP = ? WHERE QOD_ID = ?`,
					[
						details.ITF ||
						details.ITF || null,
						details.Quantity || null,
						details.Unit || null,
						details.Brand || null,
						details.quotation_price || null,
						details.qod_id || null
					],
				);

				await db2.execute("CALL Quotation_Details_Update(?,?,?)", [
					details.qod_id || null, details.quotation_price || null, details.user || null
				]);

				const [quotation_details] = await db2.execute(
					`SELECT quotations.*, DATE_FORMAT(quotations.created, '%d/%m/%Y') as created, DATE_FORMAT(quotations.load_Before_date, '%Y-%m-%d') AS load_Before_date, 
					setup_ports.port_name, users.name,
					clients.client_name AS client_name, setup_location.name AS location_name, consignee.consignee_name
					FROM quotations
					JOIN clients ON quotations.Client_ID = clients.client_id
					JOIN setup_location ON quotations.loading_location = setup_location.id
					JOIN consignee ON consignee.consignee_id = quotations.Consignee_ID
					JOIN setup_ports ON setup_ports.port_id = quotations.Destination_Port
					INNER JOIN users ON users.id = quotations.user
						WHERE quotations.Quotation_ID = ?`,
					[input.quotation_id],
				);

				let title = 'Quotation Adjusted';
				let body = `A quotation has been adjusted on Siam Eats.
				Quotation Number: ${quotation_details[0].Quotation_number}
				Quotation Date: ${quotation_details[0].created}
				Location Name: ${quotation_details[0].location_name}
				Port Name: ${quotation_details[0].port_name}
				Client Name: ${quotation_details[0].client_name}
				Consignee Name: ${quotation_details[0].consignee_name}
				Load Date: ${quotation_details[0].load_Before_date}
				Created by: ${quotation_details[0].name}`;

				await handleNotifications(input.quotation_id, 2, title, body, quotation_details[0].client_id, quotation_details[0].consignee_id);

				// Call the Calculate_Quotation stored procedure with input parameters
				await db2.execute(
					"CALL Quotation_Calculate(?, ?, @Message_EN, @Message_TH, @Freight_Cost, @Message_EN_OK, @Message_TH_OK)",
					[input.quotation_id, input.user]
				);

				// Retrieve the output parameter values
				const [results] = await db2.execute(
					"SELECT @Message_EN AS Message_EN, @Message_TH AS Message_TH, @Freight_Cost AS Freight_Cost, @Message_EN_OK AS Message_EN_OK, @Message_TH_OK AS Message_TH_OK"
				);

				// Access the first row of the results
				const resultData = results[0];

				// Check the Message_EN output parameter for any errors
				if (resultData.Message_EN !== null && resultData.Message_EN !== "Freight OK") {
					return res.status(200).json({ success: false, insertId: input.quotation_id, results: results, message: resultData.Message_EN });
				}

				// Send a success response if no errors are found
				res.status(200).json({
					success: true,
					message: "Quotation Updated",
					insertId: input.quotation_id
				});

			}
		}
	} catch (e) {
		res.status(400).json({
			message: "Error Occurred",
			error: e.message
		});
	}
};

async function handleNotifications(quotationId, notificationType, title = '', body = '', client_id = '', consignee_id = '') {
	const [notification_id] = await db2.execute(
		`SELECT * FROM notification_details WHERE notify_on = '${notificationType}' and client='${client_id}' and consignee='${consignee_id}'`,
	);

	if (notification_id.length > 0) {
		const [notification_users] = await db2.execute(
			`SELECT user FROM notifications WHERE notification_id = '${notification_id[0].notification_id}'`,
		);

		notification_users.forEach(async item => {
			await db2.execute(
				"INSERT INTO notification_history (notification_id, user_id, order_id, title, messages) VALUES (?, ?, ?, ?, ?)",
				[
					notification_id[0].notification_id,
					item.user,
					quotationId,
					title,
					body
				],
			);
		});
	}
}

const getQuotationDetailsView = async (req, res) => {
	const { quotation_id } = req.query;
	try {
		const [data] = await db2.query(
			`SELECT quotation_details.*, quotation_details.QOD_CP as Calculated_price, quotation_details.QOD_QP as Quotation_price, itf.itf_name_en, setup_brand.Brand_name as brand_name, dropdown_unit_count.unit_name_en FROM quotation_details INNER JOIN itf ON quotation_details.ITF = itf.itf_id INNER JOIN setup_brand ON quotation_details.QOD_Brand = setup_brand.brand_id INNER JOIN dropdown_unit_count ON quotation_details.QOD_Unit = dropdown_unit_count.unit_id WHERE Quotation_ID = '${quotation_id}' AND Produce_status = 1 ORDER BY quotation_details.Quotation_ID, CAST(itf_classification_ID(quotation_details.ITF) AS INT), PDF_Customs_Produce_Name_ITF(quotation_details.ITF), (quotation_details.QOD_NW / quotation_details.QOD_Box)`,
		)
		if (data.length > 0) {
			for (const element of data) {
				const sql1 = `SELECT Quotation_details_profit_percentage(${element.QOD_ID}) AS profit_percentage`;
				const [rows1] = await db2.query(sql1);
				element.NEW_Profit_percentage = rows1[0].profit_percentage;
			}
		}
		res.status(200).json({
			message: "All Quotation",
			data: data,
		})
	} catch (error) {
		res.status(400).json({
			message: "Error Occurred",
			error: error.message
		});
	}
}

const deleteQuotation = async (req, res) => {
	const { quotation_id } = req.body
	try {
		const [data] = await db2.execute("CALL Quotation_Delete(?,@Message_EN, @Message_TH)", [quotation_id]);
		const [results] = await db2.execute("SELECT @Message_EN AS Message_EN, @Message_TH AS Message_TH");
		const msg = results[0];

		if (msg.Message_EN == "null") {
			res.status(200).json({ success: false, message: msg })
		}
		else {
			res.status(200).json({ success: true, message: "success", data: data })
		}

	} catch (e) {
		res.status(500).json({ message: "Internal server error", error: e.message })
	}
}


const copyQuotation = async (req, res) => {
	const { quotation_id, user_id } = req.body
	try {

		const [data] = await db2.execute("CALL Quotation_Copy(?,?)", [quotation_id, user_id]);

		res.status(200).json({ message: "success", data: data })
	} catch (e) {
		res.status(500).json({ message: "Internal server error", error: e.message })
	}
}


const QuotationConfirmation = async (req, res) => {
	const { quotation_id, user_id } = req.body
	try {

		const [data] = await db2.execute("CALL Quotation_Confirm(?,?)", [quotation_id, user_id]);

		res.status(200).json({ message: "success", data: data })
	} catch (e) {
		res.status(500).json({ message: "Internal server error", error: e.message })
	}
}

const quotation_proforma = async (req, res) => {
	const { quotation_id } = req.query;

	try {
		const [quotationDetailsArray] = await db2.execute(
			`SELECT quotation_details.*, 
       itf.itf_name_en, 
       dropdown_unit_count.unit_name_en  
FROM quotation_details
INNER JOIN itf 
    ON quotation_details.ITF = itf.itf_id
INNER JOIN dropdown_unit_count 
    ON quotation_details.QOD_Unit = dropdown_unit_count.unit_id
WHERE quotation_details.Quotation_ID = ? AND quotation_details.Produce_status=1
ORDER BY quotation_details.Quotation_ID,
         CAST(itf_classification_ID(quotation_details.ITF) AS INT),
         PDF_Customs_Produce_Name_ITF(quotation_details.ITF),
         (quotation_details.QOD_NW / quotation_details.QOD_Box);`,
			[quotation_id]
		);

		const [quotation] = await db2.execute(
			`SELECT * FROM quotations WHERE Quotation_ID = ?`,
			[quotation_id]
		)
		for (let quotationDetails of quotationDetailsArray) {
			const sql1 = `SELECT ITF_HSCODE(${quotationDetails.ITF}) AS HS_CODE`;
			const [rows1] = await db2.query(sql1);
			quotationDetails.HS_CODE = rows1[0].HS_CODE;

		}
		// Prepare the company address with the correct logo URL
		const [quotationFinance] = await db2.execute(
			`SELECT * FROM quotations WHERE Quotation_ID = ?`,
			[quotation_id]
		)

		// fetch company address details
		const [CompanyAddress] = await db2.execute(
			"SELECT * FROM `Company_Address` WHERE `ID` = ?",
			[3],
		)
		const Company_Address = CompanyAddress[0];

		if (Company_Address) {
			Company_Address.logo = "https://terp.siameats.net/api/images/" + Company_Address.logo;
		}
		res.status(200).json({
			success: true,
			message: "Proforma Main quotation details",
			data: quotationDetailsArray,
			quotationFinance: quotationFinance[0],
			quotation: quotation[0],
			Company_Address: Company_Address
		});
	} catch (e) {
		res.status(400).json({
			success: false,
			message: "Error Occurred",
			error: e.message,
		});
	}
};

const RecalculateQuotation = async (req, res) => {
	const { quotation_id, user_id } = req.body
	try {
		const [data] = await db2.execute("CALL Quotation_Pricing_Reset(?,?)", [quotation_id, user_id])

		const [details] = await db2.execute("CALL Quotation_Calculate(?,?, @Message_EN, @Message_TH, @Freight_Cost, @Message_EN_OK, @Message_TH_OK)", [quotation_id, user_id])
		const [results] = await db2.execute("SELECT @Message_EN AS Message_EN, @Message_TH AS Message_TH, @Freight_Cost AS Freight_Cost, @Message_EN_OK AS Message_EN_OK, @Message_TH_OK AS Message_TH_OK");

		const resultData = results[0]
		if (resultData.Message_EN !== null && resultData.Message_EN !== "Freight OK") {
			res.status(200).json({ success: false, results: results, message: resultData.Message_EN });
		}
		// Send a success response if no errors are found
		return res.status(200).json({
			success: true,
			message: "Recalculated Successfully",
			data: details,
		});

	} catch (e) {
		return res.status(400).json({
			message: "Error Occured",
			error: e.message,
		})
	}
}


const quotation_delivery_terms = async (req, res) => {
	const { quotation_id } = req.body;
	try {
		// Set the dynamic message variable
		await db2.execute("SET @Dynamic_message = ''");

		const result = await db2.execute("CALL Quotation_delivery_terms(?, @Dynamic_message)", [quotation_id]);

		// Retrieve the dynamic message
		const [messagesResult] = await db2.execute("SELECT @Dynamic_message AS Dynamic_message");

		const DynamicMessage = messagesResult[0]?.Dynamic_message;
		// Check if there is a dynamic message
		res.status(200).json({
			success: true,
			message: DynamicMessage
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: 'Internal server error',
			error: error.message
		});
	}
};


const quotation_pdf_delivery_by = async (req, res) => {
	const { quotation_id } = req.body;

	try {

		// Set the dynamic message variable
		const [result] = await db2.execute("SELECT Quotation_PDF_Delivery_by(?) AS Delivery_By", [quotation_id]);
		// Get the delivery by value
		const DeliveryBy = result[0]?.Delivery_By;

		// Check if there is a dynamic message
		res.status(200).json({
			success: true,
			message: DeliveryBy
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: 'Internal server error',
			error: error.message
		});
	}
}


// const QuotationPDF = async (req, res) => {
// 	const { quotation_id } = req.body;
// 	try {
// 		const [quotationDetailsArray] = await db2.execute(
// 			`SELECT 
//     quotation_details.*, 
//     itf.images as itf_img, 
//     setup_produce.images as produce_img, 
// 	ean.images as ean_img,
// 	setup_box.images as box_img,
//     CASE 
//         WHEN quotation_details.QOD_QP IS NULL THEN quotation_details.QOD_CP
//         ELSE quotation_details.QOD_QP
//     END AS quotation_price
// FROM quotation_details
// LEFT JOIN itf ON itf.itf_id = quotation_details.ITF
// LEFT JOIN setup_produce ON setup_produce.produce_id = quotation_details.Produce
// LEFT JOIN ean ON ean.ean_id  = quotation_details.Ean_ID
// LEFT JOIN setup_box ON setup_box.box_id  = quotation_details.Box_ID
// WHERE quotation_details.Quotation_ID = ? 
//   AND quotation_details.Produce_status = 1
// ORDER BY 
//     quotation_details.Quotation_ID,
//     CAST(itf_classification_ID(quotation_details.ITF) AS INT),
//     PDF_Customs_Produce_Name_ITF(quotation_details.ITF),
//     (quotation_details.QOD_NW / quotation_details.QOD_Box);`,
// 			[quotation_id]
// 		);

// 		const [order] = await db2.execute(
// 			`SELECT * FROM quotations WHERE Quotation_ID = ?`,
// 			[quotation_id]
// 		)
// 		for (let element of quotationDetailsArray) {

// 			const sql1 = `SELECT ITF_Name_EN(${element.ITF}) AS ITF_Name`;
// 			const [rows1] = await db2.query(sql1);
// 			element.ITF_Name = rows1[0].ITF_Name;

// 			const sql2 = `SELECT ITF_Scientific_name(${element.ITF}) AS ITF_Scientific_name`;
// 			const [rows2] = await db2.query(sql2);
// 			element.ITF_Scientific_name = rows2[0].ITF_Scientific_name;

// 			const sql3 = `SELECT ITF_HSCODE(${element.ITF}) AS ITF_HSCODE`;
// 			const [rows3] = await db2.query(sql3);
// 			element.ITF_HSCODE = rows3[0].ITF_HSCODE;


// 			const sql4 = `SELECT PDF_Quotation_Unit_price(${element.QOD_ID}) AS Unit_price`;
// 			const [rows4] = await db2.query(sql4);
// 			element.Unit_price = rows4[0].Unit_price;
// 		}

// 		// fetch order finance details
// 		const [quotationFinance] = await db2.execute(
// 			`SELECT * FROM quotations WHERE Quotation_ID = ?`,
// 			[quotation_id]
// 		)

// 		// fetch company address details
// 		const [CompanyAddress] = await db2.execute(
// 			"SELECT * FROM `Company_Address` WHERE `ID` = ?",
// 			[3],
// 		)
// 		const Company_Address = CompanyAddress[0];

// 		if (Company_Address) {
// 			Company_Address.logo = "https://terp.siameats.net/api/images/" + Company_Address.logo;
// 		}


// 		res.status(200).json({
// 			success: true,
// 			message: "Proforma Main Invoice Details",
// 			quotationDetails: quotationDetailsArray,
// 			Company_Address: Company_Address,
// 			quotationFinance: quotationFinance,
// 			quotation: order[0]
// 		});
// 	} catch (e) {
// 		res.status(400).json({
// 			success: false,
// 			message: "Error Occurred",
// 			error: e.message,
// 		});
// 	}
// };


const QuotationPDF = async (req, res) => {
	const { quotation_id } = req.body;
	const baseUrl = "https://terp.siameats.net/api/images/";

	try {
		const [quotationDetailsArray] = await db2.execute(
			`SELECT 
		  quotation_details.*, 
		  itf.images as itf_img, 
		  setup_produce.images as produce_img, 
		  ean.images as ean_img,
		  setup_box.images as box_img,
		  CASE 
			WHEN quotation_details.QOD_QP IS NULL THEN quotation_details.QOD_CP
			ELSE quotation_details.QOD_QP
		  END AS quotation_price
		FROM quotation_details
		LEFT JOIN itf ON itf.itf_id = quotation_details.ITF
		LEFT JOIN setup_produce ON setup_produce.produce_id = quotation_details.Produce
		LEFT JOIN ean ON ean.ean_id = quotation_details.Ean_ID
		LEFT JOIN setup_box ON setup_box.box_id = quotation_details.Box_ID
		WHERE quotation_details.Quotation_ID = ? 
		AND quotation_details.Produce_status = 1
		ORDER BY 
		  quotation_details.Quotation_ID,
		  CAST(itf_classification_ID(quotation_details.ITF) AS INT),
		  PDF_Customs_Produce_Name_ITF(quotation_details.ITF),
		  (quotation_details.QOD_NW / quotation_details.QOD_Box);`,
			[quotation_id]
		);

		for (let element of quotationDetailsArray) {
			// Attach base URL to image properties explicitly:
			if (element.itf_img) {
				element.itf_img = baseUrl + element.itf_img;
			}
			if (element.produce_img) {
				element.produce_img = baseUrl + element.produce_img;
			}
			if (element.ean_img) {
				element.ean_img = baseUrl + element.ean_img;
			}
			if (element.box_img) {
				element.box_img = baseUrl + element.box_img;
			}

			// ... your existing logic for fetching additional details ...

			const sql1 = `SELECT ITF_Name_EN(${element.ITF}) AS ITF_Name`;
			const [rows1] = await db2.query(sql1);
			element.ITF_Name = rows1[0].ITF_Name;

			const sql2 = `SELECT ITF_Scientific_name(${element.ITF}) AS ITF_Scientific_name`;
			const [rows2] = await db2.query(sql2);
			element.ITF_Scientific_name = rows2[0].ITF_Scientific_name;

			const sql3 = `SELECT ITF_HSCODE(${element.ITF}) AS ITF_HSCODE`;
			const [rows3] = await db2.query(sql3);
			element.ITF_HSCODE = rows3[0].ITF_HSCODE;

			const sql4 = `SELECT PDF_Quotation_Unit_price(${element.QOD_ID}) AS Unit_price`;
			const [rows4] = await db2.query(sql4);
			element.Unit_price = rows4[0].Unit_price;
		}

		// ... your existing logic for fetching order, finance, and company address details ...

		const [order] = await db2.execute(
			`SELECT * FROM quotations WHERE Quotation_ID = ?`,
			[quotation_id]
		);

		const [quotationFinance] = await db2.execute(
			`SELECT * FROM quotations WHERE Quotation_ID = ?`,
			[quotation_id]
		);

		const [CompanyAddress] = await db2.execute(
			"SELECT * FROM `Company_Address` WHERE `ID` = ?",
			[3]
		);
		const Company_Address = CompanyAddress[0];

		if (Company_Address) {
			Company_Address.logo = baseUrl + Company_Address.logo;
		}

		res.status(200).json({
			success: true,
			message: "Proforma Main Invoice Details",
			quotationDetails: quotationDetailsArray,
			Company_Address: Company_Address,
			quotationFinance: quotationFinance,
			quotation: order[0]
		});
	} catch (e) {
		res.status(400).json({
			success: false,
			message: "Error Occurred",
			error: e.message,
		});
	}
};

const QuotationITFCHECK = async (req, res) => {
	try {

		const { ITF_id, Quotation_id } = req.body;
		const [data] = await db2.query('CALL Quotation_ITF_CHECK(?, ?, @ITF_EXISTS_EN, @ITF_EXISTS_TH, @ITF_DUPLICATE_EN, @ITF_DUPLICATE_TH)', [ITF_id, Quotation_id]);

		// Extract the error messages from the session variables
		const [result] = await db2.query('SELECT @ITF_EXISTS_EN AS ITF_EXISTS_EN, @ITF_EXISTS_TH AS ITF_EXISTS_TH, @ITF_DUPLICATE_EN AS ITF_DUPLICATE_EN, @ITF_DUPLICATE_TH AS ITF_DUPLICATE_TH');
		const { ITF_EXISTS_EN, ITF_EXISTS_TH, ITF_DUPLICATE_EN, ITF_DUPLICATE_TH } = result[0];

		// Determine which error message to show
		let errorMessage = null;
		let errorType = null;

		if (ITF_EXISTS_EN) {
			errorMessage = ITF_EXISTS_EN;
			errorType = 'ITF_EXISTS_EN';
		} else if (ITF_DUPLICATE_EN) {
			errorMessage = ITF_DUPLICATE_EN;
			errorType = 'ITF_DUPLICATE_EN';
		}

		// If there is an error message, send the error response
		if (errorMessage) {
			res.status(200).json({
				success: false,
				message: 'Error occurred',
				errorType,
				errorMessage
			});
		} else {
			// If no error message, send a success response
			res.status(200).json({
				success: true,
				message: 'Success'
			});
		}
	} catch (error) {
		res.status(500).json({
			success: false,
			message: 'Internal server error',
			error: error.message
		});
	}
};

const ExpireQuotations = async (req, res) => {
	try {
		const { quotationId } = req.body;
		await db2.query("CALL Quotation_expired(?);", [quotationId]);
		res.status(200).json({
			success: true,
			message: 'Success'
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: 'Internal server error',
			error: error.message
		});
	}
};


const getoneQuotationData = async (req, res) => {
	try {
		const { quotation_id } = req.body;
		let sql = `
            SELECT quotations.*, 
                DATE_FORMAT(quotations.load_Before_date, '%d-%m-%Y') AS load_Before_date, 
                setup_ports.port_name, 
                setup_ports.IATA_code AS Airport_IATA_code,  
                dropdown_currency.currency AS currency, 
                vendors.name AS clearance_name,
                clients.client_name AS client_name, 
                clients.client_address AS client_address, 
                setup_location.name AS location_name, 
                consignee.consignee_name, 
                consignee.consignee_address,
                clients.client_tax_number, 
                clients.client_email,
                clients.client_phone, 
                consignee.consignee_tax_number, 
                consignee.consignee_email, 
                consignee.consignee_phone,
                users.name AS created_by,
                setup_liner.liner_name AS Airline, 
                setup_liner.liner_code AS Airline_liner_code
            FROM quotations
            INNER JOIN clients ON quotations.Client_ID = clients.client_id
            INNER JOIN setup_location ON quotations.loading_location = setup_location.id
            INNER JOIN consignee ON consignee.consignee_id = quotations.Consignee_ID
            INNER JOIN setup_ports ON setup_ports.port_id = quotations.Destination_Port
            INNER JOIN dropdown_currency ON dropdown_currency.currency_id = quotations.FX_ID
            INNER JOIN vendors ON vendors.vendor_id = quotations.Q_Clearance_Provider
            INNER JOIN users ON users.id = quotations.user
            INNER JOIN setup_liner ON setup_liner.liner_id = quotations.Liner_ID where quotations.Quotation_ID=?`;

		// Execute the query with parameters
		const [data] = await db2.query(sql, [quotation_id]);

		if (!data || data.length === 0) {
			return res.status(404).json({
				message: "Quotation not found",
			});
		}

		res.status(200).json({
			message: "Quotation retrieved successfully",
			data: data,
		});

	} catch (e) {
		res.status(400).json({
			message: "Error Occurred",
			error: e,
		});
	}
};

const NewItfDropDown = async (req, res) => {
	const { Consignee_id } = req.body
	try {

		const [data] = await db2.execute("CALL Consignee_ITF_dropdown(?)", [Consignee_id]);
		res.status(200).json({ message: "success", data: data[0] })
	} catch (e) {
		res.status(500).json({ message: "Internal server error", error: e.message })
	}
}

const ITFgenerateName = async (req, res) => {
	const { ITF_ID, brand } = req.body
	try {

		const [details] = await db2.query(
			"UPDATE itf SET brand = ? WHERE itf_id = ?",
			[brand, ITF_ID] // Ensure you pass both 'brand' and 'itf_id' values
		);


		const [data] = await db2.execute("CALL ITF_Names_UPDATE(?)", [ITF_ID]);

		const [itfData] = await db2.query(`
            SELECT 
	itf.Internal_Name_EN AS  ITF_Internal_Name_EN,
	itf.Internal_Name_TH AS  ITF_Internal_Name_TH,
    itf.itf_name_en,
	itf.itf_name_th AS ITF_name_th
FROM 
    itf
WHERE itf_id='${ITF_ID}'
`);
		res.status(200).json({ message: "success", data: data, itfData: itfData[0] })
	} catch (e) {
		res.status(500).json({ message: "Internal server error", error: e.message })
	}
}

const QuotationMarkup = async (req, res) => {
	const { Consignee_id } = req.body
	try {
		const sql1 = `SELECT Quotation_Markup(${Consignee_id}) AS Quotation_Markup`;
		const [rows1] = await db2.query(sql1);
		res.status(200).json({ message: "success", Quotation_Markup: rows1[0].Quotation_Markup })
	} catch (e) {
		res.status(500).json({ message: "Internal server error", error: e.message })
	}
}

const QuotationCostModal = async (req, res) => {
	const { quotation_id } = req.body
	try {

		const [data] = await db2.execute("CALL Quotation_Cost_Modal(?)", [quotation_id]);
		res.status(200).json({ message: "success", data: data[0] })
	} catch (e) {
		res.status(500).json({ message: "Internal server error", error: e.message })
	}
}

const OrderCostModal = async (req, res) => {
	const { order_id } = req.body
	try {

		const [data] = await db2.execute("CALL Order_Cost_Modal(?)", [order_id]);
		res.status(200).json({ message: "success", data: data[0] })
	} catch (e) {
		res.status(500).json({ message: "Internal server error", error: e.message })
	}
}


const InvoiceCostModal = async (req, res) => {
	const { invoice_id } = req.body
	try {

		const [data] = await db2.execute("CALL Invoice_costs_Modal(?)", [invoice_id]);
		res.status(200).json({ message: "success", data: data[0] })
	} catch (e) {
		res.status(500).json({ message: "Internal server error", error: e.message })
	}
}


module.exports = {
	getAllQuotation,
	addQuotation,
	addQuotationDetails,
	calculateQuotation,
	getQuotationDetials,
	getQuotationSummary,
	deleteQuotationDetials,
	updateQuotationDetails,
	updateQuotation,
	confirmQuotation,
	InsertQuotationDetails,
	getQuotationDetailsView,
	deleteQuotation,
	copyQuotation,
	QuotationConfirmation,
	quotation_proforma,
	RecalculateQuotation,
	quotation_delivery_terms,
	quotation_pdf_delivery_by,
	QuotationPDF,
	QuotationITFCHECK,
	ExpireQuotations,
	getoneQuotationData,
	NewItfDropDown,
	QuotationMarkup,
	QuotationCostModal,
	OrderCostModal,
	InvoiceCostModal,
	ITFgenerateName
}
