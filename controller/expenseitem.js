const { db } = require("../db/db2")

const getAllExpenseItems = async (req, res) => {
	try {
		const [data] = await db.query(
			"SELECT Expense_Items.*, dropdown_type.type_name_en, dropdown_type.type_name_th, Chart_of_Accounts.Name as account_name  FROM Expense_Items JOIN Chart_of_Accounts ON Chart_of_Accounts.accounting_id = Expense_Items.chart_of_accounts JOIN dropdown_type ON dropdown_type.type_id = Expense_Items.Type",
		)
		res.status(200).json({
			message: "All Expense Items",
			data: data,
		})
	} catch (e) {
		res.status(500).json({
			message: "Error Occured",
			error: e,
		})
	}
}

const createExpenseItems = async (req, res) => {
	const { Type, name_en, name_th, chart_of_accounts } = req.body
	try {
		const [data] = await db.execute(
			"INSERT INTO Expense_Items (Type, name_en, name_th, chart_of_accounts) VALUES (?, ?, ?, ?)",
			[Type, name_en, name_th, chart_of_accounts],
		)
		res.status(200).json({
			message: "All Expense Items",
			data: data,
		})
	} catch (e) {
		res.status(500).json({
			message: "Error Occured",
			error: e,
		})
	}
}

const updateExpenseItems = async (req, res) => {
	const { Type, name_en, name_th, chart_of_accounts, ID } = req.body
	try {
		const [data] = await db.execute(
			"UPDATE Expense_Items SET Type = ?, name_en = ?, name_th = ?, chart_of_accounts = ? WHERE ID = ?",
			[Type, name_en, name_th, chart_of_accounts, ID],
		)
		res.status(200).json({
			message: "All Expense Items",
			data: data,
		})
	} catch (e) {
		res.status(500).json({
			message: "Error Occured",
			error: e,
		})
	}
}

module.exports = {
	getAllExpenseItems,
	createExpenseItems,
	updateExpenseItems,
}
