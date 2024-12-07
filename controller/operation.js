const { db } = require("../db/db2")

const dashboardOpertation = async (req, res) => {
	const [Orders_pipline] = await db.query(
		"SELECT *, `AWB/BL` AS AWB, `Consignee Name` AS Consignee_Name, `Loading Date` AS Loading_Date, `Loading Time` AS Loading_Time, `Order Number` AS Order_Number FROM Orders_pipline"
	);

	// Add color based on the value of AWB
	const updatedOrders = Orders_pipline.map(order => {
		return {
			...order,
			color: order.AWB ? '#22c35d' : '#387be9' // Green if AWB is not null/empty, Blue otherwise
		};
	});

	res.json({
		Orders_pipline: updatedOrders,
	});

}

module.exports = {
	dashboardOpertation,
}
