const { db: db2 } = require("../../db/db2")

const createUnit = async (req, res) => {
	const unitNameEn = req.body.unit_name_en
	const unitNameTh = req.body.unit_name_th
	try {
		await db2.execute(
			"INSERT INTO dropdown_unit_count(unit_name_en, unit_name_th, created, updated) VALUES(?, ?, now(), now())",
			[unitNameEn, unitNameTh],
		)
		res.status(200).send({
			success: true,
			message: "Unit Created Successfully",
		})
	} catch (error) {
		res.status(500).send({
			success: false,
			message: error,
		})
	}
}

const updateUnit = async (req, res) => {
	const unitId = req.body.unit_id
	const unitNameEn = req.body.unit_name_en
	const unitNameTh = req.body.unit_name_th
	try {
		await db2.execute(
			"UPDATE dropdown_unit_count SET unit_name_en = ?, unit_name_th = ?, updated = now() WHERE unit_id = ?",
			[unitNameEn, unitNameTh, unitId],
		)
		res.status(200).send({
			success: true,
			message: "Unit Data Updated Successfully",
		})
	} catch (error) {
		res.status(500).send({
			success: false,
			message: error,
		})
	}
}

const updateUnitStatus = async (req, res) => {
	const unitId = req.body.unit_id
	try {
		const [data] = await db2.execute(
			"SELECT status FROM dropdown_unit_count WHERE unit_id = ?",
			[unitId],
		)
		const status = `${data[0].status}`.toLowerCase() == "on" ? "off" : "on"
		await db2.execute(
			"UPDATE dropdown_unit_count SET status = ?, updated = now() WHERE unit_id = ?",
			[status, unitId],
		)
		res.status(200).send({
			success: true,
			message: "Unit Status Updated Successfully",
		})
	} catch (error) {
		res.status(500).send({
			success: false,
			unitStatus: status,
			message: error,
		})
	}
}

const getAllUnit = async (req, res) => {
	try {
		const [data] = await db2.query("SELECT * FROM dropdown_unit_count")
		res.status(200).send({
			success: true,
			message: "Getting Unit Data Successfully",
			data: data,
		})
	} catch (error) {
		res.status(500).send({
			success: false,
			message: error,
		})
	}
}

module.exports = {
	createUnit,
	updateUnit,
	getAllUnit,
	updateUnitStatus,
}
