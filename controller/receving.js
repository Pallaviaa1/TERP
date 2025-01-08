const { db: db2 } = require("../db/db2")

const getAllReceving = async (req, res) => {
	try {
		const [data] = await db2.query(
			"SELECT a.*, b.status as statusName FROM `receiving` as a INNER JOIN `dropdown_status` as b ON a.Status = b.status_id",
		)
		res.status(200).json({
			message: "All Receving",
			data: data,
		})
	} catch (e) {
		res.status(400).json({
			message: "Error Occured",
			error: e,
		})
	}
}

const getViewToReceving = async (req, res) => {
	try {
		const [data] = await db2.query(`
            SELECT a.*, b.unit_id 
            FROM to_receive AS a 
            INNER JOIN dropdown_unit_count AS b 
            ON a.unit = b.unit_name_en
        `);
		// ON a.unit = b.unit_name_en
		res.status(200).json({
			data: data,
		});
	} catch (e) {
		res.status(400).json({
			message: "Error Occurred",
			error: e,
		});
	}
};


const getAllReceving_bp = async (req, res) => {
	try {
		const [data] = await db2.query("SELECT * FROM receiving")
		res.json({ data })
	} catch (error) {
		res.status(400).json({
			error: error,
		})
	}
}

// const addReceving = async (req, res) => {
// 	const {
// 		pod_code,
// 		rcv_crate,
// 		rcvd_qty,
// 		rcv_crate_weight,
// 		rcv_gross_weight,
// 		rcvd_unit_id,
// 		pod_type_id,
// 		user_id
// 	} = req.body;

// 	try {
// 		const procedureName = +pod_type_id === 3 ? "New_Receiving" : "New_Receiving_BP";

// 		let result;
// 		if (procedureName === "New_Receiving") {
// 			// Call the stored procedure with OUT parameters
// 			const [rows] = await db2.query(
// 				`CALL ${procedureName}(?, ?, ?, ?, ?, ?, ?, @Message_EN, @Message_TH, @Message_EN1, @Message_TH1)`,
// 				[
// 					pod_code,
// 					rcv_crate,
// 					rcvd_qty,
// 					rcv_crate_weight,
// 					rcv_gross_weight,
// 					rcvd_unit_id,
// 					user_id
// 				]
// 			);

// 			// Fetch the OUT parameters
// 			const [outParams] = await db2.query('SELECT @Message_EN AS Message_EN, @Message_TH AS Message_TH, @Message_EN1 AS Message_EN1, @Message_TH1 AS Message_TH1');
// 			result = outParams[0];

// 			if (result.Message_EN || result.Message_TH) {
// 				// If error messages are present
// 				res.status(200).json({
// 					success: false,
// 					message: { Message_EN: result.Message_EN, Message_TH: result.Message_TH },
// 					data: 1
// 				});
// 			} else {
// 				// If success messages are present
// 				res.status(200).json({
// 					success: true,
// 					message: { Message_EN: result.Message_EN1, Message_TH: result.Message_TH1 },
// 					data: 1
// 				});
// 			}
// 		} else {
// 			// Call the stored procedure without OUT parameters
// 			const [rows] = await db2.query(
// 				`CALL ${procedureName}(?, ?, ?, ?, ?, ?, ?)`,
// 				[
// 					pod_code,
// 					rcv_crate,
// 					rcvd_qty,
// 					rcv_crate_weight,
// 					rcv_gross_weight,
// 					rcvd_unit_id,
// 					user_id
// 				]
// 			);

// 			// Directly send a success message
// 			res.status(200).json({
// 				success: true,
// 				message: "Success: New_Receiving_BP executed",
// 				data: 2
// 			});
// 		}
// 	} catch (e) {
// 		res.status(500).json({
// 			message: "Error Occurred",
// 			error: e.message,
// 		});
// 	}
// };

const addReceving = async (req, res) => {
	const {
		pod_code,
		rcv_crate,
		rcvd_qty,
		rcv_crate_weight,
		rcv_gross_weight,
		rcvd_unit_id,
		pod_type_id,
		user_id
	} = req.body;

	try {
		const procedureName = +pod_type_id === 3 ? "Receiving_NEW" : "New_Receiving_BP";

		let result;
		if (procedureName === "Receiving_NEW") {
			// Call the stored procedure with OUT parameters

			const [podDetails] = await db2.query(
				`SELECT pod_item, pod_id FROM purchase_order_details WHERE pod_code = ?`,
				[pod_code]
			);

			const { pod_item, pod_id } = podDetails[0];

			// Insert into receiving table
			// Insert into receiving table
			const [insertResult] = await db2.query(
				`INSERT INTO receiving (
					rcvd_item, pod_code, rcv_crate, rcvd_qty, rcv_crate_weight, 
					rcv_gross_weight, rcvd_unit_id, pod_id, user_id
				) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
				[
					pod_item,
					pod_code,
					rcv_crate,
					rcvd_qty,
					rcv_crate_weight,
					rcv_gross_weight,
					rcvd_unit_id,
					pod_id,
					user_id,
				]
			);

			// Pass the inserted ID to the stored procedure
			await db2.query(
				`CALL ${procedureName}(?, @Message_EN, @Message_TH, @Message_EN1, @Message_TH1)`,
				[insertResult.insertId] // Assuming the procedure expects the `insertId` of the new row
			);

			// Fetch the OUT parameters
			const [outParams] = await db2.query('SELECT @Message_EN AS Message_EN, @Message_TH AS Message_TH, @Message_EN1 AS Message_EN1, @Message_TH1 AS Message_TH1');
			result = outParams[0];

			if (result.Message_EN || result.Message_TH) {
				// If error messages are present
				res.status(200).json({
					success: false,
					message: { Message_EN: result.Message_EN, Message_TH: result.Message_TH },
					data: 1
				});
			} else {
				// If success messages are present
				res.status(200).json({
					success: true,
					message: { Message_EN: result.Message_EN1, Message_TH: result.Message_TH1 },
					data: 1
				});
			}
		} else {
			// Call the stored procedure without OUT parameters
			const [rows] = await db2.query(
				`CALL ${procedureName}(?, ?, ?, ?, ?, ?, ?)`,
				[
					pod_code,
					rcv_crate,
					rcvd_qty,
					rcv_crate_weight,
					rcv_gross_weight,
					rcvd_unit_id,
					user_id
				]
			);

			// Directly send a success message
			res.status(200).json({
				success: true,
				message: "Success: New_Receiving_BP executed",
				data: 2
			});
		}
	} catch (e) {
		res.status(500).json({
			message: "Error Occurred",
			error: e.message,
		});
	}
};

module.exports = {
	getAllReceving,
	getAllReceving_bp,
	getViewToReceving,
	addReceving,
}
