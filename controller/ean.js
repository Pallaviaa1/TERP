const { error } = require("winston");
const { db } = require("../db/db2")

const getAdjustEanStock = async (req, res) => {
	try {
		const [data] = await db.query(`
            SELECT 
                adjust_ean_stock.date_, 
                dropdown_unit_count.unit_name_en AS unit_name, 
                adjust_ean_stock.pod_code, 
                adjust_ean_stock.packing_ean_id, 
                adjust_ean_stock.ean_id, 
                adjust_ean_stock.name, 
                adjust_ean_stock.brand, 
                adjust_ean_stock.\`Average Weight(g)\` AS average_weight, 
                adjust_ean_stock.qty_available, 
                adjust_ean_stock.avg_cost, 
                adjust_ean_stock.unit, 
                adjust_ean_stock.produce_id,
				packing_ean.packing_common_id, 
                packing_ean.Produce_id as packing_ean_produce_id, 
                packing_ean.ean_qty 
            FROM 
                adjust_ean_stock 
            LEFT JOIN 
                packing_ean 
            ON 
                packing_ean.packing_ean_id = adjust_ean_stock.packing_ean_id 
            LEFT JOIN 
                dropdown_unit_count 
            ON 
                dropdown_unit_count.unit_id = packing_ean.ean_unit
        `);

		// Debugging log

		res.status(200).json({
			message: "Adjust Ean Stock",
			data: data,
		});
	} catch (e) {
		// Debugging log
		res.status(400).json({
			message: "Error Occurred",
			error: e.message,
		});
	}
};


const getAdjustEanStockById = async (req, res) => {
	try {
		const [data] = await db.query(
			`SELECT
			ean.ean_id,
			ean.ean_name_en
			FROM packing_ean,ean_details,ean
			WHERE ean_details.ean_id=ean.ean_id
			AND ean_details.detail_type=3
			AND ean_details.item_id= (case when packing_ean.Produce_id=71 then (71 and 73) else packing_ean.Produce_id end)
			AND packing_ean.packing_ean_id = ?`,
			[req.query.id],
		)
		res.status(200).json({
			message: "Adjust Ean Stock",
			data: data,
		})
	} catch (e) {
		res.status(400).json({
			message: "Error Occured",
			error: e,
		})
	}
}

const doRepackEan = async (req, res) => {
	const {
		packing_ean_id,
		name,
		oldqty,
		start_time,
		end_time,
		number_of_staff,
		ean_id,
		ean_qty,
		ean_unit,
		ean_brand,
		assign_order,
		user_id
	} = req.body
	try {

		const [data] = await db.execute("CALL ean_repack(?,?,?,?,?,?,?,?,?,?,@Packing_common_id)", [
			packing_ean_id,
			oldqty,
			ean_id,
			ean_qty,
			ean_unit,
			ean_brand,
			number_of_staff,
			start_time,
			end_time,
			user_id
		]);

		// Fetch the packing_common_id value
		const [[{ packing_common_id }]] = await db.query("SELECT @Packing_common_id AS packing_common_id");

		res.status(200).json({
			message: "Adjust Ean Stock",
			data: data,
			packing_common_id: packing_common_id
		});

	} catch (e) {
		res.status(400).json({
			message: "Error Occured",
			error: e,
		})
	}
}

const deleteAdjustEAN = async (req, res) => {
	try {
		const { packing_ean_id, Deleted_Quantity, user_id } = req.body;
		await db.execute(`CALL Adjust_EAN_Stock(${packing_ean_id}, ${Deleted_Quantity}, ${user_id})`);

		res.status(200).send({
			success: true,
			message: "Successfully"
		});
	} catch (error) {
		res.status(500).send({
			success: false,
			message: error.message
		});
	}
};

const AssignOrderDropDownList = async (req, res) => {
	try {

		const { produce_id } = req.body;
		const [data] = await db.execute(`CALL DROPDOWN_ALLOCATED_PACKING(${produce_id})`)

		res.status(200).send({
			success: true,
			message: "Get Successfully",
			data: data
		})

	} catch (error) {
		res.status(500).send({
			success: false,
			message: error.message
		})
	}
}


// DROPDOWNAJUSTEAN
const dropDownAdjustEan = async (req, res) => {
	try {

		const { produce_id } = req.body;
		const [data] = await db.execute(`CALL DROPDOWN_ADJUST_EAN(${produce_id})`)

		var new_data = data[0];

		// Modify the array
		var modifiedArray = new_data.map(item => {
			// Create a new object with modified key
			return {
				ean_id: item.ean_id,
				'New_ean_name_en': item['New_ean_name_en(ean_details.ean_id)']
			};
		});

		res.status(200).send({
			success: true,
			message: "Get Successfully",
			data: modifiedArray
		})

	} catch (error) {
		res.status(500).send({
			success: false,
			message: error.message
		})
	}
};

const getAdjustEanView = async (req, res) => {
	try {
		const { packing_ean_id, packing_common_id } = req.body;
		const [data] = await db.query(`SELECT * FROM packing_common WHERE packing_common_id = "${packing_common_id}"`)
		var details = data[0];

		const [table_data] = await db.query(`SELECT * FROM packing_ean_view WHERE packing_common_id = "${packing_common_id}"`)
		var tableData = table_data;

		res.status(200).json({
			message: "Adjust Ean Stock",
			details: details,
			tableData: tableData
		})
	} catch (e) {
		res.status(400).json({
			message: "Error Occured",
			error: e,
		})
	}
}

const chartOfAccounts = async (req, res) => {
	try {
		const [data] = await db.query(`SELECT * FROM accounting_chart`)

		res.status(200).json({
			message: "All Details",
			details: data
		})
	} catch (e) {
		res.status(400).json({
			message: "Error Occured",
			error: e,
		})
	}
}

const createChartOfAccount = async (req, res) => {
	try {
		const { account_lvl1, account_lvl2, account_lvl3, account_lvl4, type_name_en, type_name_th, account_number } = req.body;

		// Insert into Chart_of_Accounts table
		const [result] = await db.query(`
            INSERT INTO accounting_chart(account_lvl1, account_lvl2, account_lvl3, account_lvl4, type_name_en, type_name_th, account_number) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
			[account_lvl1, account_lvl2, account_lvl3, account_lvl4, type_name_en, type_name_th, account_number]
		);

		res.status(201).json({
			message: "New account created successfully",
			account_id: result.insertId // Returns the ID of the newly inserted row
		});
	} catch (e) {
		res.status(400).json({
			message: "Error occurred while creating account",
			error: e.message
		});
	}
};

const updateChartOfAccount = async (req, res) => {
	try {
		const { accounting_id, account_lvl1, account_lvl2, account_lvl3, account_lvl4, type_name_en, type_name_th, account_number } = req.body;

		// Update the specific Chart_of_Accounts entry
		const [result] = await db.query(`
            UPDATE accounting_chart 
            SET account_lvl1 = ?, account_lvl2 = ?, account_lvl3 = ?, account_lvl4 = ?, type_name_en = ?, type_name_th = ?, account_number=?
            WHERE accounting_id = ?`,
			[account_lvl1, account_lvl2, account_lvl3, account_lvl4, type_name_en, type_name_th, account_number, accounting_id]
		);

		if (result.affectedRows === 0) {
			return res.status(400).json({
				message: "Account not found or no changes made"
			});
		}

		res.status(200).json({
			message: "Account updated successfully"
		});
	} catch (e) {
		res.status(400).json({
			message: "Error occurred while updating account",
			error: e.message
		});
	}
};

const deleteChartOfAccount = async (req, res) => {
	try {
		const { accounting_id } = req.body;

		// Update the specific Chart_of_Accounts entry
		const [result] = await db.query(`
            Delete from accounting_chart WHERE accounting_id = ?`,
			[accounting_id]
		);

		if (result.affectedRows === 0) {
			return res.status(400).json({
				message: "Account not found"
			});
		}

		res.status(200).json({
			message: "Account deleted successfully"
		});
	} catch (e) {
		res.status(400).json({
			message: "Error occurred while updating account",
			error: e.message
		});
	}
};

const LedgerList = async (req, res) => {
	try {
		const [data] = await db.query(`SELECT Ledger.*, s.Bank_nick_name  FROM Ledger
			LEFT JOIN setup_bank as s ON s.bank_id=Ledger.Bank
			ORDER BY Ledger.ID DESC`)

		res.status(200).json({
			message: "All Details",
			details: data
		})
	} catch (e) {
		res.status(400).json({
			message: "Error Occured",
			error: e,
		})
	}
}

const AccountWalletStatment = async (req, res) => {
	try {
		const { Wallet_ID, Start_Date, End_Date } = req.body;
		// Execute stored procedure for wallet statement
		const [CompanyAddress] = await db.execute(
			"SELECT * FROM `Company_Address` WHERE `ID` = ?",
			[3]
		);
		const [bankAddress] = await db.execute(`select * from Bank_Address where bank_id='${Wallet_ID}'`)

		const [data] = await db.execute(
			`CALL Wallet_Statement(?,?,?,@Starting_Balance, @Statement_balance, @Statement_Credits, @Statement_Debits)`,
			[Wallet_ID, Start_Date, End_Date]
		);

		// Retrieve the output variables from the procedure
		const [details] = await db.execute(
			`SELECT @Starting_Balance AS Starting_Balance, @Statement_balance AS Statement_Balance, @Statement_Credits AS Statement_Credits, @Statement_Debits AS Statement_Debits`
		);

		// Extract the data from the result
		var new_data = data[0];

		// Respond with the data and statement details
		res.status(200).send({
			success: true,
			message: "Data retrieved successfully",
			data: new_data,
			statement_details: details[0],
			bankAddress: bankAddress[0],
			CompanyAddress: CompanyAddress[0] // Include statement details in response
		});
	} catch (error) {
		res.status(500).send({
			success: false,
			message: error.message,
		});
	}
};

const AccountTransfer = async (req, res) => {
	try {
		const { From, To, Amount, Date, REF } = req.body;

		const [data] = await db.execute(
			`CALL Wallet_Transfer(?,?,?,?,?)`, [From, To, Amount, Date, REF]);

		// Respond with the data and statement details
		res.status(200).send({
			success: true,
			message: "Data retrieved successfully",
			data: data // Include statement details in response
		});
	} catch (error) {
		res.status(500).send({
			success: false,
			message: error.message,
		});
	}
};

const DeleteInvoicePayment = async (req, res) => {
	try {
		const { Invoice_payment_Id } = req.body;
		const [data] = await db.execute(
			`CALL Delete_Invoice_Payment(?)`, [Invoice_payment_Id]);

		res.status(200).send({
			success: true,
			message: "Payment deleted successfully",
			data: data // Include statement details in response
		});
	} catch (e) {
		res.status(400).json({
			message: "Error Occured",
			error: e,
		})
	}
}

const DeleteExpensePayment = async (req, res) => {
	try {
		const { Expense_Payment_ID } = req.body;
		const [data] = await db.execute(
			`CALL Delete_Epense_Payment(?)`, [Expense_Payment_ID]);

		res.status(200).send({
			success: true,
			message: "Payment deleted successfully",
			data: data // Include statement details in response
		});
	} catch (e) {
		res.status(400).json({
			message: "Error Occured",
			error: e,
		})
	}
}

const LedgerListByUser = async (req, res) => {
	try {
		const { Client_id, Consignee_ID } = req.body;

		const [data] = await db.query(`
			SELECT Ledger.*, s.Bank_nick_name, ip.Client_id, ip.Consignee_ID, ip.FX_Payment
			FROM Ledger
			INNER JOIN setup_bank AS s ON s.bank_id = Ledger.Bank
			INNER JOIN Invoice_Payment AS ip ON ip.C_payment_id  = Ledger.Invoice_payment_Id
			WHERE ip.Client_id  = ? OR ip.Consignee_ID = ?
			ORDER BY Ledger.ID DESC
		`, [Client_id, Consignee_ID]);

		res.status(200).json({
			success: true,
			message: "Ledger List by User",
			details: data
		});
	} catch (e) {
		// Log the error for debugging
		res.status(400).json({
			message: "Error Occurred",
			error: e.message,
		});
	}
}

const GetStatisticsDateSelection = async (req, res) => {
	try {
		const [data] = await db.query(`SELECT * FROM Statistics_DATE_selection`,);

		res.status(200).json({
			success: true,
			message: "All Statistics Data selection",
			details: data
		});
	} catch (e) {
		// Log the error for debugging
		res.status(400).json({
			message: "Error Occurred",
			error: e.message,
		});
	}
}

const StatisticsDATEselection = async (req, res) => {
	try {
		const { Period_id } = req.body;
		const [data] = await db.execute(
			`CALL Statistics_DATE_selection(?,@Start_DATE, @END_DATE)`, [Period_id]);
		const [details] = await db.execute(
			`SELECT @Start_DATE AS Start_DATE, @END_DATE AS END_DATE`
		);
		res.status(200).send({
			success: true,
			message: "Statistics Data selection",
			data: details // Include statement details in response
		});
	} catch (e) {
		// Log the error for debugging
		res.status(400).json({
			message: "Error Occurred",
			error: e.message,
		});
	}
}

const StatisticsDATEComparision = async (req, res) => {
	try {
		const { Period_id, Selection_id, Start_DATE, END_DATE } = req.body;

		const [data] = await db.execute(
			`CALL Statistics_DATE_Comparision(?,?,?,?, @Compare_Start_DATE,  @Compare_END_DATE)`, [Period_id, Selection_id, Start_DATE, END_DATE]);
		const [details] = await db.execute(
			`SELECT @Compare_Start_DATE AS Compare_Start_DATE, @Compare_END_DATE AS Compare_END_DATE`
		);
		res.status(200).send({
			success: true,
			message: "Statistics Data selection",
			data: details // Include statement details in response
		});
	} catch (e) {
		// Log the error for debugging
		res.status(400).json({
			message: "Error Occurred",
			error: e.message,
		});
	}
}

const StatisticsDATESelection2 = async (req, res) => {
	try {
		const [data] = await db.query(`SELECT * FROM Statistics_DATE_selection_2`,);

		res.status(200).json({
			success: true,
			message: "All Statistics Data selection",
			details: data
		});
	} catch (e) {
		// Log the error for debugging
		res.status(400).json({
			message: "Error Occurred",
			error: e.message,
		});
	}
}

const statisticsDateSelection1 = async (req, res) => {
	try {
		const [data] = await db.query(`SELECT * FROM Statistics_DATE_selection_1`,);

		res.status(200).json({
			success: true,
			message: "All Statistics Data selection",
			details: data
		});
	} catch (e) {
		// Log the error for debugging
		res.status(400).json({
			message: "Error Occurred",
			error: e.message,
		});
	}
}
module.exports = {
	getAdjustEanStock,
	getAdjustEanStockById,
	doRepackEan,
	deleteAdjustEAN,
	AssignOrderDropDownList,
	dropDownAdjustEan,
	getAdjustEanView,
	chartOfAccounts,
	createChartOfAccount,
	updateChartOfAccount,
	deleteChartOfAccount,
	LedgerList,
	AccountWalletStatment,
	AccountTransfer,
	DeleteInvoicePayment,
	DeleteExpensePayment,
	LedgerListByUser,
	GetStatisticsDateSelection,
	StatisticsDATEComparision,
	StatisticsDATESelection2,
	statisticsDateSelection1,
	StatisticsDATEselection
}
