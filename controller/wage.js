const { db: db2 } = require("../db/db2")

const getAllWage = async (req, res) => {
	try {
		const [result] = await db2.query("SELECT * FROM setup_wages")
		res.status(200).json({
			message: "All Wage",
			data: result,
		})
	} catch (e) {
		res.status(400).json({
			message: "Error Occured",
			error: e,
		})
	}
}

const addWage = async (req, res) => {
	const {
		from_time,
		to_time,
		shift_name_en,
		Monday,
		Tuesday,
		Wednesday,
		Thursday,
		Friday,
		Saturday,
		Sunday,
		wage,
		user_id
	} = req.body
	try {
		const sql =
			"INSERT INTO setup_wages (from_time,to_time,shift_name_en,Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday,wage, user_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)"
		const values = [
			from_time,
			to_time,
			shift_name_en,
			Monday,
			Tuesday,
			Wednesday,
			Thursday,
			Friday,
			Saturday,
			Sunday,
			wage,
			user_id
		]
		const [data] = await db2.execute(sql, values)
		res.status(200).json({
			message: "Wage Added Successfully",
			data: data,
		})
	} catch (e) {
		res.status(400).json({
			message: "Error Occured",
			error: e,
		})
	}
}

const updateWage = async (req, res) => {
	const {
		from_time,
		to_time,
		shift_name_en,
		Monday,
		Tuesday,
		Wednesday,
		Thursday,
		Friday,
		Saturday,
		Sunday,
		wage,
		wages_id,
	} = req.body
	try {
		const sql =
			"UPDATE setup_wages SET from_time=?, to_time=?, shift_name_en=?, Monday=?, Tuesday=?, Wednesday=?, Thursday=?, Friday=?, Saturday=?, Sunday=?, wage=? WHERE wages_id=?"
		const values = [
			from_time,
			to_time,
			shift_name_en,
			Monday,
			Tuesday,
			Wednesday,
			Thursday,
			Friday,
			Saturday,
			Sunday,
			wage,
			wages_id,
		]
		const [result] = await db2.execute(sql, values)
		res.status(200).json({
			message: "Wage Updated Successfully",
			data: result,
		})
	} catch (e) {
		res.status(400).json({
			message: "Error",
			error: e,
		})
	}
}

module.exports = {
	getAllWage,
	addWage,
	updateWage,
}
