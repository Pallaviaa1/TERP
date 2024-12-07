const { db } = require("../db/db2")

const getToPack = async (req, res) => {
	try {
		const [result] = await db.query("SELECT * FROM to_pack")
		res.status(200).json({
			message: "All Wage",
			data: result,
		})
	} catch (err) {
		res.status(400).json({
			message: "Error Occured",
			error: err,
		})
	}
}
//2
const addPackingCommon = async (req, res) => {
	try {
		const {
			pod_code,
			sorting_id,
			qty_used,
			number_of_staff,
			start_time,
			end_time,
			user_id
		} = req.body
		const sql =
			"INSERT INTO packing_common (pod_code, sorting_id, user_id, qty_used, number_of_staff, start_time, end_time, fifo_status) VALUES (?, ?, ?, ?, ?, ?, ?, 1)"
		const [result] = await db.query(sql, [
			pod_code,
			sorting_id,
			user_id,
			qty_used,
			number_of_staff,
			start_time,
			end_time,
		])
		res.status(200).json({
			message: "Packing Common Added Successfully",
			packing_common_id: result.insertId,
		})
	} catch (err) {
		res.status(400).json({
			message: "Error Occured",
			error: err,
		})
	}
}

const addPackingEan = async (req, res) => {
	try {
		const { packing_common_id, sorting_id, pod_code, eandata } = req.body

		const [result1] = await db.query(
			"SELECT pod_item from purchase_order_details WHERE pod_code = ?",
			[pod_code],
		)
		const Produce_id = result1[0].pod_item
		for (const d of eandata) {
			await db.execute(
				/* sql */ `INSERT INTO packing_ean 
				(packing_common_id, sorting_id, pod_code, Produce_id, ean_id, ean_qty, ean_unit, Assigned_order, Brand)
				 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
				[
					packing_common_id,
					sorting_id,
					pod_code,
					Produce_id,
					d.ean_id,
					d.ean_qty,
					d.ean_unit,
					d.Assigned_order || null,
					d.Brand || null,
				],
			)
		}

		const [result2] = await db.query("CALL New_EAN_Packing(?)", [
			packing_common_id,
		])

		res.status(200).json({
			message: "Packing EAN Added Successfully",
			data: result2,
		})
	} catch (err) {
		res.status(400).json({
			message: "Error Occured",
			error: err,
		})
	}
}

const getBrand = async (req, res) => {
	try {
		const [result] = await db.query("SELECT * FROM setup_brand")
		res.status(200).json({
			message: "All Wage",
			data: result,
		})
	} catch (err) {
		res.status(400).json({
			message: "Error Occured",
			error: err,
		})
	}
}

const getPackingCommon = async(req, res) => {
	try {
		const { pod_code, sorting_id } = req.body
         
		const [result] = await db.query(`SELECT * FROM packing_common WHERE  pod_code = ?`,
			[sorting_id, pod_code]
		)

		res.status(200).json({
			message: "success",
			data: result[0],
		})
	} catch (e) {
		res.status(500).json({
			message: "Error Occured",
			error: e,
		})
	}
}

module.exports = {
	getToPack,
	addPackingCommon,
	addPackingEan,
	getBrand,
	getPackingCommon
}
