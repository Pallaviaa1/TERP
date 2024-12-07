const { db: db2 } = require("../db/db2")

const getConsignee = async (req, res) => {
	try {
		const [data] = await db2.query("SELECT * FROM `consignee`")
		res.status(200).json({
			message: "All Consignee",
			data: data,
		})
	} catch (e) {
		res.status(400).json({
			message: "Error Occured",
			error: e,
		})
	}
}

const getConsigneeByID = async (req, res) => {
	try {
		const { consignee_id } = req.query;
		const [data] = await db2.query(`SELECT * FROM consignee where consignee_id='${consignee_id}'`)
		res.status(200).json({
			message: "All Consignee",
			data: data[0],
		})
	} catch (e) {
		res.status(400).json({
			message: "Error Occured",
			error: e,
		})
	}
}

const updateConsignee = async (req, res) => {
	const {
		consignee_id,
		CODE,
		brand,
		client_id,
		consignee_name,
		consignee_tax_number,
		consignee_email,
		consignee_phone,
		consignee_address,
		Default_location,
		port_of_orign,
		destination_port,
		liner_Drop,
		client_bank_account,
		client_bank_name,
		client_bank_number
	} = req.body;

	try {
		await db2.execute(
            /* sql */ `UPDATE consignee 
            SET CODE = ?,
            brand = ?,
            client_id = ?,
            consignee_name = ?,
            consignee_tax_number = ?,
            consignee_email = ?,
            consignee_phone = ?,
            consignee_address = ?,
            Default_location = ?,
            port_of_orign = ?,
            destination_port = ?,
            liner_Drop = ?,
            bank_name = ?, 
            account_name = ?, 
            account_number = ?
            WHERE consignee_id = ?`, // Added comma after account_number
			[
				CODE,
				brand,
				client_id,
				consignee_name,
				consignee_tax_number,
				consignee_email,
				consignee_phone,
				consignee_address,
				Default_location,
				port_of_orign,
				destination_port,
				liner_Drop,
				client_bank_account,
				client_bank_name,
				client_bank_number,
				consignee_id
			],
		);
		res.json({
			message: "Consignee Updated",
		});
	} catch (e) {
		res.status(400).json({
			message: "Error Occurred",
			error: e.message,
		});
	}
};


const createConsignee = async (req, res) => {
	const {
		CODE,
		brand,
		client_id,
		consignee_name,
		consignee_tax_number,
		consignee_email,
		consignee_phone,
		consignee_address,
		Default_location,
		port_of_orign,
		destination_port,
		liner_Drop,
		client_bank_account,
		client_bank_name,
		client_bank_number,
		user_id
	} = req.body
	try {
		await db2.query(
			/*sql*/ `INSERT INTO consignee (CODE, brand, client_id, consignee_name,
			 consignee_tax_number, consignee_email, consignee_phone, consignee_address,
			  Default_location, port_of_orign, destination_port,
				 liner_Drop, bank_name, account_name, account_number,user_id)
			 VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
			[
				CODE,
				brand,
				client_id,
				consignee_name,
				consignee_tax_number,
				consignee_email,
				consignee_phone,
				consignee_address,
				Default_location,
				port_of_orign,
				destination_port,
				liner_Drop,
				client_bank_account,
				client_bank_name,
				client_bank_number,
				user_id
			],
		)
		res.json({
			message: "Consignee Created",
		})
	} catch (e) {
		res.status(400).json({
			message: "Error Occured",
			error: e,
		})
	}
}

const getConsigneeCustomization = async (req, res) => {
	try {
		const { client_id, consignee_id } = req.body;
		const [data] = await db2.query(`SELECT Consignee_Customize.*, itf.itf_name_en FROM Consignee_Customize INNER JOIN itf on itf.itf_id=Consignee_Customize.ITF WHERE Consignee_Customize.ConsigneeI='${consignee_id}' OR Consignee_Customize.Client_ID='${client_id}'`)
		res.status(200).json({
			message: "All Customize Consignee",
			data: data,
		})
	} catch (e) {
		res.status(400).json({
			message: "Error Occured",
			error: e,
		})
	}
}

const createConsigneeCustomize = async (req, res) => {
	const { Client_ID, Consignee_id, ITF, Custom_Name, Dummy_Price } = req.body;

	try {
		// Check if the ITF already exists for the given Consignee
		const [existingRecord] = await db2.query(
			`SELECT * FROM Consignee_Customize WHERE ConsigneeI = ? AND ITF = ?`,
			[Consignee_id, ITF]
		);

		if (existingRecord.length > 0) {
			return res.status(200).json({
				success: false,
				message: "This Consignee already has the specified ITF"
			});
		}

		// Insert the new record if it doesn't exist
		await db2.query(
			`INSERT INTO Consignee_Customize(Client_ID, ConsigneeI, ITF, Custom_Name, Dummy_Price)
			 VALUES (?,?,?,?,?)`,
			[Client_ID, Consignee_id, ITF, Custom_Name, Dummy_Price]
		);

		res.status(200).json({
			success: true,
			message: "Consignee Customization Created",
		});
	} catch (e) {
		res.status(400).json({
			message: "Error Occurred",
			error: e,
		});
	}
};


const updateConsigneeCustomize = async (req, res) => {
	const {
		Consignee_Customize_id, ITF, Custom_Name, Dummy_Price
	} = req.body
	try {
		await db2.query(
			/*sql*/ `UPDATE Consignee_Customize SET ITF='${ITF}', Custom_Name='${Custom_Name}', Dummy_Price='${Dummy_Price}' WHERE Id='${Consignee_Customize_id}'`
		);
		res.json({
			message: "Consignee Customization Updated",
		})
	} catch (e) {
		res.status(400).json({
			message: "Error Occured",
			error: e,
		})
	}
}

const DeleteConsigneeCustomization = async (req, res) => {
	try {
		const { Customize_id } = req.body;
		const [data] = await db2.query(`DELETE FROM Consignee_Customize WHERE Consignee_Customize.Id='${Customize_id}'`)
		res.status(200).json({
			message: "Delete Customize Consignee successfully",
			data: data,
		})
	} catch (e) {
		res.status(400).json({
			message: "Error Occured",
			error: e,
		})
	}
}

const DeleteContactDetails = async (req, res) => {
	try {
		const { contact_id } = req.body;
		const [data] = await db2.query(`DELETE FROM contact_list WHERE contact_id='${contact_id}'`)
		res.status(200).json({
			message: "Delete Contact Details successfully",
			data: data,
		})
	} catch (e) {
		res.status(400).json({
			message: "Error Occured",
			error: e,
		})
	}
}

const addContactDetails = async (req, res) => {
	const {
		contact_type_id, client_id, consignee_id, first_name, last_name, position, Email, mobile, landline, birthday, Notes, Nick_name
	} = req.body
	try {
		await db2.query(
			/*sql*/ `INSERT INTO contact_list (contact_type_id, client_id , consignee_id, first_name, last_name, position, Email, mobile, landline, birthday, Notes, Nick_name)
			 VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
			[
				contact_type_id, client_id, consignee_id, first_name, last_name, position, Email, mobile, landline, birthday, Notes, Nick_name
			],
		)
		res.json({
			message: "Consignee Contact Created",
		})
	} catch (e) {
		res.status(400).json({
			message: "Error Occured",
			error: e,
		})
	}
}


const DropdownContactType = async (req, res) => {
	try {
		const [data] = await db2.query("SELECT * FROM `Dropdown_contact_type`")
		res.status(200).json({
			message: "All contact type",
			data: data,
		})
	} catch (e) {
		res.status(400).json({
			message: "Error Occured",
			error: e,
		})
	}
}

const getContactList = async (req, res) => {
	try {
		const { consignee_id, client_id } = req.body;
		const [data] = await db2.query(`SELECT c.*, d.type_en as type FROM contact_list as c
		INNER JOIN Dropdown_contact_type as d on d.contact_type_id=c.contact_type_id
		WHERE c.consignee_id='${consignee_id}' OR c.client_id='${client_id}'`)
		res.status(200).json({
			message: "All Contact List",
			data: data,
		})
	} catch (e) {
		res.status(400).json({
			message: "Error Occured",
			error: e,
		})
	}
}

const updateContactDetails = async (req, res) => {
	const {
		contact_id, contact_type_id, client_id, consignee_id, first_name, last_name, position, Email, mobile, landline, birthday, Notes, Nick_name
	} = req.body
	try {
		await db2.query(
			/*sql*/ `UPDATE contact_list SET contact_type_id='${contact_type_id}', client_id='${client_id}', consignee_id='${consignee_id}', first_name='${first_name}', 
			last_name='${last_name}', position='${position}', Email='${Email}', mobile='${mobile}', landline='${landline}', birthday='${birthday}', Notes='${Notes}', Nick_name='${Nick_name}' WHERE contact_id='${contact_id}'`
		);
		res.json({
			message: "Consignee Contact Updated",
		})
	} catch (e) {
		res.status(400).json({
			message: "Error Occured",
			error: e,
		})
	}
}

const getConsigneeStatistics = async (req, res) => {
	try {
		const { consignee_id } = req.body;

		// Execute the stored procedure
		const [data] = await db2.execute("CALL Consignee_statistics(?, @p1, @p2, @p3, @p4, @p5, @p6, @p7, @p8, @p9, @p10, @p11, @p12, @p13, @p14, @p15)", [consignee_id]);

		// Fetch the values of the output parameters
		const [results] = await db2.execute("SELECT @p1 AS First_Shipment, @p2 AS Last_Shipment, @p3 AS Pipe_Line, @p4 AS Total_GW, @p5 AS Total_NW, @p6 AS Total_CBM, @p7 AS Total_Box, @p8 AS Total_shipments, @p9 AS Total_invoiced_value, @p10 AS Total_Claims, @p11 AS Total_Claims_value, @p13 AS Total_payments_value, @p14 AS Average_Payment, @p15 AS Balance");

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
};


const getConsigneeStatement = async (req, res) => {
	try {
		const { client_id, consignee_id, from_date, to_date } = req.body;
		// Execute the stored procedure
		const [data] = await db2.execute(
			"CALL Consignee_statement(?, ?, ?, ?, @pre_statement_Invoices, @pre_statement_claims, @pre_statement_payments, @pre_statement_Totals, @statement_Invoices, @statement_claims, @statement_payments, @statement_Totals, @Total_Invoices, @Total_Claims, @Total_Payment, @Total)",
			[client_id, consignee_id, from_date, to_date]
		);
		const transformedData = data[0].map(record => ({
			Date: record['Date'], // Use brackets for field names with spaces
			AWB: record['AWB'],
			Transaction_Ref: record['Transaction Ref'], // Handle field names with spaces
			Invocied_Amount: record['Invoiced Amount'], // Handle field names with spaces
			Currnecy: record['Currnecy'],
			Paid_Amount: record['Paid Amount'], // Handle field names with spaces
			TT_Reference: record['TT Reference'],
			Client_Reference: record['Client Reference'] // Handle field names with spaces
		}));
		// Fetch the values of the output parameters
		const [results] = await db2.execute(
			"SELECT @pre_statement_Invoices AS pre_statement_Invoices, @pre_statement_claims AS pre_statement_claims, @pre_statement_payments AS pre_statement_payments, @pre_statement_Totals AS pre_statement_Totals, @statement_Invoices AS statement_Invoices, @statement_claims AS statement_claims, @statement_payments AS statement_payments, @statement_Totals AS statement_Totals, @Total_Invoices AS Total_Invoices, @Total_Claims AS Total_Claims, @Total_Payment AS Total_Payment, @Total AS Total"
		);

		const [clientResults] = await db2.execute(`
            SELECT 
                *
            FROM 
                clients
            WHERE 
                client_id = ?
        `, [client_id]);

		const [consigneeResults] = await db2.execute(`
            SELECT 
                *
            FROM 
                consignee
            WHERE 
                consignee_id = ?
        `, [consignee_id]);

		res.status(200).json({
			success: true,
			data: results[0],
			result: transformedData,
			clientAdress: clientResults[0],
			consigneeAddress: consigneeResults[0]
		});

	} catch (error) {
		res.status(500).json({
			success: false,
			message: "Internal server error",
			error: error.message
		});
	}
};


const getConsigneeByUser = async (req, res) => {
	try {
		const { consignee_id, client_id, role } = req.body;

		let query = "SELECT * FROM `consignee` WHERE 1=1";
		const queryParams = [];

		if (role === 'Client' && client_id) {
			query += " AND client_id = ?";
			queryParams.push(client_id);
		} else if (role === 'Consignee' && consignee_id) {
			query += " AND consignee_id = ?";
			queryParams.push(consignee_id);
		}

		const [data] = await db2.query(query, queryParams);

		res.status(200).json({
			message: "Consignee data fetched successfully",
			data: data,
		});
	} catch (e) {
		res.status(400).json({
			message: "Error occurred",
			error: e.message,
		});
	}
};


const ConsigneeStatisticsAll = async (req, res) => {
	try {
		const { Selection_id, Consignee_id, Client_id, Start_Date, End_Date, Compare_Start_DATE, Compare_END_DATE } = req.body;

		const [data] = await db2.execute("CALL Consignee_statistics_CNF(?, ?, ?, ?, ?, @Total, @Difference, @Count_)",
			[Consignee_id, Start_Date, End_Date, Compare_Start_DATE, Compare_END_DATE])

		// Fetch the values of the output parameters
		const [cnfResults] = await db2.execute("SELECT @Total AS Total, @Difference AS Difference, @Count_ AS Count");

		const [data1] = await db2.execute("CALL Consignee_statistics_Claims(?, ?, ?, ?, ?, @Total, @Difference, @Count_)",
			[ Consignee_id, Start_Date, End_Date, Compare_Start_DATE, Compare_END_DATE])

		// Fetch the values of the output parameters
		const [claimsResults] = await db2.execute("SELECT @Total AS Total, @Difference AS Difference, @Count_ AS Count");

		const [data2] = await db2.execute("CALL Consignee_statistics_Payments(?, ?, ?, ?, ?, @Total, @Difference, @Count_)",
			[Consignee_id, Start_Date, End_Date, Compare_Start_DATE, Compare_END_DATE])

		// Fetch the values of the output parameters
		const [paymentsResults] = await db2.execute("SELECT @Total AS Total, @Difference AS Difference, @Count_ AS Count");

		const [data3] = await db2.execute("CALL Consignee_statistics_Pending(?, ?, ?, ?, ?, @Total, @Difference, @Count_)",
			[Consignee_id, Start_Date, End_Date, Compare_Start_DATE, Compare_END_DATE])

		// Fetch the values of the output parameters
		const [pendingResults] = await db2.execute("SELECT @Total AS Total, @Difference AS Difference, @Count_ AS Count");

		const [data6] = await db2.query("CALL Consignee_statistics_NW(?,?,?,?,?, @Total_GW, @Total_GW_Difference)",
			[Consignee_id, Start_Date, End_Date, Compare_Start_DATE, Compare_END_DATE])

		// Fetch the values of the output parameters
		const [netWeightResult] = await db2.execute("SELECT @Total_GW AS Total_GW, @Total_GW_Difference AS Total_GW_Difference");

		const [data7] = await db2.query("CALL Consignee_statistics_GW(?,?,?,?,?, @Total_GW, @Total_GW_Difference)",
			[Consignee_id, Start_Date, End_Date, Compare_Start_DATE, Compare_END_DATE])

		// Fetch the values of the output parameters
		const [grossWeightResult] = await db2.execute("SELECT @Total_GW AS Total_GW, @Total_GW_Difference AS Total_GW_Difference");

		const [data8] = await db2.query("CALL Consignee_statistics_BOX(?,?,?,?,?, @Total_GW, @Total_GW_Difference)",
			[Consignee_id, Start_Date, End_Date, Compare_Start_DATE, Compare_END_DATE])

		// Fetch the values of the output parameters
		const [BoxResult] = await db2.execute("SELECT @Total_GW AS Total_GW, @Total_GW_Difference AS Total_GW_Difference");


		const [data9] = await db2.query("CALL Consignee_statistics_Shipments(?, @First_Shipment, @Last_Shipment, @Pipe_Line)",
			[Consignee_id])

		// Fetch the values of the output parameters
		const [ShipmentsResult] = await db2.execute("SELECT @First_Shipment AS First_Shipment, @Last_Shipment AS Last_Shipment, @Pipe_Line AS Pipe_Line");
		res.status(200).json({
			success: true,
			data: {
				CNF: cnfResults[0],
				Claims: claimsResults[0],
				Payments: paymentsResults[0],
				Pending: pendingResults[0],
				NetWeight: netWeightResult[0],
				grossWeight: grossWeightResult[0],
				Box: BoxResult[0],
				Shipments: ShipmentsResult[0],
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


const MarginandPayments = async (req, res) => {
	const { Consignee_id } = req.body
	//Consignee_Margin
	try {
		const sql1 = `SELECT Consignee_Claim_Percentage(${Consignee_id}) AS Claim_Percentage`;
		const [rows1] = await db2.query(sql1);

		const sql2 = `SELECT Consignee_Margin(${Consignee_id}) AS Consignee_Margin`;
		const [rows2] = await db2.query(sql2);

		res.status(200).json({ message: "success", Consignee_Claim_Percentage: rows1[0].Claim_Percentage, Consignee_Margin: rows2[0].Consignee_Margin })
	} catch (e) {
		res.status(500).json({ message: "Internal server error", error: e.message })
	}
}

const DropdownDelivery = async (req, res) => {
	try {
		const [data] = await db2.query("SELECT * FROM `Dropdown_delivery`")
		res.status(200).json({
			message: "All Dropdown Delivery",
			data: data,
		})
	} catch (e) {
		res.status(400).json({
			message: "Error Occured",
			error: e,
		})
	}
}

const FXCorrection = async (req, res) => {
	try {
		const [data] = await db2.query("SELECT * FROM `FX_Correction`")
		res.status(200).json({
			message: "All FX_Correction",
			data: data,
		})
	} catch (e) {
		res.status(400).json({
			message: "Error Occured",
			error: e,
		})
	}
}


const updateMarginPaymentConsignee = async (req, res) => {
	const {
		consignee_id,
		profit,
		rebate,
		commission,
		commission_value,
		Commission_Currency,
		currency,
		Incoterms,
		Payment_Terms,
		Extra_cost,
		Quotation_Margin,
		Extra_Margin
	} = req.body;

	console.log(req.body);
	try {
		await db2.execute(
            /* sql */ `UPDATE consignee 
            SET 
            profit = ?,
            rebate = ?,
            commission = ?,
            commission_value = ?,
            Commission_Currency = ?,
            currency = ?,
            Incoterms = ?,
            Payment_Terms = ?,
            Quotation_Margin = ?,
            Extra_cost = ?,
            Extra_Margin = ?
            WHERE consignee_id = ?`, // Added comma after account_number
			[
				profit,
				rebate,
				commission,
				commission_value,
				Commission_Currency,
				currency,
				Incoterms,
				Payment_Terms,
				Quotation_Margin,
				Extra_cost,
				Extra_Margin,
				consignee_id
			],
		);
		res.json({
			message: "Consignee Updated",
		});
	} catch (e) {
		res.status(400).json({
			message: "Error Occurred",
			error: e.message,
		});
	}
};


const updateConsigneeNotify = async (req, res) => {
	const {
		consignee_id,
		notify_name,
		notify_tax_number,
		notify_email,
		notify_phone,
		notify_address
	} = req.body;

	try {
		await db2.execute(
            /* sql */ `UPDATE consignee 
            SET 
            notify_name = ?,
            notify_tax_number = ?,
            notify_email = ?,
            notify_phone = ?,
            notify_address = ?
            WHERE consignee_id = ?`, // Added comma after account_number
			[
				notify_name,
				notify_tax_number,
				notify_email,
				notify_phone,
				notify_address,
				consignee_id
			],
		);
		res.json({
			message: "Consignee Notify Updated",
		});
	} catch (e) {
		res.status(400).json({
			message: "Error Occurred",
			error: e.message,
		});
	}
};

module.exports = {
	getConsignee, getConsigneeByID, updateConsignee, createConsignee, getConsigneeCustomization,
	DropdownContactType, createConsigneeCustomize, updateConsigneeCustomize, addContactDetails,
	getContactList, updateContactDetails, getConsigneeStatistics, getConsigneeStatement, getConsigneeByUser,
	DeleteConsigneeCustomization, DeleteContactDetails, MarginandPayments, DropdownDelivery, FXCorrection,
	updateMarginPaymentConsignee, updateConsigneeNotify, ConsigneeStatisticsAll
}

