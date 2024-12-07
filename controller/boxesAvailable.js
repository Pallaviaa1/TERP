const { db } = require("../db/db2")

const getBoxesAvailable = async (req, res) => {
	try {
		const [data] = await db.query("SELECT * FROM Available_Boxes")
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
//Stock_Adjustment_PB
const StockAdjustmentPB = async (req, res) => {
	try {
		const { type, item, qty_on_hand, user_id}=req.body;
		const [rows] = await db.query(
			"CALL Stock_Adjustment_PB(?, ?, ?, ?)",
			[
				type|| null,
				item|| null,
				qty_on_hand || null,
				user_id|| null
			]
		);
		res.status(200).json({
			success: true,
			message: "successfully"
		});
	} catch (error) {
		res.status(400).json({
			error: error.message,
			message: "error",
		})
	}
}

module.exports = { getBoxesAvailable, StockAdjustmentPB }
