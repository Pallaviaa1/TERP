const { db: db2 } = require("../db/db2")
const getViewToSort = async (req, res) => {
	try {
		const [result] = await db2.query("SELECT * FROM to_sort")
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

const getSorting = async (req, res) => {
	try {
		const [data] = await db2.query("SELECT * FROM sorting")
		res.status(200).json({
			message: "All Wage",
			data: data,
		})
	} catch (err) {
		res.status(400).json({
			message: "Error Occured",
			error: err,
		})
	}
}
const addsorting = async (req, res) => {
	const {
		receiving_id,
		sorting_good,
		sorted_crates,
		sorting_notes,
		blue_crates,
		user_id
	} = req.body
	try {
		const [data] = await db2.execute("CALL New_Sorting(?,?,?,?,?,?)", [
			receiving_id,
			sorting_good,
			sorted_crates,
			sorting_notes,
			blue_crates,
			user_id
		])
		res.status(200).json({
			message: "Done",
			data: data
		})
	} catch (err) {
		res.status(400).json({
			error: err,
		})
	}
}

const revertSorting = async (req, res) => {
	const { sorting_id } = req.body
	try {
		const [result] = await db2.query(
			"SELECT a.*, b.rcvd_item from sorting as a INNER JOIN receiving as b on a.receiving_id = b.receiving_id WHERE a.sorting_id = ? LIMIT 1;",
			[sorting_id],
		)
		const { rcvd_item, pod_code } = result[0]
		await db2.query("DELETE FROM sorting WHERE sorting_id = ? LIMIT 1", [
			sorting_id,
		])
		await db2.query(
			"DELETE FROM inventory WHERE pod_code = ? AND pod_item = ? AND transaction_type = 4",
			[pod_code, rcvd_item],
		)
		res.status(200).json({
			message: "All Receving",
			data: result,
		})
	} catch (e) {
		res.status(400).json({
			message: "Error Occured",
			error: e,
		})
	}
}

// new_added

const restoreEanPacking = async (req, res) => {
	try {
		const { sorting_id, user_id, pod_code } = req.body;

		// Call the stored procedure to restore sorting
		const [results] = await db2.execute(`CALL restore_sorting(${sorting_id}, @checkMessage)`);

		// Fetch the check message
		const [checkMessageResult] = await db2.execute("SELECT @checkMessage AS checkMessage");
		const checkMessage = checkMessageResult.length > 0 ? checkMessageResult[0].checkMessage : null;

		if (checkMessage !== null) {
			// If check message is not null, show the check message
			res.status(200).send({
				success: false,
				message: checkMessage
			});
		} else {
			const [data] = await db2.execute(
				`INSERT INTO Transaction_records(Transaction_description, Transaction_ref, USER) VALUES(?,?,?)`,
				[
					"Restored Sorting",
					pod_code,
					user_id
				],
			)
			// If check message is null, show the success message
			const [successmessages] = await db2.execute(
				`select * from Error_Messages where error_id ='${6}'`
			)
			// If check message is null, show the success message
			res.status(200).send({
				success: true,
				message: successmessages[0].Error_en
			});
		}
	} catch (error) {
		res.status(500).send({
			success: false,
			message: error
		});
	}
};



const restoreSorting = async (req, res) => {
	try {
		const { receiving_id, user_id, pod_code } = req.body;

		// Call the stored procedure to restore receiving
		const [results] = await db2.execute(`CALL restore_receiving(${receiving_id}, @checkMessage)`);

		// Fetch the check message
		const [checkMessageResult] = await db2.execute("SELECT @checkMessage AS checkMessage");
		const checkMessage = checkMessageResult.length > 0 ? checkMessageResult[0].checkMessage : null;

		if (checkMessage !== null) {
			// If check message is not null, show the check message
			res.status(200).send({
				success: false,
				message: checkMessage
			});
		} else {
			const [data] = await db2.execute(
				`INSERT INTO Transaction_records (Transaction_description, Transaction_ref, USER) VALUES(?,?,?)`,
				[
					"Restored Receiving",
					pod_code,
					user_id
				],
			)

			// Error_Messages
			const [successmessages] = await db2.execute(
				`select * from Error_Messages where error_id ='${6}'`
			)
			// If check message is null, show the success message
			res.status(200).send({
				success: true,
				message: successmessages[0].Error_en
			});
		}
	} catch (error) {
		res.status(500).send({
			success: false,
			message: error
		});
	}
};


const restorePackingCommon = async (req, res) => {
	try {
		const { packingCommonid, user_id, pod_code } = req.body;

		// Call the stored procedure to restore packing common
		const [results] = await db2.execute(`CALL restore_packing_common(${packingCommonid}, @checkMessage)`);

		// Fetch the check message
		const [checkMessageResult] = await db2.execute("SELECT @checkMessage AS checkMessage");
		const checkMessage = checkMessageResult.length > 0 ? checkMessageResult[0].checkMessage : null;

		if (checkMessage !== null) {
			// If check message is not null, show the check message
			res.status(200).send({
				success: false,
				message: checkMessage
			});
		} else {
			const [data] = await db2.execute(
				`INSERT INTO Transaction_records (Transaction_description, Transaction_ref, USER) VALUES(?,?,?)`,
				[
					"Restore Packing Common",
					packingCommonid,
					user_id
				],
			)
			// If check message is null, show the success message
			const [successmessages] = await db2.execute(
				`select * from Error_Messages where error_id ='${6}'`
			)
			// If check message is null, show the success message
			res.status(200).send({
				success: true,
				message: successmessages[0].Error_en
			});
		}
	} catch (error) {
		res.status(500).send({
			success: false,
			message: error
		});
	}
};

module.exports = { getViewToSort, addsorting, getSorting, revertSorting, restoreEanPacking, restoreSorting, restorePackingCommon }
