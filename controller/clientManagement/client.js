const { db } = require("../../db/db2")

const addClient = async (req, res) => {

	try {
		const [rows] = await db.execute(
			"INSERT INTO clients (client_name, client_tax_number, client_email, client_phone, client_address, client_bank_name, client_bank_account, client_bank_number, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?,?)",
			[
				req.body.client_name,
				req.body.client_tax_number,
				req.body.client_email,
				req.body.client_phone,
				req.body.client_address,
				req.body.client_bank_name,
				req.body.client_bank_account,
				parseInt(req.body.client_bank_number),
				req.body.user_id
			],
		)
		res.status(200).send({
			success: true,
			message: "Client Added Successfully"
		})
	} catch (e) {
		res.status(500).send({
			success: false,
			message: e,
		})
	}
}

const getAllClients = async (req, res) => {
	try {
		const [rows] = await db.query("SELECT * FROM clients")
		res.status(200).send({
			success: true,
			message: "Getting Data Successfully",
			data: rows,
		})
	} catch (e) {
		res.status(500).send({
			success: false,
			message: e,
		})
	}
}

const updateClientData = async (req, res) => {
	try {
		const [rows] = await db.execute(
			`UPDATE clients SET
		client_name = 				:client_name,
		client_tax_number = 	:client_tax_number,
		client_email = 				:client_email,
		client_phone = 				:client_phone,
		client_address = 			:client_address,
		client_bank_name = 		:client_bank_name,
		client_bank_account = :client_bank_account,
		client_bank_number = 	:client_bank_number
		WHERE client_id = 		:client_id`,
			{
				client_name: req.body.client_name,
				client_tax_number: req.body.client_tax_number,
				client_email: req.body.client_email,
				client_phone: req.body.client_phone,
				client_address: req.body.client_address,
				client_bank_name: req.body.client_bank_name,
				client_bank_account: req.body.client_bank_account,
				client_bank_number: parseInt(req.body.client_bank_number),
				client_id: req.body.client_id,
			},
		)
		res.status(200).send({
			success: true,
			message: "Update Data Successfully"
		})
	} catch (e) {
		res.status(500).send({
			success: false,
			message: e.message,
		})
	}
}

const getClientAsOptions = async (req, res) => {
	try {
		const [row] = await db.query("SELECT client_id, client_name FROM clients")
		return res.status(200).send({
			success: true,
			message: "Client Data Receiving Successfully",
			data: row,
		})
	} catch (e) {
		res.status(500).send({
			success: false,
			message: e,
		})
	}
}

const clientShipTo = async (req, res) => {
	const {
		client_id,
		shipto_name,
		shipto_tax_number,
		Shipto_email,
		Shipto_phone,
		Shipto_address,
		port_id,
		rebate,
		commission,
		commission_value,
		currency,
		notify_name,
		notify_tax_number,
		notify_email,
		notify_phone,
		notify_address,
		margin,
	} = req.body
	const query =
		"INSERT INTO shiptos(client_id, shipto_name, shipto_tax_number, Shipto_email,Shipto_phone, Shipto_address, port_id, rebate, commission, commission_value, currency, notify_name, notify_tax_number, notify_email, notify_phone, notify_address, margin) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
	const values = [
		client_id,
		shipto_name,
		shipto_tax_number,
		Shipto_email,
		Shipto_phone,
		Shipto_address,
		port_id,
		rebate,
		commission,
		commission_value,
		currency,
		notify_name,
		notify_tax_number,
		notify_email,
		notify_phone,
		notify_address,
		margin,
	]

	try {
		await db.execute(query, values)
		res.status(200).send({
			success: true,
			message: "Ship To Added Successfully",
		})
	} catch (e) {
		res.status(500).send({
			success: false,
			message: e,
		})
	}
}

const updateClientShipTo = async (req, res) => {
	try {
		await db.query(
			"UPDATE shiptos SET client_id = ?, shipto_name = ?, shipto_tax_number = ?, Shipto_email = ?, Shipto_phone = ?, Shipto_address = ?, port_id = ?, rebate = ?, commission=?, commission_value = ?, currency = ?, notify_name=?, notify_tax_number = ?,notify_email=?, notify_phone = ?, notify_address=?, margin = ? WHERE shipto_id = ?",
			[
				req.body.client_id,
				req.body.shipto_name,
				req.body.shipto_tax_number,
				req.body.Shipto_email,
				req.body.Shipto_phone,
				req.body.Shipto_address,
				req.body.port_id,
				req.body.rebate,
				req.body.commission,
				req.body.commission_value,
				req.body.currency,
				req.body.notify_name,
				req.body.notify_tax_number,
				req.body.notify_email,
				req.body.notify_phone,
				req.body.notify_address,
				req.body.margin,
				req.body.shipto_id,
			],
		)
		res.status(200).send({
			success: false,
			message: "Ship To Updated Successfully",
		})
		return
	} catch (e) {
		res.status(500).send({
			success: false,
			message: e,
		})
	}
}

const updateShipToStatus = async (req, res) => {
	const shipToId = req.body.shipto_id

	try {
		const [data] = await db.query(
			"SELECT status, shipto_id FROM shiptos WHERE shipto_id = ?",
			[shipToId],
		)
		const newStatus = data[0]?.status.toLowerCase() === "on" ? "off" : "on"
		await db.query("UPDATE shiptos SET status = ? WHERE shipto_id = ?", [
			newStatus,
			shipToId,
		])
		res.status(200).send({
			success: true,
			status: data[0]?.status.toLowerCase() === "on" ? "off" : "on",
			message: "ShipTo Status Updated Successfully",
		})
	} catch (e) {
		res.status(500).send({
			success: false,
			message: e,
		})
	}
}

const getShipTo = async (req, res) => {
	try {
		const [data] = await db.query("SELECT * FROM shiptos")
		res.status(200).send({
			success: true,
			message: "Getting Data Successfully",
			data: data,
		})
	} catch (e) {
		res.status(500).send({
			success: false,
			message: e,
		})
	}
}

const updateClientStatus = async (req, res) => {
	const clientId = req.body.client_id
	try {
		const [data] = await db.query(
			"SELECT status, client_id FROM clients WHERE client_id = ?",
			[clientId],
		)
		const updateStatus =
			`${data[0].status}`.toLocaleLowerCase() == "on" ? "off" : "on"
		await db.query(
			`UPDATE clients SET status = "${updateStatus}" WHERE client_id = "${clientId}"`,
		)
		res.status(200).send({
			success: true,
			status: updateStatus,
			message: "Client Status Updated Successfully",
		})
	} catch (error) {
		res.status(500).send({
			success: false,
			message: error,
		})
	}
}

const getClientStatistics = async (req, res) => {
	try {
		const { client_id } = req.body;
		const [data] = await db.execute("CALL Client_statistics(?, @p1, @p2, @p3, @p4, @p5, @p6, @p7, @p8, @p9, @p10, @p11, @p12, @p13, @p14, @p15)", [client_id])
		const [results] = await db.execute("SELECT @p1 AS First_Shipment, @p2 AS Last_Shipment, @p3 AS Pipe_Line, @p4 AS Total_GW, @p5 AS Total_NW, @p6 AS Total_CBM, @p7 AS Total_Box, @p8 AS Total_shipments, @p9 AS Total_invoiced_value, @p10 AS Total_Claims, @p11 AS Total_Claims_value, @p13 AS Total_payments_value, @p14 AS Average_Payment, @p15 AS Balance");

		// Send the results back to the client
		res.status(200).json({
			success: true,
			data: results[0],
			items: data[0]
		});

	} catch (error) {
		res.status(500).json({
			success: false,
			message: "Internal server error",
			error: error.message
		});
	}
}

const getClientStatement = async (req, res) => {
	try {
		const { client_id, from_date, to_date } = req.body;

		// Execute the stored procedure
		const [data] = await db.execute(
			"CALL Client_statement(?, ?, ?, @p3, @p4, @p5, @p6, @p7, @p8, @p9, @p10, @p11, @p12, @p13, @p14)",
			[client_id, from_date, to_date]
		);

		const transformedData = data[0].map(record => ({
			Date_: record['Date'], // Use brackets for field names with spaces
			AWB: record['AWB'],
			Transaction_Ref: record['Transaction Ref'], // Handle field names with spaces
			Invocied_Amount: record['Invoiced Amount'], // Handle field names with spaces
			Currnecy: record['Currnecy'],
			Paid_Amount: record['Paid Amount'], // Handle field names with spaces
			TT_Reference: record['TT Reference'],
			Client_Reference: record['Client Reference'] // Handle field names with spaces
		}));
		// Fetch the values of the output parameters
		const [results] = await db.execute(
			"SELECT @p3 AS pre_statement_Invoices, @p4 AS pre_statement_claims, @p5 AS pre_statement_payments, @p6 AS pre_statement_Totals, @p7 AS statement_Invoices, @p8 AS statement_claims, @p9 AS statement_payments, @p10 AS statement_Totals, @p11 AS Total_Invoices, @p12 AS Total_Claims, @p13 AS Total_Payment, @p14 AS Total"
		);
		res.status(200).json({
			success: true,
			data: results[0],
			result: transformedData
		});

	} catch (error) {
		res.status(500).json({
			success: false,
			message: "Internal server error",
			error: error.message
		});
	}
};

const insertClientPayment = async (req, res) => {
	try {
		const {
			Client_id,
			Consignee_ID,
			Payment_date,
			Payment_Channel,
			FX_Payment,
			FX_ID,
			FX_Rate,
			Intermittent_bank_charges,
			Local_bank_Charges,
			THB_Received,
			Client_payment_ref,
			Bank_Ref,
			user_id
		} = req.body;
		//console.log(req.body);

		// Call the stored procedure
		const [data] = await db.execute(
			`CALL Insert_Invoice_Payment(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, @payment_id,?)`,
			[
				Client_id,
				Consignee_ID,
				Payment_date,
				Payment_Channel,
				FX_Payment,
				FX_ID,
				FX_Rate,
				Intermittent_bank_charges,
				Local_bank_Charges,
				THB_Received,
				Client_payment_ref,
				Bank_Ref,
				user_id
			]
		);
		const [results] = await db.execute(
			"SELECT  @payment_id AS  payment_id"
		);
		// Send a success response
		res.status(200).json({
			success: true,
			message: 'Client payment inserted successfully',
			data: results[0]
		});
	} catch (error) {
		// Handle any errors
		res.status(500).json({
			success: false,
			message: 'Internal server error',
			error: error.message
		});
	}
};


/* const MainStatisticsAll = async (req, res) => {
	try {
		const { Consignee_id, Client_id, Start_Date, End_Date, Compare_Start_DATE, Compare_END_DATE } = req.body;


		const [data] = await db.execute("CALL Main_Statistics_Claim(?, ?, ?, ?, ?, ?, @Total, @Difference, @Count_)",
			[Client_id, Consignee_id, Start_Date, End_Date, Compare_Start_DATE, Compare_END_DATE])

		// Fetch the values of the output parameters
		const [Claim] = await db.execute("SELECT @Total AS Total, @Difference AS Difference, @Count_ AS Count_");

		const [data1] = await db.execute("CALL Main_Statistics_Freight(?, ?, ?, ?, ?, ?, @Total, @Difference, @Count_)",
			[Client_id, Consignee_id, Start_Date, End_Date, Compare_Start_DATE, Compare_END_DATE])

		// Fetch the values of the output parameters
		const [Freight] = await db.execute("SELECT @Total AS Total, @Difference AS Difference, @Count_ AS Count_");

		const [data2] = await db.execute("CALL Main_Statistics_GW(?, ?, ?, ?, ?, ?, @Total, @Difference)",
			[Client_id, Consignee_id, Start_Date, End_Date, Compare_Start_DATE, Compare_END_DATE])

		// Fetch the values of the output parameters
		const [GW] = await db.execute("SELECT @Total AS Total, @Difference AS Difference");

		const [data3] = await db.execute("CALL Main_Statistics_Income(?, ?, ?, ?, ?, ?, @Total, @Difference, @Count_)",
			[Client_id, Consignee_id, Start_Date, End_Date, Compare_Start_DATE, Compare_END_DATE])

		// Fetch the values of the output parameters
		const [Income] = await db.execute("SELECT @Total AS Total, @Difference AS Difference, @Count_ AS Count_");

		const [data6] = await db.query("CALL Main_Statistics_Manhour(?, ?, ?, ?, ?, ?, @Total, @Difference, @Count_)",
			[Client_id, Consignee_id, Start_Date, End_Date, Compare_Start_DATE, Compare_END_DATE])

		// Fetch the values of the output parameters
		const [Manhour] = await db.execute("SELECT @Total AS Total, @Difference AS Difference, @Count_ AS Count_");

		const [data7] = await db.query("CALL Main_Statistics_NW(?, ?, ?, ?, ?, ?, @Total, @Difference)",
			[Client_id, Consignee_id, Start_Date, End_Date, Compare_Start_DATE, Compare_END_DATE])

		// Fetch the values of the output parameters
		const [NW] = await db.execute("SELECT @Total AS Total, @Difference AS Difference");

		const [data8] = await db.query("CALL Main_Statistics_Payables(?, ?, ?, ?, ?, ?, @Total, @Difference, @Count_)",
			[Client_id, Consignee_id, Start_Date, End_Date, Compare_Start_DATE, Compare_END_DATE])

		// Fetch the values of the output parameters
		const [Payables] = await db.execute("SELECT @Total AS Total, @Difference AS Difference, @Count_ AS Count_");


		const [data9] = await db.query("CALL Main_Statistics_Profit(?, ?, ?, ?, ?, ?, @Total, @Difference, @Count_)",
			[Client_id, Consignee_id, Start_Date, End_Date, Compare_Start_DATE, Compare_END_DATE])

		// Fetch the values of the output parameters
		const [Profit] = await db.execute("SELECT @Total AS Total, @Difference AS Difference, @Count_ AS Count_");

		const [data4] = await db.query("CALL Main_Statistics_Receivable(?, ?, ?, ?, ?, ?, @Total, @Difference, @Count_)",
			[Client_id, Consignee_id, Start_Date, End_Date, Compare_Start_DATE, Compare_END_DATE])

		const [Receivable] = await db.execute("SELECT @Total AS Total, @Difference AS Difference, @Count_ AS Count_");

		const [data5] = await db.query("CALL Main_Statistics_Expenses(?, ?, ?, ?, ?, ?, @Total, @Difference, @Count_)",
			[Client_id, Consignee_id, Start_Date, End_Date, Compare_Start_DATE, Compare_END_DATE])

		const [Expenses] = await db.execute("SELECT @Total AS Total, @Difference AS Difference, @Count_ AS Count_");

		res.status(200).json({
			success: true,
			data: {
				Claim: Claim[0],
				Freight: Freight[0],
				GW: GW[0],
				Income: Income[0],
				Manhour: Manhour[0],
				NW: NW[0],
				Payables: Payables[0],
				Profit: Profit[0],
				Receivable: Receivable[0],
				Expenses: Expenses[0]
			}
		});

	} catch (error) {
		res.status(500).json({
			success: false,
			message: "Internal server error",
			error: error.message
		});
	}
}; */

const MainStatisticsAll = async (req, res) => {
	try {
		const { Consignee_id, Client_id, Start_Date, End_Date, Compare_Start_DATE, Compare_END_DATE } = req.body;


		const [data] = await db.execute("CALL Main_Statistics_1C(?, ?, ?, ?, ?, ?, @Total, @Difference, @Count_, @Title)",
			[Client_id, Consignee_id, Start_Date, End_Date, Compare_Start_DATE, Compare_END_DATE])

		// Fetch the values of the output parameters
		const [Claim] = await db.execute("SELECT @Total AS Total, @Difference AS Difference, @Count_ AS Count_, @Title AS Title");

		const [data1] = await db.execute("CALL Main_Statistics_2C(?, ?, ?, ?, ?, ?, @Total, @Difference, @Count_, @Title)",
			[Client_id, Consignee_id, Start_Date, End_Date, Compare_Start_DATE, Compare_END_DATE])

		// Fetch the values of the output parameters
		const [Freight] = await db.execute("SELECT @Total AS Total, @Difference AS Difference, @Count_ AS Count_, @Title AS Title");

		const [data2] = await db.execute("CALL Main_Statistics_3B(?, ?, ?, ?, ?, ?, @Total, @Difference, @Title)",
			[Client_id, Consignee_id, Start_Date, End_Date, Compare_Start_DATE, Compare_END_DATE])

		// Fetch the values of the output parameters
		const [GW] = await db.execute("SELECT @Total AS Total, @Difference AS Difference, @Title AS Title");

		const [data3] = await db.execute("CALL Main_Statistics_1A(?, ?, ?, ?, ?, ?, @Total, @Difference, @Count_, @Title)",
			[Client_id, Consignee_id, Start_Date, End_Date, Compare_Start_DATE, Compare_END_DATE])

		// Fetch the values of the output parameters
		const [Income] = await db.execute("SELECT @Total AS Total, @Difference AS Difference, @Count_ AS Count_, @Title AS Title");

		const [data6] = await db.query("CALL Main_Statistics_2D(?, ?, ?, ?, ?, ?, @Total, @Difference, @Count_, @Title)",
			[Client_id, Consignee_id, Start_Date, End_Date, Compare_Start_DATE, Compare_END_DATE])

		// Fetch the values of the output parameters
		const [Manhour] = await db.execute("SELECT @Total AS Total, @Difference AS Difference, @Count_ AS Count_, @Title AS Title");

		const [data7] = await db.query("CALL Main_Statistics_3A(?, ?, ?, ?, ?, ?, @Total, @Difference, @Title)",
			[Client_id, Consignee_id, Start_Date, End_Date, Compare_Start_DATE, Compare_END_DATE])

		// Fetch the values of the output parameters
		const [NW] = await db.execute("SELECT @Total AS Total, @Difference AS Difference, @Title AS Title");

		const [data8] = await db.query("CALL Main_Statistics_2B(?, ?, ?, ?, ?, ?, @Total, @Difference, @Count_, @Title)",
			[Client_id, Consignee_id, Start_Date, End_Date, Compare_Start_DATE, Compare_END_DATE])

		// Fetch the values of the output parameters
		const [Payables] = await db.execute("SELECT @Total AS Total, @Difference AS Difference, @Count_ AS Count_, @Title AS Title");


		const [data9] = await db.query("CALL Main_Statistics_1D(?, ?, ?, ?, ?, ?, @Total, @Difference, @Count_, @Title)",
			[Client_id, Consignee_id, Start_Date, End_Date, Compare_Start_DATE, Compare_END_DATE])

		// Fetch the values of the output parameters
		const [Profit] = await db.execute("SELECT @Total AS Total, @Difference AS Difference, @Count_ AS Count_, @Title AS Title");

		const [data4] = await db.query("CALL Main_Statistics_2A(?, ?, ?, ?, ?, ?, @Total, @Difference, @Count_, @Title)",
			[Client_id, Consignee_id, Start_Date, End_Date, Compare_Start_DATE, Compare_END_DATE])

		const [Receivable] = await db.execute("SELECT @Total AS Total, @Difference AS Difference, @Count_ AS Count_, @Title AS Title");

		const [data5] = await db.query("CALL Main_Statistics_1B(?, ?, ?, ?, ?, ?, @Total, @Difference, @Count_, @Title)",
			[Client_id, Consignee_id, Start_Date, End_Date, Compare_Start_DATE, Compare_END_DATE])

		const [Expenses] = await db.execute("SELECT @Total AS Total, @Difference AS Difference, @Count_ AS Count_, @Title AS Title");

		const [data10] = await db.query("CALL Main_Statistics_3C(?, ?, ?, ?, ?, ?, @Total, @Difference,  @Count_, @Title)",
			[Client_id, Consignee_id, Start_Date, End_Date, Compare_Start_DATE, Compare_END_DATE])

		// Fetch the values of the output parameters
		const [AR_Ratios] = await db.execute("SELECT @Total AS Total, @Difference AS Difference, @Count_ AS Count_, @Title AS Title");

		const [data11] = await db.query("CALL Main_Statistics_3D(?, ?, ?, ?, ?, ?, @Total, @Difference,  @Count_, @Title)",
			[Client_id, Consignee_id, Start_Date, End_Date, Compare_Start_DATE, Compare_END_DATE])

		// Fetch the values of the output parameters
		const [Ratios] = await db.execute("SELECT @Total AS Total, @Difference AS Difference, @Count_ AS Count_, @Title AS Title");

		res.status(200).json({
			success: true,
			data: {
				Claim: Claim[0],
				Freight: Freight[0],
				GW: GW[0],
				Income: Income[0],
				Manhour: Manhour[0],
				NW: NW[0],
				Payables: Payables[0],
				Profit: Profit[0],
				Receivable: Receivable[0],
				Expenses: Expenses[0],
				AR_Ratios: AR_Ratios[0],
				Ratios: Ratios[0]
			}
		});

	} catch (error) {
		res.status(500).json({
			success: false,
			message: "Internal server error",
			error: error.message
		});
	}
};

module.exports = {
	addClient,
	getAllClients,
	updateClientData,
	getClientAsOptions,
	clientShipTo,
	updateClientShipTo,
	getShipTo,
	updateClientStatus,
	updateShipToStatus,
	getClientStatistics,
	getClientStatement,
	insertClientPayment,
	MainStatisticsAll
}
