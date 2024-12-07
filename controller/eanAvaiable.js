const { db } = require("../db/db2")

const getEanAvailable = async (req, res) => {
	try {
		const [data] = await db.query("SELECT * FROM Available_EAN")
		res.status(200).json({
			data: data,
			message: "success",
		})
	} catch (err) {
		res.status(400).json({
			error: err,
			message: "error",
		})
	}
}

module.exports = { getEanAvailable }
