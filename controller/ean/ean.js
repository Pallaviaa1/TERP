const { db: db2 } = require("../../db/db2")
const { getEanPerKg } = require("../../function/getEanperKG")
const moment = require('moment')

const getEanDeatils = async (req, res) => {
	try {
		const [data] = await db2.query(
			"SELECT * FROM ean_details WHERE ean_id = ?",
			[req.query.id],
		)
		res.status(200).json({
			message: "All Wage",
			data: data,
		})
	} catch (e) {
		res.status(400).json({
			message: "Error Occured",
			error: err,
		})
	}
}

const addEanDetails = async (req, res) => {
	try {
		const { ean_id, data, user_id } = req.body
		for (const d of data) {
			await db2.execute(
				"INSERT INTO ean_details (ean_id, detail_type, item_id, quantity_per_ean, user_id) VALUES (?,?,?,?,?)",
				[ean_id, +d.detail_type, d.item_id, d.quantity_per_ean, user_id],
			)
		}
		await db2.execute(
			"UPDATE ean SET estimated_EAN_PER_KG = ? WHERE ean_id = ?",
			[getEanPerKg(data), ean_id],
		)
		res.status(200).json({
			message: "Ean Details Added Successfully",
		})
	} catch (e) {
		res.status(400).json({
			message: "Error Occured",
			error: e,
		})
	}
}


const updateEanDetails = async (req, res) => {
	const { ean_id, data } = req.body
	try {
		for (const d of data.filter((v) => v.ean_detail_id)) {
			await db2.execute(
				"UPDATE ean_details SET detail_type = ?, item_id = ?, quantity_per_ean = ? WHERE ean_detail_id = ?",
				[d.detail_type, d.item_id, d.quantity_per_ean, d.ean_detail_id],
			)
		}
		await db2.execute(
			"UPDATE ean SET estimated_EAN_PER_KG = ? WHERE ean_id = ?",
			[getEanPerKg(data), ean_id],
		)
		await res.status(200).json({
			message: "Ean Details Added Successfully",
		})
	} catch (err) {
		return res.status(400).json({
			message: "Error Occured",
			error: err,
		})
	}
}

const createEan = async (req, res) => {
	const {
		ean_name_en,
		ean_name_th,
		ean_unit,
		ean_code,
		user,
		estimated_EAN_PER_HOUR,
		estimated_EAN_PER_KG,
	} = req.body

	try {
		const query =
			"INSERT INTO ean(ean_name_en, ean_name_th, ean_unit, ean_code, user, estimated_EAN_PER_HOUR, estimated_EAN_PER_KG) VALUES(?, ?, ?, ?, ?, ?, ?)"
		const [data] = await db2.execute(query, [
			ean_name_en || "",
			ean_name_th || "",
			ean_unit,
			ean_code,
			user,
			estimated_EAN_PER_HOUR,
			estimated_EAN_PER_KG,
		])
		if (req.file) {
			// Assuming req.file contains the image file
			const imageData = req.file.filename; // Assuming the image is stored in a buffer

			// Assuming db2 is your database connection object
			await db2.execute(
				"UPDATE ean SET images = ? WHERE ean_id = ?",
				[imageData, data.insertId]
			);
		}
		res.status(200).send({
			success: true,
			message: "success",
			data: data.insertId,
		})
	} catch (err) {
		res.status(500).send({
			success: false,
			message: err,
		})
	}
}

const EditEan = async (req, res) => {
	const {
		ean_name_en,
		ean_name_th,
		ean_unit,
		ean_code,
		estimated_EAN_PER_HOUR,
		estimated_EAN_PER_KG,
	} = req.body
	try {
		await db2.query(
			`UPDATE ean SET ean_name_en = "${ean_name_en}", ean_name_th = "${ean_name_th}", ean_code = "${ean_code}", ean_unit = "${ean_unit}", estimated_EAN_PER_HOUR = "${estimated_EAN_PER_HOUR}", estimated_EAN_PER_KG = "${estimated_EAN_PER_KG}" WHERE ean_id = "${req.body.ean_id}"`,
		)
		if (req.file) {
			// Assuming req.file contains the image file
			const imageData = req.file.filename; // Assuming the image is stored in a buffer

			// Assuming db2 is your database connection object
			await db2.execute(
				"UPDATE ean SET images = ? WHERE ean_id = ?",
				[imageData, req.body.ean_id]
			);
		}
		res.status(200).send({
			success: true,
			message: "Updated Successfully",
		})
	} catch (e) {
		res.status(500).send({
			success: false,
			message: error,
		})
	}
}
//1
const createEanProducne = async (req, res) => {
	try {
		const { packing_common_id, user_id, ean_id, ean_quantity, unit_id, brand_id, assigned_order, number_of_staff, start_time, end_time, state } = req.body;
		//console.log(req.body);

		const formattedStartTime = moment(start_time, 'DD-MM-YYYY HH:mm:ss').format('YYYY-MM-DD HH:mm:ss')
		const formattedEnd_time = moment(end_time, 'DD-MM-YYYY HH:mm:ss').format('YYYY-MM-DD HH:mm:ss')
		if (!packing_common_id) {
			const {
				pod_code,
				sorting_id,
				qty_used,
				number_of_staff,
				start_time,
				end_time,
				user_id
			} = req.body.state

			const formattedStateStartTime = moment(start_time, 'DD-MM-YYYY HH:mm:ss').format('YYYY-MM-DD HH:mm:ss')
			const formattedStateEnd_time = moment(end_time, 'DD-MM-YYYY HH:mm:ss').format('YYYY-MM-DD HH:mm:ss')
			const sql =
				"INSERT INTO packing_common (pod_code, sorting_id, user_id, qty_used, number_of_staff, start_time, end_time, fifo_status) VALUES (?, ?, ?, ?, ?, ?, ?, 1)"
			const [result] = await db2.query(sql, [
				pod_code,
				sorting_id,
				user_id,
				qty_used,
				number_of_staff,
				formattedStateStartTime,
				formattedStateEnd_time,
			])
			await db2.query(
				`UPDATE packing_common SET number_of_staff = "${number_of_staff}", start_time = "${formattedStartTime}", end_time = "${formattedEnd_time}" WHERE packing_common_id = "${result.insertId}"`
			);

			const [data] = await db2.execute(`
				CALL Insert_packing_ean(${result.insertId}, ${ean_id}, ${ean_quantity}, ${unit_id}, ${brand_id}, ${assigned_order ? assigned_order : 'NULL'}, ${user_id})
			`);

			res.status(200).send({
				success: true,
				message: "Create Successfully",
				data: result.insertId,
				packing_ean_id: data
			});
		}
		else {
			await db2.query(
				`UPDATE packing_common SET number_of_staff = "${number_of_staff}", start_time = "${formattedStartTime}", end_time = "${formattedEnd_time}" WHERE packing_common_id = "${packing_common_id}"`
			);

			const [data] = await db2.execute(`
				CALL Insert_packing_ean(${packing_common_id}, ${ean_id}, ${ean_quantity}, ${unit_id}, ${brand_id}, ${assigned_order ? assigned_order : 'NULL'}, ${user_id})
			`);

			res.status(200).send({
				success: true,
				message: "Create Successfully",
				data: packing_common_id,
				packing_ean_id: data
			});
		}

	} catch (error) {
		res.status(500).send({
			success: false,
			message: error.message
		});
	}
};


const getEanDetailViews = async (req, res) => {
	try {
		
		const [result] = await db2.query(
			"SELECT * FROM packing_ean_view WHERE packing_common_id = ?",
			[req.body.packing_common_id]
		);

		// console.log(result);
		res.status(200).json({
			message: "success",
			data: result,
		})

	} catch (error) {
		res.status(500).send({
			success: false,
			message: error,
		})
	}
}

const createEanPacking = async (req, res) => {
	try {

		const { packing_common_id, packing_ean_id } = req.body

		await db2.execute(`CALL New_Ean_Packing(${packing_common_id})`)
		const [rows] = await db2.execute(`CALL Packing_EAN_alarm(?, @Message_en, @Message_th)`, [packing_ean_id]);
		const [result] = await db2.execute(`SELECT @Message_en AS message_en, @Message_th AS message_th`);

		if (result[0].message_en !== null || result[0].message_th !== null) {
			res.status(200).send({
				success: false,
				message_en: result[0].message_en,
				message_th: result[0].message_th
			});
		} else {
			res.status(200).send({
				success: true,
				message: "Created Successfully"
			});
		}

	} catch (error) {
		res.status(500).send({
			success: false,
			message: error,
		})
	}
}


const cleanPayload = (payload) => {
	const cleaned = {};
	Object.keys(payload).forEach(key => {
		// Trim the key and value
		cleaned[key.trim()] = payload[key] !== null ? payload[key].toString().trim() : payload[key];
	});
	return cleaned;
};

// Api for adjust sorting stock
const Adjust_sorting_stock = async (req, res) => {
	try {
		const cleanedBody = cleanPayload(req.body);

		const { Sorting_id, Qty_on_hand, Crates_on_hand, USER } = cleanedBody;

		const sqlFOB = 'CALL Adjust_Sorting_Stock(?,?,?,?)';
		const [rows] = await db2.query(sqlFOB, [Sorting_id, Qty_on_hand, Crates_on_hand, USER]);

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


const CheckstartEndTime = async (req, res) => {
	try {
		const { start_time, end_time } = req.body;
		const moment = require('moment');

		// Add 7 hours to the current time
		const currentTimePlus7Hours = moment().add(7, 'hours');

		// Fetch error messages
		const [errorMessages] = await db2.query("SELECT error_id, Error_en, Error_th FROM Error_Messages WHERE error_id IN (11, 12)");
		const errorMap = errorMessages.reduce((map, obj) => {
			map[obj.error_id] = { en: obj.Error_en, th: obj.Error_th };
			return map;
		}, {});

		// Validate start_time and end_time
		if (moment(start_time, 'DD-MM-YYYY HH:mm:ss').isAfter(currentTimePlus7Hours)) {
			return res.status(200).send({
				success: false,
				message: {
					en: errorMap[11]?.en || "Start time cannot be in the future.",
					th: errorMap[11]?.th || "เวลาเริ่มต้นไม่สามารถอยู่ในอนาคตได้"
				}
			});
		}

		if (moment(end_time, 'DD-MM-YYYY HH:mm:ss').isBefore(moment(start_time, 'DD-MM-YYYY HH:mm:ss'))) {
			return res.status(200).send({
				success: false,
				message: {
					en: errorMap[12]?.en || "End time cannot be before start time.",
					th: errorMap[12]?.th || "เวลาเสร็จสิ้นไม่สามารถน้อยกว่าเวลาเริ่มต้นได้"
				}
			});
		}

		// If validation passes, you can add more logic here if needed
		res.status(200).send({
			success: true,
			message: "Times are valid."
		});
	} catch (error) {
		res.status(500).send({
			success: false,
			message: error.message
		});
	}
};


const getEANList = async (req, res) => {
	try {
		const { item_id } = req.body;

		// SQL Query
		const query = `
			SELECT
    t1.item_id,
    t1.ean_id,
    TRIM(CONCAT(EAN_name_en(t1.ean_id), "(", IFNULL(SUBSTRING_INDEX(REPLACE(t3.packaging_name, ' ', ''), "-", -1), "Loose"), ")")) AS ean_name_en,
    TRIM(CONCAT(EAN_name_th(t1.ean_id), "(", IFNULL(SUBSTRING_INDEX(REPLACE(t3.packaging_name, ' ', ''), "-", -1), "ลูส"), ")")) AS ean_name_th
FROM
    (SELECT ean_id, item_id 
     FROM ean_details 
     WHERE item_id = ? AND detail_type = 3) AS t1
LEFT JOIN
    (SELECT ean_id, item_id 
     FROM ean_details 
     WHERE detail_type = 1) AS t2
ON t1.ean_id = t2.ean_id
LEFT JOIN
    setup_packaging AS t3
ON t2.item_id = t3.packaging_id
GROUP BY 
    t1.ean_id;
`;

		// Execute the query
		const [data] = await db2.query(query, [item_id]);

		// Send the response
		res.status(200).json({
			message: "All EAN List",
			data: data,
		});
	} catch (error) {
		res.status(500).send({
			success: false,
			message: error.message
		});
	}
}


module.exports = {
	getEanDeatils,
	addEanDetails,
	updateEanDetails,
	EditEan,
	createEan,
	getEanDetailViews,
	createEanProducne,
	createEanPacking,
	Adjust_sorting_stock,
	CheckstartEndTime,
	getEANList
}
//
