const { db: db2 } = require("../../db/db2")
const { getProduceId } = require("../../function/getProduceID")

const createProduce = async (req, res) => {
	const produceNameEn = req.body.produce_name_en
	const produceNameTh = req.body.produce_name_th
	const produceScientificName = req.body.produce_scientific_name
	const produceHsCode = req.body.produce_hscode
	const produceClassificationId = req.body.produce_classification_id
	const user_id = req.body.user_id

	try {
		const [data] = await db2.execute(
			`INSERT INTO setup_produce(produce_name_en, produce_name_th, produce_scientific_name, produce_hscode, produce_classification_id, user_id) VALUES('${produceNameEn}', '${produceNameTh}', '${produceScientificName}', '${produceHsCode}', '${produceClassificationId}', '${user_id}')`,
		)
		await db2.execute(
			"UPDATE setup_produce SET Inventory_code = ? WHERE produce_id = ?",
			[getProduceId(data.insertId, produceClassificationId), data.insertId],
		)
		if (req.file) {
			// Assuming req.file contains the image file
			const imageData = req.file.filename; // Assuming the image is stored in a buffer

			// Assuming db2 is your database connection object
			await db2.execute(
				"UPDATE setup_produce SET images = ? WHERE produce_id = ?",
				[imageData, data.insertId]
			);
		}
		res.status(200).send({
			success: true,
			message: "Produce Item Created Successfully",
		})
	} catch (e) {
		res.status(500).send({
			success: false,
			message: e,
		})
		return
	}
}

const updateProduce = async (req, res) => {
	const produceId = req.body.produce_id
	const produceNameEn = req.body.produce_name_en
	const produceNameTh = req.body.produce_name_th
	const produceScientificName = req.body.produce_scientific_name
	const produceHsCode = req.body.produce_hscode
	const produceClassificationId = req.body.produce_classification_id
	try {
		await db2.execute(
			"UPDATE setup_produce SET produce_name_en = ?, produce_name_th = ?, produce_scientific_name = ?, produce_hscode = ?, produce_classification_id = ?, Inventory_code = ? WHERE produce_id = ?",
			[
				produceNameEn,
				produceNameTh,
				produceScientificName,
				produceHsCode,
				produceClassificationId,
				getProduceId(produceId, produceClassificationId),
				produceId,
			],
		)
		if (req.file) {
			// Assuming req.file contains the image file
			const imageData = req.file.filename; // Assuming the image is stored in a buffer

			// Assuming db2 is your database connection object
			await db2.execute(
				"UPDATE setup_produce SET images = ? WHERE produce_id = ?",
				[imageData, produceId]
			);
		}
		res.status(200).send({
			success: true,
			message: "Produce Item Updated Successfully",
		})
	} catch (error) {
		res.status(500).send({
			success: false,
			message: error.message,
		})
	}
}

const getAllProduceItem = async (req, res) => {
	try {
		const [data] = await db2.query(
			"SELECT a.*, b.produce_classification_name_en FROM setup_produce a INNER JOIN dropdown_produce_classification b ON a.produce_classification_id = b.produce_classification_id",
		)
		res.status(200).send({
			success: true,
			data: data,
		})
	} catch (e) {
		res.status(500).send({
			success: false,
			message: e,
		})
		return
	}
}

const getSelectProduceItemForEan = async (req, res) => {
	try {
		const [data] = await db2.query(
			"SELECT produce_id, produce_name_en, produce_name_th FROM setup_produce",
		)
		res.status(200).send({
			success: true,
			data: data,
		})
	} catch (e) {
		res.status(500).send({
			success: false,
			message: e,
		})
	}
}

const getDropdownProduceClassification = async (req, res) => {
	try {
		const [data] = await db2.query(
			"SELECT * FROM dropdown_produce_classification",
		)
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



// Api for edit  procedure for adjustment 
const editAvailableProcedure = async (req, res) => {
	try {
		const { item, qty_on_hand, User } = req.body;

		const sqlFOB = 'CALL Stock_Adjustment_Produce(?,?,?)';
		const [rows] = await db2.query(sqlFOB, [item, qty_on_hand, User]);

		res.status(200).json({
			success: true,
			message: 'success'
		})

	} catch (error) {
		res.status(500).json({
			message: "Internal server error",
			error: error.message
		});
	}
}

module.exports = {
	createProduce,
	updateProduce,
	getAllProduceItem,
	getSelectProduceItemForEan,
	getDropdownProduceClassification,
	editAvailableProcedure
}
