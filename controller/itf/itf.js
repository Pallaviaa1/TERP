const { db: db2 } = require("../../db/db2")
const addItfEan = async (req, res) => {
	const { data, itf_id } = req.body
	try {
		for (const values of data) {
			const [result] = await db2.query(
				"SELECT ean.ean_unit FROM ean WHERE ean_id = ? LIMIT 1",
				[values.ean_id],
			)
			const ean_unit = result[0].ean_unit
			await db2.execute(
				"INSERT INTO itf_ean (itf_id, ean_id, ean_per_itf, unit_id) VALUES (?, ?, ?, ?)",
				[itf_id, values.ean_id, values.ean_per_itf, ean_unit],
			)
		}
		await db2.execute("CALL New_Update_ITF_Status(?s)", [itf_id])
		return res.status(200).json({ status: true, message: "Success" })
	} catch (e) {
		return res.status(500).json({ error: e, message: "Internal Server Error" })
	}
}
const addItfPb = async (req, res) => {
	const { data, itf_id } = req.body
	try {
		for (const values of data) {
			const { type_id, item_id, qty_per_itf } = values
			await db2.execute(
				"INSERT INTO itf_pb (itf_id, type_id, item_id, qty_per_itf) VALUES (?, ?, ?, ?)",
				[itf_id, type_id, item_id, qty_per_itf],
			)
		}
		return res.status(200).json({ status: true, message: "Success" })
	} catch (e) {
		return res.status(500).json({ error: e, message: "Internal Server Error" })
	}
}
const getItfEan = async (req, res) => {
	const { itf_id } = req.body
	try {
		const [result] = await db2.query(
			"SELECT * FROM itf_ean WHERE itf_ean.itf_id = ?",
			[itf_id],
		)
		return res.status(200).json({ status: true, data: result })
	} catch (e) {
		return res.status(500).json({ error: e, message: "Internal Server Error" })
	}
}
const getItfPb = async (req, res) => {
	const { itf_id } = req.body
	try {
		const [result] = db2.query("SELECT * FROM itf_pb WHERE itf_pb.itf_id = ?", [
			itf_id,
		])
		return res.status(200).json({ status: true, data: result })
	} catch (e) {
		return res.status(500).json({ error: e })
	}
}

const deleteItfEan = async (req, res) => {
	const { itf_ean_id } = req.body
	try {
		await db2.query("DELETE FROM itf_ean WHERE itf_ean_id = ?", [itf_ean_id])
		return res.status(200).json({ success: true, message: "Success" })
	} catch (e) {
		return res
			.status(500)
			.json({ success: false, message: "Internal Server Error", error: e })
	}
}
const deleteItfPb = async (req, res) => {
	const { itf_details_id } = req.body
	try {
		await db2.query("DELETE FROM itf_details WHERE itf_details_id = ?", [
			itf_details_id,
		])
		return res.status(200).json({ success: true, message: "Success" })
	} catch (e) {
		return res
			.status(500)
			.json({ success: false, message: "Internal Server Error", error: e })
	}
}
const updateItfEan = async (req, res) => {
	const { data, itf_id } = req.body
	try {
		await db2.query("CALL New_Update_ITF_Status(?)", [itf_id])
		return res.status(200).json({ status: true, message: "Success" })
	} catch (e) {
		return res
			.status(500)
			.json({ status: false, message: "Internal Server Error" })
	}
}
const updateItfPb = async (req, res) => {
	const { data, itf_id } = req.body
	try {
		for (const values of data) {
			const { itf_details_id, item_id, qty_per_itf } = values
			const sql = await db2.query(
				"UPDATE itf_pb SET item_id = ?, qty_per_itf = ? WHERE itf_details_id = ?",
				[item_id, qty_per_itf, itf_details_id],
			)
		}
		return res.status(200).json({ status: true, message: "Success" })
	} catch (e) {
		return res.status(500).json({ status: true, message: "Success", error: e })
	}
}

const getItfDetails = async (req, res) => {
	try {
		const [result] = await db2.query(
			"SELECT * FROM itf_details WHERE itf_id = ?",
			[req.body.itf_id],
		)
		return res.status(200).json({ success: true, data: result })
	} catch (e) {
		return res
			.status(500)
			.json({ success: false, message: "Internal Server Error", error: e })
	}
}

const addItfDetails = async (req, res) => {
	const { itf_id, data, user_id } = req.body
	try {
		for (const d of data) {
			await db2.query(
				"INSERT INTO itf_details (itf_id, detail_type, item_id, qty_per_itf, user_id) VALUES (?, ?, ?, ?, ?)",
				[itf_id, d.detail_type, d.item_id, d.qty_per_itf, user_id],
			)
		}
		res.status(200).json({
			message: "ITF Details Added Successfully",
		})
	} catch (e) {
		return res.status(400).json({
			message: "Error Occured",
			error: e,
		})
	}
}

const updateItfDetails = async (req, res) => {
	const { itf_id, data } = req.body
	try {
		for (const d of data) {
			await db2.query(
				"UPDATE itf_details SET detail_type = ?, item_id = ?, qty_per_itf = ? WHERE itf_details_id = ?",
				[d.detail_type, d.item_id, d.qty_per_itf, d.itf_details_id],
			)
		}
		res.status(200).json({
			message: "ITF Details Updated Successfully",
		})
	} catch (e) {
		return res.status(500).json({
			message: "Error Occurred",
			error: e,
		})
	}
}
module.exports = {
	addItfEan,
	addItfPb,
	getItfEan,
	getItfPb,
	deleteItfEan,
	deleteItfPb,
	updateItfEan,
	updateItfPb,
	getItfDetails,
	addItfDetails,
	updateItfDetails,
}
