const { db: db2 } = require("../db/db2")
const getAirline = async (req, res) => {
	try {
		const [data] = await db2.query("SELECT * FROM setup_liner")
		res.status(200).send({
			success: true,
			data: data,
		})
	} catch (error) {
		res.status(500).send({
			success: false,
			message: error,
		})
	}
}

const updateAirline = async (req, res) => {
	const { liner_id, liner_name, liner_code, liner_type_id, preffered_supplier, user_id } = req.body
	const sqlStatement =
		typeof liner_id === "undefined"
			? "INSERT INTO `setup_liner` (`liner_id`, `liner_type_id`, `liner_name`, `liner_code`, `preffered_supplier`, `user_id`, `status`, `created`, `updated`) VALUES (NULL, ?, ?, ?, ?, ?,'on', current_timestamp(), current_timestamp())"
			: "UPDATE `setup_liner` SET `liner_type_id` = ?, `liner_name` = ?, `liner_code` = ?,  `preffered_supplier` = ?, `updated` = current_timestamp() WHERE `setup_liner`.`liner_id` = ?"
	const sqlValue =
		typeof liner_id === "undefined"
			? [liner_type_id, liner_name, liner_code, preffered_supplier, user_id]
			: [liner_type_id, liner_name, liner_code, preffered_supplier, liner_id]
	try {
		const [data] = await db2.query(sqlStatement, sqlValue)
		res.status(200).send({
			success: true,
			linerData: data,
		})
		return true
	} catch (error) {
		res.status(500).send({
			success: false,
			message: error,
		})
		return false
	}
}

const updateAirlineStatus = async (req, res) => {
	try {
		const { liner_id, status } = req.body
		const sqlStatement =
			"UPDATE `setup_liner` SET `status` = ? WHERE `setup_liner`.`liner_id` = ?"
		const sqlValue = [status, liner_id]
		const [data] = await db2.query(sqlStatement, sqlValue)
		res.status(200).send({
			success: true,
			linerData: data,
		})
		return true
	} catch (error) {
		res.status(500).send({
			success: false,
			message: error,
		})
		return false
	}
}


const getjourneyNumber = async (req, res) => {
	const { liner_id }=req.body;
	try {
		const [data] = await db2.query(`SELECT ID, journey_number FROM setup_journey_details where Liner_ID='${liner_id}'`)
		res.status(200).send({
			success: true,
			data: data,
		})
	} catch (error) {
		res.status(500).send({
			success: false,
			message: error,
		})
	}
}

const Addjourneydetails=async(req, res)=>{
	const { journey_id, from_port, destination_port, liner_id, journey_number, load_time, 
		Transit_to_Departure, ETD, Transit_to_arrival, ETA
	} = req.body
	const sqlStatement =
		typeof journey_id === "undefined"
			? "INSERT INTO `setup_journey_details` (`from_port`, `destination_port`, `Liner_ID`, `journey_number`, `Load_time`,  `Transit_to_Departure`, `ETD`, `Transit_to_arrival`, `ETA`) VALUES (?,?,?,?,?,?,?,?,?)"
			: "UPDATE `setup_journey_details` SET `from_port` = ?, `destination_port` = ?, `Liner_ID` = ?, `journey_number` = ?, `Load_time`=?,  `Transit_to_Departure`=?, `ETD`=?, `Transit_to_arrival`=?, `ETA`=? WHERE `setup_journey_details`.`ID` = ?"
	const sqlValue =
		typeof journey_id === "undefined"
			? [from_port, destination_port, liner_id, journey_number, load_time,
				Transit_to_Departure, ETD, Transit_to_arrival, ETA]
			: [from_port, destination_port, liner_id, journey_number, load_time,
				Transit_to_Departure, ETD, Transit_to_arrival, ETA, journey_id]
	try {
		const [data] = await db2.query(sqlStatement, sqlValue)
		res.status(200).send({
			success: true,
			linerData: data,
		})
		return true
	} catch (error) {
		res.status(500).send({
			success: false,
			message: error,
		})
		return false
	}
}

const getjourneyDetails = async (req, res) => {
	try {
		const [data] = await db2.query(`SELECT setup_journey_details.*, setup_journey_details.from_port as from_port_id, setup_journey_details.destination_port asdestination_port_id, setup_liner.liner_name, a.port_name as from_port, b.port_name as destination_port FROM setup_journey_details 
		INNER JOIN setup_liner on setup_liner.liner_id=setup_journey_details.Liner_ID
		INNER JOIN setup_ports as a on a.port_id=setup_journey_details.from_port
		INNER JOIN setup_ports as b on b.port_id=setup_journey_details.destination_port`)
		res.status(200).send({
			success: true,
			data: data,
		})
	} catch (error) {
		res.status(500).send({
			success: false,
			message: error,
		})
	}
}

const DeleteJourney = async (req, res) => {
    const { journey_id } = req.body;
    try {
        const result = await db2.query('DELETE FROM setup_journey_details WHERE ID = ?', [journey_id]);
        res.status(200).send({
            success: true,
            message: "Data Deleted Successfully",
        });
    } catch (error) {
        console.error("Error deleting journey:", error);
        res.status(500).send({
            success: false,
            message: "An error occurred while deleting data",
        });
    }
};

module.exports = {
	getAirline,
	updateAirline,
	updateAirlineStatus,
	getjourneyNumber,
	Addjourneydetails,
	getjourneyDetails,
	DeleteJourney
}
