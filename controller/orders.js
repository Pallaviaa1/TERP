
const { log } = require("winston");
const { db } = require("../db/db2")
const sendMail = require('../helpers/sendMail');
const db2 = require("../db/db2");


const getOrders = async (req, res) => {
	try {
		const { role, userId, status } = req.query;
		// Define the base SQL query
		let sql = `
            SELECT orders.*,
                users.name AS created_by, 
                clients.client_name,
                clients.client_address,
                clients.client_tax_number,
                clients.client_email,
                clients.client_phone,
                setup_liner.liner_name AS Airline, 
                setup_liner.liner_code AS Airline_liner_code, 
                setup_ports.port_name AS Airport, 
                setup_ports.IATA_code AS Airport_IATA_code, 
                dropdown_currency.currency AS currency, 
                vendors.name AS clearance_name, 
                consignee.consignee_name,
                consignee.consignee_address,
                consignee.consignee_tax_number, 
                consignee.consignee_email,
                consignee.consignee_phone, 
                location.name AS location_name, 
                freight.Liner AS Freight_liner, 
                freight.journey_number AS Freight_journey_number, 
                freight.bl AS Freight_bl, 
                freight.Load_date AS Freight_load_date, 
                freight.Load_time AS Freight_load_time, 
                DATE_FORMAT(freight.Ship_date, '%m/%d/%Y') AS Freight_ship_date, 
                freight.ETD AS Freight_etd, 
                freight.Arrival_date AS Freight_arrival_date, 
                freight.ETA AS Freight_eta, 
                supplier.name AS supplier_name
            FROM orders
            INNER JOIN consignee ON orders.Consignee_ID = consignee.consignee_id
            INNER JOIN clients ON clients.client_id = orders.Client_id
            INNER JOIN setup_ports ON setup_ports.port_id = orders.Destination_Port
            INNER JOIN setup_liner ON setup_liner.liner_id = orders.Liner_ID
            INNER JOIN vendors AS supplier ON orders.O_Freight_Provider = supplier.vendor_id
            INNER JOIN setup_location AS location ON orders.loading_location = location.id
            INNER JOIN order_freight_details AS freight ON orders.Order_ID = freight.order_id
            INNER JOIN users ON users.id = orders.user
            INNER JOIN dropdown_currency ON dropdown_currency.currency_id = orders.FX_ID
            INNER JOIN vendors ON vendors.vendor_id = orders.O_Clearance_Provider
        `;

		// Add WHERE condition based on role

		let whereClauses = [];

		if (role === 'Client') {
			whereClauses.push(`orders.Client_id = '${userId}'`);
		} else if (role === 'Consignee') {
			whereClauses.push(`orders.Consignee_ID = '${userId}'`);
		}

		// Add status filter if provided
		if (status && status != 4) {
			whereClauses.push(`orders.Status = '${status}'`);
		}

		// Append WHERE clause if there are any conditions
		if (whereClauses.length > 0) {
			sql += ` WHERE ${whereClauses.join(' AND ')}`;
		}


		// Add ORDER BY clause
		sql += ` ORDER BY orders.Order_Number DESC`;

		// Execute the query
		const [data] = await db.query(sql);
		//	console.log(data);

		data.forEach(order => {
			if (order.Freight_load_date) {
				const loadDate = new Date(order.Freight_load_date);
				const order_loadDate = new Date(order.load_date);

				// Set time to midnight (00:00:00) to avoid time zone issues
				loadDate.setUTCHours(0, 0, 0, 0);
				order_loadDate.setUTCHours(0, 0, 0, 0);

				// Add one day (24 hours * 60 minutes * 60 seconds * 1000 milliseconds)
				order.Freight_load_date = new Date(loadDate.getTime() + 24 * 60 * 60 * 1000);
				order.load_date = new Date(order_loadDate.getTime() + 24 * 60 * 60 * 1000);
			}
		});

		//console.log(data[0]);

		res.status(200).json({ success: true, data });
	} catch (e) {
		res.status(500).json({ message: "Internal server error", error: e })
	}
}


const getOrdersPacking = async (req, res) => {
	try {
		const [data] = await db.query(
			/* sql */ `SELECT orders.*,
			users.name as created_by,
			clients.client_name,
			setup_liner.liner_name as Airline,
			setup_liner.liner_code as Airline_liner_code,
			setup_ports.port_name as Airport, setup_ports.IATA_code as Airport_IATA_code,
			dropdown_currency.currency as currency,
			vendors.name as clearance_name,
    consignee.consignee_name,
    locaiton.name AS location_name,
    freight.Liner AS Freight_liner,
    freight.journey_number AS Freight_journey_number,
    freight.bl AS Freight_bl,
    freight.Load_date AS Freight_load_date,
    freight.Load_time AS Freight_load_time,
    freight.Ship_date AS Freight_ship_date,
    freight.ETD AS Freight_etd,
    freight.Arrival_date AS Freight_arrival_date,
    freight.ETA AS Freight_eta,
    vendor.name AS supplier_name
FROM orders
INNER JOIN consignee ON  orders.Consignee_ID = consignee.consignee_id
INNER JOIN clients ON  clients.client_id = orders.Client_id
INNER JOIN setup_ports ON  setup_ports.port_id = orders.Destination_Port
INNER JOIN setup_liner ON  setup_liner.liner_id = orders.Liner_ID
INNER JOIN vendors AS vendor ON orders.O_Freight_Provider = vendor.vendor_id
INNER JOIN setup_location AS locaiton ON orders.loading_location = locaiton.id
INNER JOIN order_freight_details AS freight ON orders.Order_ID = freight.order_id
INNER JOIN users ON users.id = orders.user
INNER JOIN dropdown_currency ON dropdown_currency.currency_id = orders.FX_ID
INNER JOIN vendors ON vendors.vendor_id = orders.O_Clearance_Provider
WHERE orders.Status='${1}'
ORDER BY Order_Number DESC`,
		)
		if (data.length > 0) {
			for (const element of data) {
				const [results] = await db.execute(`CALL Order_Packing_Completion(?, @Packing_status, @go_to_invoice)`, [element.Order_ID]);

				// Fetch the check message
				const [details] = await db.execute("SELECT @Packing_status AS Packing_status, @go_to_invoice AS go_to_invoice");
				// Assign fetched values to element properties
				element.Packing_status = details[0].Packing_status;
				element.go_to_invoice = details[0].go_to_invoice;
			}
		}
		res.status(200).json({ data })
	} catch (e) {
		res.status(500).json({ message: "Internal server error", error: e.message })
	}
}

const getorderFreightDetails = async (req, res) => {
	try {
		const { journey_id, order_id, load_date } = req.body;
		//console.log(req.body);

		let query = '';
		let params = [];

		if (load_date) {
			//console.log(load_date);

			// Use the provided load_date
			query = /* sql */ `SELECT 
                sf.Load_time, sf.ETD, sf.ETA,
                DATE_ADD(DATE_FORMAT(?, '%Y-%m-%d'), INTERVAL ABS(sf.Transit_to_Departure) DAY) AS Freight_ship_date,
                DATE_ADD(DATE_ADD(DATE_FORMAT(?, '%Y-%m-%d'), INTERVAL ABS(sf.Transit_to_Departure) DAY), INTERVAL sf.Transit_to_arrival DAY) AS Freight_arrival_date
            FROM 
                setup_journey_details as sf
            WHERE 
                sf.ID = ?`;
			params = [load_date, load_date, journey_id];
		} else {
			// Use orders.load_date
			query = /* sql */ `SELECT 
                sf.Load_time, sf.ETD, sf.ETA,
                DATE_ADD(DATE_FORMAT(orders.load_date, '%Y-%m-%d'), INTERVAL ABS(sf.Transit_to_Departure) DAY) AS Freight_ship_date,
                DATE_ADD(DATE_ADD(DATE_FORMAT(orders.load_date, '%Y-%m-%d'), INTERVAL ABS(sf.Transit_to_Departure) DAY), INTERVAL sf.Transit_to_arrival DAY) AS Freight_arrival_date
            FROM 
                setup_journey_details as sf, orders
            WHERE 
                sf.ID = ? AND orders.Order_ID = ?`;
			params = [journey_id, order_id];
		}

		const [data] = await db.query(query, params);
		res.status(200).json({ data: data[0] });
	} catch (e) {
		res.status(500).json({ message: "Internal server error", error: e });
	}
};

const getOrdersDetails = async (req, res) => {
	const { id } = req.query;
	try {
		const [data] = await db.query(
			`SELECT *, OD_Profit_Percentage as profit_percentage
   FROM order_details 
   WHERE Order_ID = ?
   ORDER BY 
     order_details.Order_ID,
     CAST(itf_classification_ID(order_details.ITF) AS INT),
     PDF_Customs_Produce_Name_ITF(order_details.ITF),
     (order_details.OD_NW / order_details.OD_Box)`,
			[id]
		);

		res.status(200).json({ data: data });
	} catch (e) {
		res.status(500).json({ message: "Internal server error", error: e });
	}
};


const getOrderPackingDetails = async (req, res) => {
	const { id } = req.query;
	try {
		/* const [data] = await db.query(
			"SELECT * FROM order_details_view WHERE order_id = ?",
			[id]
		); */
		const [data] = await db.query(
			"SELECT * FROM Order_Packing_View WHERE order_id = ?",
			[id]
		);
		res.status(200).json({ data: data });
	} catch (e) {
		//console.log();
		res.status(500).json({ message: "Internal server error", error: e });
	}
};


const createOrder = async (req, res) => {
	const { input, details } = req.body;
	try {
		const [data] = await db.execute("CALL Order_Calculate(?,?, @Message_EN, @Message_TH, @Freight_Cost, @Message_EN_OK, @Message_TH_OK)", [input.order_id, input.user]);
		const [results] = await db.execute("SELECT @Message_EN AS Message_EN, @Message_TH AS Message_TH, @Freight_Cost AS Freight_Cost, @Message_EN_OK AS Message_EN_OK, @Message_TH_OK AS Message_TH_OK");

		const resultData = results[0];
		if (resultData.Message_EN !== null && resultData.Message_EN !== "Freight OK") {
			res.status(200).json({ success: false, results: results, message: resultData.Message_EN });
		} else {
			// Send success response
			res.status(200).json({ success: true, order_id: input.order_id });
		}

	} catch (e) {
		res.status(500).json({ message: "Internal server error", error: e.message });
	}
};


const addOrderInput = async (req, res) => {
	const { input, details } = req.body;
	//console.log(req.body);
	try {
		const [isExist] = await db.execute(
			"SELECT * FROM orders WHERE Order_ID = ?",
			[input.order_id || null]
		);

		let data = null;
		let query = "";
		const params = {
			brand_id: input.brand_id || null,
			client_id: input.client_id || null,
			quote_id: input.quote_id || null,
			loading_location: input.loading_location || 1,
			consignee_id: input.consignee_id || null,
			destination_port_id: input.destination_port_id || null,
			liner_id: input.liner_id || null,
			from_port_: input.from_port_ || null,
			fx_id: input.fx_id || null,
			fx_rate: input.fx_rate || 0,
			Freight_provider_: input.Freight_provider_ || null,
			Clearance_provider: input.Clearance_provider || null,
			Transportation_provider: input.Transportation_provider || null,
			mark_up: input.mark_up || 0,
			rebate: input.rebate || 0,
			palletized: input.palletized ? "YES" : "NO",
			Chamber: input.Chamber ? "YES" : "NO",
			load_date: input.load_date || null,
			order_id: input.order_id || null,
			created: input.created || null,
			user: input.user || 6,
		};
		//console.log(params);

		if (!isExist.length) {

			query = `INSERT INTO orders (Order_ID, Order_Number, Brand_id,
			Shipment_ref, Client_id, loading_location,
			Consignee_ID, Destination_Port, Liner_ID, Origin_Port,
			FX_ID, O_FX_Rate, O_Freight_Provider, O_Clearance_Provider,
			O_Transportation_Provider, O_Markup, O_Rebate, palletized,
			Chamber, load_date, created, updated,
			user, Status) VALUES
			(:order_id, NULL, :brand_id,
			NULL, :client_id, :loading_location,
			:consignee_id, :destination_port_id, :liner_id, :from_port_,
			:fx_id, :fx_rate, :Freight_provider_, :Clearance_provider,
			:Transportation_provider, :mark_up, :rebate, :palletized,
			:Chamber, :load_date, :created, current_timestamp(),
			:user, '0')`;
		} else {
			query = `UPDATE orders SET
			Brand_id = :brand_id,
			Client_id = :client_id,
			loading_location = :loading_location,
			Consignee_ID = :consignee_id,
			Destination_Port = :destination_port_id,
			Liner_ID = :liner_id,
			Origin_Port = :from_port_,
			FX_ID = :fx_id,
			O_FX_Rate = :fx_rate,
			O_Freight_Provider = :Freight_provider_,
			O_Clearance_Provider = :Clearance_provider,
			O_Transportation_Provider = :Transportation_provider,
			O_Markup = :mark_up,
			O_Rebate = :rebate,
			palletized = :palletized,
			Chamber = :Chamber,
			load_date = :load_date,
			created = :created,
			updated = current_timestamp()
			WHERE Order_ID = :order_id`.trim();
		}

		const [data2] = await db.execute(query, params);
		data = isExist.length ? { insertId: isExist[0].Order_ID } : data2;
		let i;
		if (!details.od_id) {
			const [rows] = await db.query(
				"SET @p6='';CALL Order_Details_Insert(?, ?, ?, ?, ?, @p5, ?, ?); SELECT @p5 AS od_id",
				[
					details.ITF || null,
					details.itf_quantity || null,
					details.itf_unit || null,
					details.brand_id || null,
					input.user || 6,
					details.adjusted_price || null,
					data.insertId || null,
				]
			);
			await db.execute("CALL Order_Calculate(?,?, @Message_EN, @Message_TH, @Freight_Cost, @Message_EN_OK, @Message_TH_OK)", [data.insertId, input.user]);
			const [results] = await db.execute(
				"SELECT @Message_EN AS Message_EN, @Message_TH AS Message_TH, @Freight_Cost AS Freight_Cost, @Message_EN_OK AS Message_EN_OK, @Message_TH_OK AS Message_TH_OK"
			);

			// Access the first row of the results
			const resultData = results[0];

			// Check the Message_EN output parameter for any errors
			if (resultData.Message_EN !== null && resultData.Message_EN !== "Freight OK") {
				return res.status(200).json({ success: false, results: results, message: resultData.Message_EN, order_id: data.insertId });
			}
			i = rows;
		} else {
			await db.execute(
				`UPDATE order_details SET
				ITF = :ITF,
				OD_QTY = :itf_quantity,
				OD_Unit = :itf_unit,
				OD_Brand = :brand,
				OD_OP = :adjusted_price WHERE OD_ID = :od_id`,
				{
					od_id: details.od_id || null,
					ITF: details.ITF || null,
					itf_quantity: details.itf_quantity || null,
					itf_unit: details.itf_unit || null,
					brand: details.brand_id,
					adjusted_price: details.adjusted_price || null,
				}
			);

			await db.execute("CALL Order_Details_Update(?,?,?)", [details.od_id, details.adjusted_price || null, input.user]);

			await db.execute("CALL Order_Calculate(?,?, @Message_EN, @Message_TH, @Freight_Cost, @Message_EN_OK, @Message_TH_OK)", [input.order_id, input.user]);
			const [results] = await db.execute(
				"SELECT @Message_EN AS Message_EN, @Message_TH AS Message_TH, @Freight_Cost AS Freight_Cost, @Message_EN_OK AS Message_EN_OK, @Message_TH_OK AS Message_TH_OK"
			);

			// Access the first row of the results
			const resultData = results[0];

			// Check the Message_EN output parameter for any errors
			if (resultData.Message_EN !== null && resultData.Message_EN !== "Freight OK") {
				return res.status(200).json({ success: false, results: results, message: resultData.Message_EN, order_id: data.insertId });
			}
			i = details.od_id;
		}

		db.execute("CALL New_order_with_id(?)", [
			data.insertId || input.order_id,
		]);

		//await db.execute("CALL new_Order_number");

		res.status(200).json({ data, i, order_id: data.insertId });
	} catch (e) {
		res.status(500).json({ message: "Internal server error", error: e.message });
	}
}

const updateOrder = async (req, res) => {
	const { input, details } = req.body;
	//console.log(input);
	try {
		const [data] = await db.execute(
			`UPDATE orders SET Brand_id = :brand_id,
			Client_id = :client_id, loading_location = :loading_location,
			Consignee_ID = :consignee_id, Destination_Port = :destination_port_id,
			Liner_ID = :liner_id, Origin_Port = :from_port_,
			FX_ID = :fx_id, O_FX_Rate = :fx_rate,
			O_Freight_Provider = :Freight_provider_, O_Clearance_Provider = :Clearance_provider,
			O_Transportation_Provider = :Transportation_provider, O_Markup = :mark_up,
			O_Rebate = :rebate, palletized = :palletized,
			Chamber = :Chamber, load_date = :load_date,
			updated = current_timestamp()
			WHERE orders.Order_ID = :order_id LIMIT 1`,
			{
				brand_id: input.brand_id || null,
				client_id: input.client_id || null,
				loading_location: input.loading_location || null,
				consignee_id: input.consignee_id || null,
				destination_port_id: input.destination_port_id || null,
				liner_id: input.liner_id || null,
				from_port_: input.from_port_ || null,
				fx_id: input.fx_id || null,
				fx_rate: input.fx_rate || 0,
				Freight_provider_: input.Freight_provider_ || null,
				Clearance_provider: input.Clearance_provider || null,
				Transportation_provider: input.Transportation_provider || null,
				mark_up: input.mark_up || 0,
				rebate: input.rebate || 0,
				palletized: input.palletized ? "YES" : "NO",
				Chamber: input.Chamber ? "YES" : "NO",
				load_date: input.load_date || null,
				order_id: input.order_id || null,
			}
		);

		// db.execute(`CALL New_order_with_id(${input.order_id})`);
		const [datas] = await db.execute("CALL Order_Calculate(?,?, @Message_EN, @Message_TH, @Freight_Cost, @Message_EN_OK, @Message_TH_OK)", [input.order_id, input.user])
		const [results] = await db.execute("SELECT @Message_EN AS Message_EN, @Message_TH AS Message_TH, @Freight_Cost AS Freight_Cost, @Message_EN_OK AS Message_EN_OK, @Message_TH_OK AS Message_TH_OK");
		//console.log(data);
		const resultData = results[0]
		if (resultData.Message_EN !== null && resultData.Message_EN !== "Freight OK") {
			res.status(200).json({ success: false, results: results, message: resultData.Message_EN });
		}
		else {
			const [order_details] = await db.execute(
				`SELECT orders.Order_Number, orders.Client_id, orders.Consignee_ID, orders.Shipment_ref, DATE_FORMAT(orders.created, '%d/%m/%Y') as created, DATE_FORMAT(orders.load_date, '%d/%m/%Y') as load_date, clients.client_name, consignee.consignee_name, users.name FROM orders
				INNER JOIN consignee ON orders.Consignee_ID = consignee.consignee_id
				INNER JOIN clients ON clients.client_id = orders.Client_id
				INNER JOIN users ON users.id = orders.user
				WHERE orders.Order_ID  = '${input.order_id}'`
			);
			//console.log(order_details);
			let title = 'Order Updated';
			let body = `Order has been updated on Siam Eats.
				Order Number: ${order_details[0].Order_number}
				Order Date: ${order_details[0].created}
				TTR REF: ${order_details[0].Shipment_ref}
				Client Name: ${order_details[0].client_name}
				Consignee Name: ${order_details[0].consignee_name}
				Load Date: ${order_details[0].load_date}
				Created by: ${order_details[0].name}`;

			const [notification_id] = await db.execute(
				`SELECT * FROM notification_details WHERE notify_on = '${8}' and client='${order_details[0].Client_id}' and consignee='${order_details[0].Consignee_ID}'`
			);
			//console.log(notification_id.length);
			if (notification_id.length > 0) {
				const [notification_msg] = await db.execute(
					`SELECT notification_name, notification_message FROM notification_messages WHERE id = '${notification_id[0].notification_id}'`
				);

				const [notification_users] = await db.execute(
					`SELECT notifications.user, users.email FROM notifications
					LEFT JOIN users on users.id=notifications.user 
					WHERE notification_id = '${notification_id[0].notification_id}'`
				);

				notification_users.forEach(item => {
					db.execute(
						"INSERT INTO notification_history (notification_id, user_id, order_id, title, messages) VALUES (?, ?, ?, ?, ?)",
						[
							notification_id[0].notification_id,
							item.user,
							input.order_id,
							title,
							body
						]
					);
					let Email = item.email;  // mobappssolutions174@gmail.com
					let mailSubject = "Order Updated";
					let content = `<!DOCTYPE html>
					<html lang="en">
					<head>
						<meta charset="UTF-8">
						<meta name="viewport" content="width=device-width, initial-scale=1.0">
						<style>
							body {
								font-family: Arial, sans-serif;
								margin: 0;
								padding: 20px;
								background-color: #f4f4f4;
							}
							.container {
								background-color: white;
								padding: 20px;
								border-radius: 10px;
								box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
								max-width: 600px;
								margin: auto;
							}
							.header {
								background-color: #4CAF50;
								padding: 10px;
								border-radius: 10px 10px 0 0;
								text-align: center;
							}
							.header img {
								max-width: 150px;
							}
							.content {
								padding: 20px;
							}
							.footer {
								text-align: center;
								margin-top: 20px;
								font-size: 12px;
								color: gray;
							}
							.footer a {
								color: #4CAF50;
								text-decoration: none;
							}
						</style>
					</head>
					<body>
						<div class="container">
							<div class="header">
								<img src="https://terp.siameats.net/api/images/white_logo.png" alt="Siam Eats Logo">
							</div>
							<div class="content">
								<p>Hello,</p>
								<p>Order has been updated on Siam Eats. Please find the details below:</p>
								<h3>Order Information:</h3>
								<p>
								<strong>Order Number:</strong> ${order_details[0].Order_Number}<br>
								<strong>Order Date:</strong> ${order_details[0].created}<br>
								<strong>TTR REF:</strong> ${order_details[0].Shipment_ref}<br>
								<strong>Client Name:</strong> ${order_details[0].client_name}<br>
								<strong>Consignee Name:</strong> ${order_details[0].consignee_name}<br>
								<strong>Load Date:</strong> ${order_details[0].load_date}<br>
								<strong>Created by:</strong> ${order_details[0].name}</p>
							</div>
							<div class="footer">
								<p>If you need to manage the order, please <a href="https://siameats.com/app.terp.com/">log in to the admin portal</a>.</p>
								<p><strong>Siam Eats</strong><br>Providing you with the best culinary experiences.</p>
								<p>This is an automated message, please do not reply.</p>
							</div>
						</div>
					</body>
					</html>`;

					sendMail(Email, mailSubject, content);
				});
			} else {
				console.log("No notifications found for this client and consignee.");
				//return;
			}

			res.status(200).json({ success: true, data: input.order_id });
		}

	} catch (e) {
		res.status(500).json({ message: "Internal server error", error: e.message });
	}
};


const deleteOrderDetails = async (req, res) => {
	const { id } = req.body
	try {
		const data = await db.execute("DELETE FROM order_details WHERE OD_ID = ?", [
			id,
		])
		/* await db.execute("DELETE FROM order_details_input WHERE od_id = ?", [id])
		res.status(200).json({ data }) */
		res.status(200).json({ success: true, data })
	} catch (e) {
		res.status(500).json({ message: "Internal server error", error: e })
	}
}

const newCalculateOrder = async (req, res) => {
	const { input, details } = req.body
	//console.log(req.body);
	try {
		const [data] = await db.execute(
			`UPDATE orders SET Brand_id = :brand_id,
			Client_id = :client_id, loading_location = :loading_location,
			Consignee_ID = :consignee_id, Destination_Port = :destination_port_id,
			Liner_ID = :liner_id, Origin_Port = :from_port_,
			FX_ID = :fx_id, O_FX_Rate = :fx_rate,
			O_Freight_Provider = :Freight_provider_, O_Clearance_Provider = :Clearance_provider,
			O_Transportation_Provider = :Transportation_provider, O_Markup = :mark_up,
			O_Rebate = :rebate, palletized = :palletized,
			Chamber = :Chamber, load_date = :load_date,
			updated = current_timestamp()
			WHERE orders.Order_ID = :order_id LIMIT 1`,
			{
				brand_id: input.brand_id || null,
				client_id: input.client_id || null,
				loading_location: input.loading_location || null,
				consignee_id: input.consignee_id || null,
				destination_port_id: input.destination_port_id || null,
				liner_id: input.liner_id || null,
				from_port_: input.from_port_ || null,
				fx_id: input.fx_id || null,
				fx_rate: input.fx_rate || 0,
				Freight_provider_: input.Freight_provider_ || null,
				Clearance_provider: input.Clearance_provider || null,
				Transportation_provider: input.Transportation_provider || null,
				mark_up: input.mark_up || 0,
				rebate: input.rebate || 0,
				palletized: input.palletized ? "YES" : "NO",
				Chamber: input.Chamber ? "YES" : "NO",
				load_date: input.load_date || null,
				order_id: input.order_id || null,
			}
		);
		await db.execute("CALL Order_Calculate(?,?, @Message_EN, @Message_TH, @Freight_Cost, @Message_EN_OK, @Message_TH_OK)", [input.order_id, input.user])
		const [results] = await db.execute("SELECT @Message_EN AS Message_EN, @Message_TH AS Message_TH, @Freight_Cost AS Freight_Cost, @Message_EN_OK AS Message_EN_OK, @Message_TH_OK AS Message_TH_OK");
		//console.log(data);
		const resultData = results[0]
		if (resultData.Message_EN !== null && resultData.Message_EN !== "Freight OK") {
			res.status(200).json({ success: false, results: results, message: resultData.Message_EN });
		}
		else {
			res.status(200).json({ success: true, data: input.order_id })
		}

	} catch (e) {
		res.status(500).json({ message: "Internal server error", error: e.message })
	}
}

const calculateOrder = async (req, res) => {
	const { details, input } = req.body

	try {
		const [data] = await db.execute(
			/*sql*/ `INSERT INTO orders (Order_ID, Order_Number, Brand_id,
		Shipment_ref, Quotation_ID, Client_id, loading_location,
		Consignee_ID, Destination_Port, Liner_ID, Origin_Port,
		FX_ID, O_FX_Rate, O_Freight_Provider, O_Clearance_Provider,
		O_Transportation_Provider, 	O_Markup, O_Rebate, palletized,
		Chamber, load_date, created, updated,
		user, Status) VALUES
		(NULL, NULL, ?,
		NULL, ?, ?, ?,
		?, ?, ?, ?,
		?, ?, ?, ?,
		?, ?, ?, ?,
		?, ?, ?, current_timestamp(),
		NULL, '0')`,
			[
				input.brand_id,
				input.quote_id,
				input.client_id,
				input.loading_location,
				input.consignee_id,
				input.destination_port_id,
				input.liner_id,
				input.from_port_,
				input.fx_id,
				input.fx_rate,
				input.Freight_provider_,
				input.Clearance_provider,
				input.Transportation_provider,
				input.mark_up || 0,
				input.rebate || 0,
				input.palletized ? "YES" : "NO",
				input.Chamber ? "YES" : "NO",
				input.load_date,
				input.created,
			],
		)
		const detialsId = []
		for (const d of details) {
			const [i] = await db.execute(
				"INSERT INTO `order_details_input` (ITF, Order_id, itf_quantity, itf_unit) VALUES (?, ?, ?, ?)",
				[d.ITF, data.insertId, d.itf_quantity, d.itf_unit],
			)
			detialsId.push({
				data: {},
				qdi: i.insertId,
			})
		}
		if (data.insertId) {
			await db.execute("CALL New_order_with_id(?)", [data.insertId])
		}
		Promise.all(
			detialsId.map(async (d, i) => {
				const [detailsResult] = await db.query(
					"SELECT * FROM `order_details` WHERE `OD_ID ` = ? LIMIT 1",
					[d.qdi],
				)
				const [cost] = await db.query(
					"SELECT * FROM `order_costs` WHERE `od_id` = ? LIMIT 1",
					[d.qdi],
				)
				const [qodbox] = await db.query(
					"SELECT odbox(?) AS odbox, od_nw(?) AS od_nw;",
					[d.qdi, d.qdi],
				)
				detialsId[i].data = {
					...detailsResult[0],
					Number_of_boxes: qodbox[0].odbox || detailsResult[0].Number_of_boxes,
					net_weight: qodbox[0].od_nw || detailsResult[0].net_weight,
					profit_percentage: cost[0].profit_percentage,
				}
			}),
		)
		await db.execute(
			"DELETE FROM `order_financials` WHERE `Order_id` = ? LIMIT 1",
			[0],
		)
		await db.execute("DELETE FROM `order_details_input` WHERE Order_id = ?", [
			data.insertId,
		])
		await db.execute("DELETE FROM `orders` WHERE Order_ID = ?", [data.insertId])
		res.status(200).json({ message: "Success", data: detialsId })
	} catch (e) {
		res.status(500).json({ message: "Internal server error", error: e })
	}
}

const doOrderPacking = async (req, res) => {
	const data = req.body;
	try {
		// First, check the status in the order_details table
		const [orderStatusResult] = await db.execute(
			"SELECT status FROM order_details WHERE OD_ID  = ?",
			[data.od_id]
		);

		if (!orderStatusResult || orderStatusResult.length === 0) {
			return res.status(400).json({ message: "Order not found." });
		}

		const orderStatus = orderStatusResult[0].status;

		// If status is 0, fetch error message with id 21 and return an error response
		if (orderStatus === 0) {
			const [errorMessageResult] = await db.execute(
				"SELECT Error_en as message, Error_th as message2 FROM Error_Messages WHERE error_id = 21"
			);

			return res.status(400).json({ message: errorMessageResult[0] });
		}

		// Continue with the rest of the functionality if status is not 0
		const params = [
			data.od_id || null,
			data.net_weight || null,
			data.ean_per_od || null,
			data.Number_of_boxes || null,
			data.bonus || null,
			data.adjusted_gw_od || null,
			data.user_id || null
		];

		await db.execute("SET @message = ''");
		await db.execute("SET @message2 = ''");
		await db.execute("SET @message3 = ''");

		const result = await db.execute(
			"CALL Order_Packing(?, ?, ?, ?, ?, ?, @message, @message2, @message3, ?)",
			params
		);

		const messagesResult = await db.execute(
			"SELECT @message AS message, @message2 AS message2, @message3 AS message3"
		);

		const anyMessageNotNull = messagesResult && messagesResult[0] && messagesResult[0][0] &&
			(messagesResult[0][0].message || messagesResult[0][0].message2 || messagesResult[0][0].message3);

		if (anyMessageNotNull) {
			const messages = messagesResult[0][0];
			return res.status(400).json({ message: messages });
		} else {
			return res.status(200).json({ message: "Success" });
		}

	} catch (e) {
		res.status(500).json({ message: "Internal server error", error: e.message });
	}
};

const getOrderSummary = async (req, res) => {
	const { quote_id } = req.query;

	try {
		// Execute the stored procedure

		const [results] = await db.query(`SELECT order_financials.*, CNF as total_THB, CNF_FX AS total_USD, Items, Order_profit_percentage, nw AS Net_Weight, gw AS Gross_weight, box AS Total_Box, cbm AS CBM, FOB, FREIGHT AS Freight, CNF, CNF_FX AS CNF_Price_FX, COMMISION AS Commission, REBATE AS Rebate, Order_profit AS Profit from order_financials where Order_id="${quote_id}"`);

		if (results.length === 0) {
			return res.status(404).json({
				message: "No data found for the provided quote_id",
			});
		}

		// Access the output parameters from the 'results' array
		const data = results[0];

		// Send the response with the data
		res.status(200).json({
			message: "Order Summary",
			data: data
		});

	} catch (e) {

		// Send the error response
		res.status(500).json({
			message: "Internal server error",
			error: e.message,
		});
	}
};


const deleteOrder = async (req, res) => {
	const { id, user_id, NOTES } = req.body
	try {
		const [data] = await db.execute("CALL Order_Delete(?,@Message_EN, @Message_TH,?,?)", [id, user_id, NOTES || " "])
		const [results] = await db.execute("SELECT @Message_EN AS Message_EN, @Message_TH AS Message_TH");
		const msg = results[0];

		if (msg.Message_EN !== null) {
			res.status(200).json({ success: false, message: msg })
		}
		else {
			res.status(200).json({ success: true, message: "success", data: data })
		}

	} catch (e) {
		res.status(500).json({ message: "Internal server error", error: e.message })
	}
}

const updateOrderFreight = async (req, res) => {
	const {
		order_id,
		Liner,
		bl,
		Load_date,
		Load_time,
		Ship_date,
		ETD,
		Arrival_date,
		journey_number,
		ETA,
	} = req.body
	//console.log(req.body);
	if (!order_id)
		return res.status(400).json({ message: "Order id is required" })
	try {
		const [data] = await db.query(
			"SELECT order_id FROM order_freight_details WHERE order_id = ?",
			[order_id],
		)
		if (data.length > 0) {
			await db.execute(
				`UPDATE order_freight_details SET
				Liner = ?,
				bl = ?,
				Load_date = ?,
				Load_time = ?,
				Ship_date = ?,
				ETD = ?,
				Arrival_date = ?,
				journey_number = ?,
				ETA = ? WHERE order_id = ?`,
				[
					Liner,
					bl,
					Load_date,
					Load_time,
					Ship_date,
					ETD,
					Arrival_date,
					journey_number,
					ETA,
					order_id,
				],
			)
		} else {
			await db.execute(
				"INSERT INTO order_freight_details (order_id, Liner, bl, Load_date, Load_time, Ship_date, ETD, Arrival_date, ETA,journey_number) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?,?)",
				[
					order_id,
					Liner,
					bl,
					Load_date,
					Load_time,
					Ship_date,
					ETD,
					Arrival_date,
					ETA,
					journey_number,
				],
			)
		}
		res.status(200).json({ message: "success" })
	} catch (e) {
		res.status(500).json({ message: "Internal server error", error: e })
	}
}

const aslWastage = async (req, res) => {
	const { sortingid, adjustqty, crates, user_id } = req.body
	//console.log(req.body);
	try {
		const [data] = await db.execute("CALL asl_wastage(?,?,?,?)", [
			sortingid,
			adjustqty,
			crates,
			user_id
		])
		res.status(200).json({ message: "success", data })
	} catch (e) {
		res.status(500).json({ message: "Internal server error", error: e })
	}
}

const RestoreOrderPacking = async (req, res) => {
	try {
		const { opid, user_id } = req.body;

		// Call the stored procedure to restore order packing
		const [results] = await db.execute(`CALL restore_order_packing(${opid}, @checkMessage)`);

		// Fetch the check message
		const [checkMessageResult] = await db.execute("SELECT @checkMessage AS checkMessage");
		const checkMessage = checkMessageResult.length > 0 ? checkMessageResult[0].checkMessage : null;

		if (checkMessage !== null) {
			// If check message is not null, show the check message
			res.status(200).send({
				success: false,
				message: checkMessage
			});
		} else {
			const [data] = await db.execute(
				`INSERT INTO Transaction_records (Transaction_description, Transaction_ref, USER) VALUES(?,?,?)`,
				[
					"Restore Order Packing",
					opid,
					user_id
				],
			)
			// If check message is null, show the success message
			const [successmessages] = await db.execute(
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
			message: error.message
		});
	}
};


const RecalculateOrder = async (req, res) => {
	try {

		const { order_id, user_id } = req.body;
		await db.execute(`CALL Order_Pricing_Reset(${order_id}, ${user_id})`)

		res.status(200).send({
			success: true,
			message: "Recalculate Successfully"
		})

	} catch (error) {
		res.status(500).send({
			success: false,
			message: error.message
		})
	}
}

const getOrderPacking = async (req, res) => {
	const { order_id, od_id } = req.body;
	//console.log(req.body);
	try {
		const [data] = await db.execute(
			"SELECT * FROM `order_packing` WHERE `order_id` = ? and `od_id`=?",
			[order_id, od_id],
		)
		res.status(200).json({
			message: "Get Order Packing",
			data: data[0],
		})
	} catch (e) {
		res.status(400).json({
			message: "Error Occured",
			error: e,
		})
	}
}

const CompanyAddress = async (req, res) => {
	try {
		const [data] = await db.execute(
			"SELECT * FROM `Company_Address` WHERE `ID` = ?",
			[3],
		)
		res.status(200).json({
			message: "Get Order Packing",
			data: data[0],
		})
	} catch (e) {
		res.status(400).json({
			message: "Error Occured",
			error: e,
		})
	}
}

const invoiceDetailsList = async (req, res) => {
	try {
		const { role, userId } = req.query;
		//console.log(req.query);

		let sql = `
			SELECT Invoices.*, 
			       clients.client_address, 
			       consignee.consignee_address,
			       clients.client_tax_number,
			       clients.client_email,
			       clients.client_phone,
			       consignee.consignee_tax_number, 
			       consignee.consignee_email,
			       consignee.consignee_phone,
			       setup_liner.liner_name AS Airline,  
			       setup_liner.liner_code AS Airline_liner_code,
			       setup_ports.port_name AS Airport,
			       setup_ports.port_country,
			       setup_ports.IATA_code AS Airport_IATA_code, 
			       dropdown_currency.currency AS currency, 
			       orders.O_Markup, 
			       orders.Customer_ref,  
			       order_freight_details.bl, 
			       order_freight_details.Ship_date, 
			       order_freight_details.Load_date AS load_date
			FROM Invoices 
			INNER JOIN order_freight_details ON order_freight_details.order_id = Invoices.order_id
			INNER JOIN orders ON orders.Order_ID = Invoices.order_id
			INNER JOIN clients ON clients.client_id = orders.Client_id
			INNER JOIN consignee ON consignee.consignee_id = orders.Consignee_ID
			INNER JOIN setup_ports ON setup_ports.port_id = orders.Destination_Port
			INNER JOIN setup_liner ON setup_liner.liner_id = orders.Liner_ID
			INNER JOIN dropdown_currency ON dropdown_currency.currency_id = Invoices.fx_id
		`;

		if (role === 'Client') {
			sql += ` WHERE Invoices.Client_ID = ?`;
		} else if (role === 'Consignee') {
			sql += ` WHERE Invoices.Consignee_id = ?`;
		}

		sql += ` ORDER BY Invoices.invoice_id DESC`;

		const [data] = await db.query(sql, [userId]);

		res.status(200).json({
			message: "Invoice list retrieved successfully.",
			data: data,
		});
	} catch (e) {
		res.status(400).json({
			message: "An error occurred while retrieving the invoice list.",
			error: e.message,
		});
	}
};


const GetOrderPdfDetails = async (req, res) => {
	try {
		const { order_id } = req.body;

		const [CompanyAddress] = await db.execute(
			"SELECT * FROM `Company_Address` WHERE `ID` = ?",
			[3],
		)

		const Company_Address = CompanyAddress[0];
		if (Company_Address) {
			Company_Address.logo = "https://terp.siameats.net/api/images/" + Company_Address.logo;
		}

		const [orderResults] = await db.execute(`
            SELECT 
			    FX_ID,
                Order_Number,
                load_date,
                Shipment_ref,
                Client_id,
                Consignee_ID
            FROM 
                orders
            WHERE 
                Order_ID = ?
        `, [order_id]);

		if (orderResults.length === 0) {
			return res.status(404).json({ message: 'No data found for the provided order_id' });
		}

		// Fetch data from clients table
		const [clientResults] = await db.execute(`
            SELECT 
                client_name,
                client_address
            FROM 
                clients
            WHERE 
                client_id = ?
        `, [orderResults[0].Client_id]);

		const [consigneeResults] = await db.execute(`
            SELECT 
                consignee_name,
                consignee_address
            FROM 
                consignee
            WHERE 
                consignee_id = ?
        `, [orderResults[0].Consignee_ID]);

		const [currencyResults] = await db.execute(`
            SELECT 
                currency
            FROM 
                dropdown_currency
            WHERE 
                currency_id = ?
        `, [orderResults[0].FX_ID]);

		const [freightDetailsResults] = await db.execute(`
			SELECT 
				bl AS awb,
				journey_number AS journey,
				ship_date
			FROM 
				order_freight_details
			WHERE 
				order_id = ?
		`, [order_id]);

		const sql1 = `SELECT PDF_Customs_GW_Orders(${order_id}) AS GW`;
		const [rows1] = await db.query(sql1);

		res.status(200).json({
			message: "PDF Details",
			//data: data,
			Company_Address: Company_Address,
			orderResults: orderResults[0],
			clientResults: clientResults[0],
			consigneeResults: consigneeResults[0],
			currencyResults: currencyResults[0],
			freightDetailsResults: freightDetailsResults[0],
			gw: rows1[0].GW
		});
	} catch (e) {
		res.status(400).json({
			message: "Error Occurred",
			error: e.message,
		})
	}
}


const OrderPdfDetails = async (req, res) => {
	try {
		const { order_id } = req.body;

		const [CompanyAddress] = await db.execute(
			"SELECT * FROM `Company_Address` WHERE `ID` = ?",
			[3],
		)
		const Company_Address = CompanyAddress[0];
		if (Company_Address) {
			Company_Address.logo = "https://terp.siameats.net/api/images/" + Company_Address.logo;
		}
		const [data] = await db.execute("CALL Order_packing_details_PDF(?)", [order_id]);
		const Alldata = data[0];

		const [heading] = await db.execute(
			"SELECT DATE_FORMAT(Load_date, '%d-%m-%Y') as Load_date, Load_time, bl FROM `order_freight_details` WHERE `order_id` = ?",
			[order_id],
		)
		const [orderDetails] = await db.query(
			"SELECT journey_number, bl, DATE_FORMAT(Ship_date, '%d-%m-%Y') AS Ship_date FROM order_freight_details WHERE order_id = ?",
			[order_id]
		);
		res.status(200).json({
			message: "PDF Details",
			result: heading[0],
			data: Alldata,
			Company_Address: Company_Address,
			orderDetails: orderDetails
		});
	} catch (e) {
		res.status(400).json({
			message: "Error Occurred",
			error: e,
		})
	}
}

const InvoicePdfDetails = async (req, res) => {
	try {
		const { invoice_id, order_id } = req.body;

		const [CompanyAddress] = await db.execute(
			"SELECT * FROM `Company_Address` WHERE `ID` = ?",
			[3]
		);

		const [Invoice] = await db.execute(
			"SELECT * FROM `Invoices` WHERE `Invoice_id` = ?",
			[invoice_id]
		);

		const Company_Address = CompanyAddress[0];
		if (Company_Address) {
			Company_Address.logo = "https://terp.siameats.net/api/images/" + Company_Address.logo;
		}

		const [InvoiceDetails] = await db.execute(
			`SELECT * 
   FROM Invoice_details 
   WHERE Invoice_id = ? 
   ORDER BY
     Invoice_details.Invoice_id,
     CAST(itf_classification_ID(Invoice_details.ITF_ID) AS INT),
     PDF_Customs_Produce_Name_ITF(Invoice_details.ITF_ID),
     (Invoice_details.net_weight / Invoice_details.Number_of_boxes)`,
			[invoice_id]
		);

		const [Invoicetotal] = await db.execute(
			`SELECT 
				itf_quantity,
				IFNULL(Dummy_price, Final_Price) AS Effective_Price,
				IFNULL(Dummy_price, Final_Price) * itf_quantity AS Calculated_Total
			FROM Invoice_details
			WHERE Invoice_id = ?`,
			[invoice_id]
		);

		const invoice_total = Invoicetotal.reduce((sum, item) => {
			const calculatedTotal = Number(item.Calculated_Total);
			if (!isNaN(calculatedTotal)) {
				return sum + calculatedTotal;
			}
			return sum;
		}, 0);

		InvoiceDetails.forEach(element => {
			element.net_weight = Number(element.net_weight).toFixed(3);
			element.Number_of_boxes = parseInt(element.Number_of_boxes);
			element.Line_Total = element.Final_Price * element.itf_quantity;
		});

		const promises = InvoiceDetails.map(async (element) => {
			const [ConsigneeCustomizeDetails] = await db.query(
				`SELECT ConsigneeI as customize_consigneeI, 
							ITF as customize_ITF, 
							Custom_Name as customize_Custom_Name 
					 FROM Consignee_Customize
					 WHERE ConsigneeI = ? and ITF = ?`,
				[Invoice[0].Consignee_id, element.ITF_ID]/* [element.Consignee_id] */
			);

			if (ConsigneeCustomizeDetails.length > 0) {
				var CustomizeDetails = ConsigneeCustomizeDetails[0];
				element.customize_consigneeI = CustomizeDetails.customize_consigneeI;
				element.customize_ITF = CustomizeDetails.customize_ITF;
				element.customize_Custom_Name = CustomizeDetails.customize_Custom_Name;


			}
			const [Invoicedetails] = await db.query(
				`SELECT 
					Invoice_id,
					Dummy_price,
					Final_Price,
					IFNULL(Dummy_price, Final_Price) as Price_displaye,
					IFNULL(Dummy_price, Final_Price) * itf_quantity as final_Line_Total
				FROM Invoice_details
				WHERE od_id = ?`,
				[element.od_id] // Adjust if needed
			);
			if (Invoicedetails.length > 0) {
				var InvoiceDetail = Invoicedetails[0];
				element.Invoice_id = InvoiceDetail.Invoice_id;
				element.Dummy_price = InvoiceDetail.Dummy_price;
				element.Final_Price = InvoiceDetail.Final_Price;
				element.Price_displaye = InvoiceDetail.Price_displaye;
				element.final_Line_Total = InvoiceDetail.final_Line_Total;
			}
		});

		await Promise.all(promises);

		const [data] = await db.execute("CALL Invoice_Summery_output(?, @Items, @Net_Weight, @Gross_weight, @Total_Box, @Packages, @CBM, @FOB, @FOB2, @Freight, @CNF,@CNF_Price_FX,@Commission,@fx_Commission,@rebate,@fx_rebate,@Profit)", [invoice_id]);
		const [results] = await db.execute("SELECT @Items AS Items, @Net_Weight AS Net_Weight, @Gross_weight AS Gross_weight, @Total_Box AS Total_Box, @Packages AS Packages, @CBM AS CBM, @FOB AS FOB, @FOB2 AS FOB2, @Freight AS Freight,@CNF AS CNF,@CNF_Price_FX AS CNF_Price_FX,@Commission AS Commission,@fx_Commission AS fx_Commission,@rebate AS rebate,@fx_rebate AS fx_rebate,@Profit AS Profit");
		const TotalDetails = results[0];

		const [invoiceDetails] = await db.query(
			"SELECT journey_number, bl, DATE_FORMAT(Ship_date, '%d-%m-%Y') AS Ship_date FROM order_freight_details WHERE order_id = ?",
			[order_id]
		);
		var invoice_header = invoiceDetails[0];

		res.status(200).json({
			message: "Invoice PDF Details",
			Company_Address: Company_Address,
			InvoiceDetails: InvoiceDetails,
			TotalDetails: data[0][0],
			invoice_header: invoice_header,
			invoice_total: invoice_total
		});
	} catch (e) {
		res.status(400).json({
			message: "Error Occurred",
			error: e.message,
		});
	}
};


const GenerateInvoiceTick = async (req, res) => {
	const { order_id, fx_id, fx_rate, USER } = req.body;
	try {

		const [rows, fields] = await db.execute("CALL Generate_Invoice(?, @Check_packing_en, @Check_packing_th, @Check_AWB_en, @Check_AWB_th, @invoice_check_en, @invoice_check_th, ?)", [order_id, USER]);

		// Now, you can fetch the output parameters from the session variables
		const [results] = await db.execute("SELECT @Check_packing_en AS Check_packing_en, @Check_packing_th AS Check_packing_th, @Check_AWB_en AS Check_AWB_en, @Check_AWB_th AS Check_AWB_th, @invoice_check_en AS invoice_check_en, @invoice_check_th AS invoice_check_th");
		const TotalDetails = results[0];

		// Fetch the check messages
		const checkPackingEn = TotalDetails.Check_packing_en;
		const checkPackingTh = TotalDetails.Check_packing_th;
		const checkAWBEn = TotalDetails.Check_AWB_en;
		const checkAWBTh = TotalDetails.Check_AWB_th;
		const invoiceCheckEn = TotalDetails.invoice_check_en;
		const invoiceCheckTh = TotalDetails.invoice_check_th;

		if (checkPackingEn !== null || checkPackingTh !== null) {
			// If any packing check message is not null, send the packing check messages
			res.status(200).send({
				success: false,
				message: "Check Packing Messages",
				checkmessage: checkPackingEn,
				checkmessageTh: checkPackingTh
			});
		} else if (checkAWBEn !== null || checkAWBTh !== null) {
			// If any AWB check message is not null, send the AWB check messages
			res.status(200).send({
				success: false,
				message: "Check AWB Messages",
				checkmessage: checkAWBEn,
				checkmessageTh: checkAWBTh
			});
		} else if (invoiceCheckEn !== null || invoiceCheckTh !== null) {
			// If any invoice check message is not null, send the invoice check messages
			res.status(200).send({
				success: false,
				message: "Check Invoice Messages",
				checkmessage: invoiceCheckEn,
				checkmessageTh: invoiceCheckTh
			});
		} else {
			// If all check messages are null, send the success message
			res.status(200).send({
				success: true,
				message: "Generate Invoice Successfully"
			});
		}
	} catch (error) {
		res.status(400).json({
			message: "Error Occurred",
			error: error.message
		});
	}
};

const GetInvoicePdfDetails = async (req, res) => {
	try {
		const { invoice_id, order_id } = req.body;

		const [CompanyAddress] = await db.execute(
			"SELECT * FROM `Company_Address` WHERE `ID` = ?",
			[3],
		)

		// Now, you can access the output parameters from the 'results' array
		const [tableData] = await db.execute(
			"SELECT * FROM `Invoice_details` WHERE `Invoice_id` = ?",
			[invoice_id],
		);

		// Create an array to store promises for each query

		const promises = tableData.map(async (element) => {

			const sql1 = `SELECT ITF_HSCODE(${element.ITF_ID}) AS HS_CODE`;
			const [rows1] = await db.query(sql1);
			element.HS_CODE = rows1[0].HS_CODE;


		});

		// Wait for all queries to completeInvoicePdfDetails
		await Promise.all(promises);

		//console.log("tableData:", tableData);

		const Company_Address = CompanyAddress[0];
		if (Company_Address) {
			Company_Address.logo = "https://terp.siameats.net/api/images/" + Company_Address.logo;
		}
		// Assuming 'data' is some other data you're fetching from your application logic

		const [rows, fields] = await db.execute("CALL Invoice_Summery_output(?, @Items, @Net_Weight, @Gross_weight, @Total_Box, @Packages, @CBM, @FOB, @FOB2, @Freight, @CNF,@CNF_Price_FX,@Commission,@fx_Commission,@rebate,@fx_rebate,@Profit)", [order_id]);

		// Now, you can fetch the output parameters from the session variables
		const [results] = await db.execute("SELECT @Items AS Items, @Net_Weight AS Net_Weight, @Gross_weight AS Gross_weight, @Total_Box AS Total_Box, @Packages AS Packages, @CBM AS CBM, @FOB AS FOB, @FOB2 AS FOB2, @Freight AS Freight,@CNF AS CNF,@CNF_Price_FX AS CNF_Price_FX,@Commission AS Commission,@fx_Commission AS fx_Commission,@rebate AS rebate,@fx_rebate AS fx_rebate,@Profit AS Profit");
		const TotalDetails = results[0];
		//DATE_FORMAT(Ship_date, '%d-%m-%Y') AS Ship_date
		const [invoiceDetails] = await db.query(
			"SELECT journey_number, bl, DATE_FORMAT(Ship_date, '%d-%m-%Y') AS Ship_date FROM order_freight_details WHERE order_id = ?",
			[order_id]
		);
		var invoice_header = invoiceDetails[0];

		res.status(200).json({
			message: "Invoice PDF Details",
			Company_Address: Company_Address,
			InvoiceDetails: tableData,
			TotalDetails: TotalDetails,
			invoice_header: invoice_header
		});


	} catch (e) {
		res.status(400).json({
			message: "Error Occurred",
			error: e.message,
		})
	}
}

const GetinvoiceDetails = async (req, res) => {
	const { invoice_id } = req.query;
	try {
		const [data] = await db.query(
			`SELECT *				
			 FROM 
				 Invoice_details
			 WHERE 
				 Invoice_id = ?`,
			[invoice_id]
		);

		if (data.length === 0) {
			return res.status(400).json({ message: "Invoice not found" });
		}

		res.status(200).json({ data: data });
	} catch (e) {
		res.status(500).json({ message: "Internal server error", error: e.message });
	}
}




const getInvoiceSummary = async (req, res) => {
	const { invoice_id } = req.query;

	try {
		// Execute the stored procedure
		const [details] = await db.execute("CALL Invoice_Summery_output(?, @Items, @Net_Weight, @Gross_weight, @Total_Box, @Packages,  @CBM, @FOB, @FOB2, @Freight, @CNF, @CNF_Price_FX, @Commission, @fx_Commission, @rebate, @fx_rebate, @Profit)", [invoice_id]);
		// console.log(details);
		// Fetch the output parameters from the session variables
		const [results] = await db.execute("SELECT @Items AS Items, @Net_Weight AS Net_Weight, @Gross_weight AS Gross_weight, @Total_Box AS Total_Box, @Packages AS Packages, @CBM AS CBM, @FOB AS FOB, @FOB2 AS FOB2, @Freight AS Freight, @CNF AS CNF, @CNF_Price_FX AS CNF_Price_FX, @Commission AS Commission, @fx_Commission AS fx_Commission, @rebate AS rebate, @fx_rebate AS fx_rebate, @Profit AS Profit");

		// Ensure we have results before trying to access them
		if (results.length === 0) {
			return res.status(404).json({
				message: "No data found for the provided quote_id",
			});
		}

		// Access the output parameters from the 'results' array
		const detail = results[0];
		const data = details[0][0];
		// Send the response with the data
		res.status(200).json({
			message: "Invoice Summary",
			data: data,
			details: detail
		});

	} catch (e) {
		// Log the error for debugging
		console.error("Error fetching order summary:", e);

		// Send the error response
		res.status(500).json({
			message: "Internal server error",
			error: e.message,
		});
	}
};

const getInvoiceDeatilsTable = async (req, res) => {
	const { invoice_id } = req.query;
	try {
		const [data] = await db.query(
			`SELECT id.* 
   FROM Invoice_details id
   WHERE id.Invoice_id = ?
   ORDER BY
     id.Invoice_id,
     CAST(itf_classification_ID(id.ITF_ID) AS INT),
     PDF_Customs_Produce_Name_ITF(id.ITF_ID),
     (id.net_weight / id.Number_of_boxes)`,
			[invoice_id]
		);
		if (data.length > 0) {
			for (const element of data) {
				const sql1 = `SELECT Invoice_details_profit_percentage(${element.id_id}) AS profit_percentage`;
				const [rows1] = await db.query(sql1);
				element.Invoice_profit_percentage = rows1[0].profit_percentage;
			}
		}

		res.status(200).json({ data: data });
	}
	catch (e) {
		res.status(500).json({ message: "Internal server error", error: e.message });
	}

}

const EditInvoiceDetails = async (req, res) => {
	try {
		const { Invoice_id, id_id, unit_id, adjusted_price } = req.body;
		//console.log(req.body);
		// Validate input
		if (!id_id) {
			return res.status(400).json({ message: "id_id is required" });
		}
		if (!Invoice_id) {
			return res.status(400).json({ message: "Invoice_id is required" });
		}

		// Update `box_id` if provided
		if (unit_id) {
			await db.execute("UPDATE Invoice_details SET Unit_id = ? WHERE id_id = ?", [unit_id, id_id]);
		}

		// Update `adjusted_price` if provided
		if (adjusted_price) {
			await db.execute("UPDATE Invoice_details SET adjusted_price = ? WHERE id_id = ?", [adjusted_price, id_id]);
		}

		// Call the stored procedure regardless of the update operations
		await db.execute("CALL Invoice_Details_Update(?)", [id_id]);
		await db.execute("CALL Update_Invoice(?)", [Invoice_id]);
		// Send a success response
		res.status(200).json({ message: "Invoice updated successfully" });

	} catch (error) {
		//console.error('Error updating invoice details:', error);
		res.status(500).json({
			message: "Internal server error",
			error: error.message
		});
	}
}

const orderPdfTable = async (req, res) => {
	try {
		const { order_id } = req.body;
		// itf.itf_name_th as itf_th,
		const [tableData] = await db.execute(
			`SELECT 
     order_details.OD_FOB AS FOB, 
     order_details.ITF, 
     order_details.HS_Code AS HS_CODE, 
     order_details.OD_Unit, 
     dropdown_unit_count.unit_name_en AS Unit, 
     itf.itf_name_en, 
     order_details.OD_NW AS Net_Weight, 
     order_details.OD_ID, 
     ROUND(order_details.OD_Box) AS Boxes 
   FROM 
     order_details
   INNER JOIN 
     itf ON itf.itf_id = order_details.ITF
   INNER JOIN 
     dropdown_unit_count ON dropdown_unit_count.unit_id = order_details.OD_Unit
   WHERE 
     order_details.Order_ID = ?
   ORDER BY
     order_details.Order_ID,
     CAST(itf_classification_ID(order_details.ITF) AS INT),
     PDF_Customs_Produce_Name_ITF(order_details.ITF),
     (order_details.OD_NW / order_details.OD_Box)`,
			[order_id]
		);

		// Loop through each element and execute queries sequentially
		for (let element of tableData) {
			/* const sqlFOB = 'CALL PDF_Order_details_FOB(?)';
			const [rowsFOB] = await db.query(sqlFOB, [element.od_id]);
			element.FOB = rowsFOB[0][0].FOB; */
			//console.log(rowsFOB);
			//element.FOB = rows[0].FOB;

			const sql1 = `SELECT PDF_Customs_Produce_Name_ITF(${element.ITF}) AS ITF_Name`;
			const [rows1] = await db.query(sql1);
			element.itf_th = rows1[0].ITF_Name;

			const sql = `SELECT ITF_HSCODE(${element.ITF}) AS HS_CODE`;
			const [rows] = await db.query(sql);
			element.HS_CODE = rows[0].HS_CODE;
		}

		res.status(200).json({ results: tableData, message: "Invoice  successfully" });
	} catch (error) {
		res.status(500).json({
			message: "Internal server error",
			error: error.message
		});
	}
}


const getOrderFinancials = async (req, res) => {
	const { order_id } = req.query;

	if (!order_id) {
		return res.status(400).json({ message: 'order_id query parameter is required' });
	}

	try {
		// Fetch data from  and order_details tables
		const [orderSummaryResults] = await db.execute(`
            SELECT 
                fob,
                cnf
            FROM 
                order_summery
            WHERE 
                order_id = ?
        `, [order_id]);

		// Send the response with the data
		res.status(200).json({
			message: 'Order Financials',
			data: orderSummaryResults[0]
		});
	} catch (e) {
		// Log the error for debugging
		console.error('Error fetching order financials:', e);

		// Send the error response
		res.status(500).json({
			message: 'Internal server error',
			error: e.message,
		});
	}
};

// Helper function to round numbers
function round(value, decimals) {
	return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);
}


const invoiceLoader = async (req, res) => {
	const { Invoice_id } = req.body;

	if (!Invoice_id) {
		return res.status(400).json({ message: 'Invoice id query parameter is required' });
	}

	try {
		// Fetch data from new_order_costs and order_details tables
		const sqlFOB = 'CALL Invoice_Loaded(?)';
		const [rows] = await db.query(sqlFOB, [Invoice_id]);
		// Send the response with the data
		res.status(200).json({
			message: 'Order Loaded successfully',
			data: rows
		});
	} catch (e) {
		// Log the error for debugging
		console.error('Error fetching order:', e);

		// Send the error response
		res.status(500).json({
			message: 'Internal server error',
			error: e.message,
		});
	}
};

const InvoiceAdjustWeight = async (req, res) => {
	const { Invoice_id, Port_weight } = req.body;

	if (!Invoice_id) {
		return res.status(400).json({ message: 'Invoice id query parameter is required' });
	}

	try {
		// Fetch data from new_order_costs and order_details tables
		const sqlFOB = 'CALL Invoice_adjust_weight(?, ?)';
		const [rows] = await db.query(sqlFOB, [Invoice_id, Port_weight]);
		// Send the response with the data
		res.status(200).json({
			message: 'invoice Weight Adjuseted successfully',
			data: rows
		});
	} catch (e) {
		// Log the error for debugging
		console.error('Error fetching order:', e);

		// Send the error response
		res.status(500).json({
			message: 'Internal server error',
			error: e.message,
		});
	}
};

const InvoiceShipped = async (req, res) => {
	const { Invoice_id } = req.body;

	if (!Invoice_id) {
		return res.status(400).json({ message: 'Invoice id is required' });
	}

	try {
		const sqlFOB = 'CALL Invoice_Shipped(?, @Message_en, @Message_th); SELECT @Message_en AS Message_en, @Message_th AS Message_th;';
		const [rows] = await db.query(sqlFOB, [Invoice_id]);
		//console.log(rows);

		// Check if there are any error messages returned
		const message_en = rows[1][0].Message_en;
		const message_th = rows[1][0].Message_th;

		if (message_en || message_th) {
			// If there's an error message, return it in the response
			return res.status(200).json({
				success: false,
				message_en,
				message_th,
			});
		}

		if (req.file) {
			// Assuming req.file contains the image file
			const document = req.file.filename; // Assuming the image is stored in a buffer

			// Update the Invoices table with the document
			await db.execute(
				"UPDATE Invoices SET document = ? WHERE Invoice_id = ?",
				[document, Invoice_id]
			);
		}

		// If no error message, proceed with the rest of the process
		res.status(200).json({
			success: true,
			message: 'Invoice shipped successfully',
			data: rows,
		});
		// Fetch data from new_order_costs and order_details tables

	} catch (e) {
		// Log the error for debugging
		console.error('Error fetching order:', e);

		// Send the error response
		res.status(500).json({
			success: false,
			message: 'Internal server error',
			error: e.message,
		});
	}
};


const CustomeInvoicePdfDetails = async (req, res) => {
	try {
		const { invoice_id, order_id } = req.body;

		const [CompanyAddress] = await db.execute(
			"SELECT * FROM `Company_Address` WHERE `ID` = ?",
			[3],
		)

		const Company_Address = CompanyAddress[0];
		if (Company_Address) {
			Company_Address.logo = "https://terp.siameats.net/api/images/" + Company_Address.logo;
		}

		const [orderResults] = await db.execute(`
            SELECT 
			    fx_id,
                Invoice_number,                
                Shipment_ref ,
                Client_name,
                Consignee_id,
				Consignee_name,
				NOTES
            FROM 
                Invoices
            WHERE 
                Invoice_id = ?
        `, [invoice_id]);

		if (orderResults.length === 0) {
			return res.status(404).json({ message: 'No data found for the provided order_id' });
		}

		// Fetch data from clients table
		const [order_details] = await db.execute(`
            SELECT 
                Client_id 
            FROM 
                orders
            WHERE 
                Order_ID = ?
        `, [order_id]);

		const [clientResults] = await db.execute(`
            SELECT 
                client_name,
                client_address
            FROM 
                clients
            WHERE 
                client_id = ?
        `, [order_details[0].Client_id]);

		const [consigneeResults] = await db.execute(`
            SELECT 
                consignee_name,
                consignee_address
            FROM 
                consignee
            WHERE 
                consignee_id = ?
        `, [orderResults[0].Consignee_id]);

		const [currencyResults] = await db.execute(`
            SELECT 
                currency
            FROM 
                dropdown_currency
            WHERE 
                currency_id = ?
        `, [orderResults[0].fx_id]);

		const [freightDetailsResults] = await db.execute(`
			SELECT 
				bl AS awb,
				journey_number AS journey,
				ship_date
			FROM 
				order_freight_details
			WHERE 
				order_id = ?
		`, [order_id]);

		const sql1 = `SELECT PDF_Customs_GW_Invoice(${invoice_id}) AS GW`;
		const [rows1] = await db.query(sql1);

		res.status(200).json({
			message: "PDF Details",
			//data: data,
			Company_Address: Company_Address,
			orderResults: orderResults[0],
			clientResults: clientResults[0],
			consigneeResults: consigneeResults[0],
			currencyResults: currencyResults[0],
			freightDetailsResults: freightDetailsResults[0],
			gw: rows1[0].GW
		});
	} catch (e) {
		res.status(400).json({
			message: "Error Occurred",
			error: e.message,
		})
	}
}

const invoicePdfTable = async (req, res) => {
	try {
		const { invoice_id } = req.body;
		// itf.itf_name_th as itf_th,
		const [tableData] = await db.execute(
			`SELECT Invoice_details.id_id, Invoice_details.ITF_ID, Invoice_details.FOB_THB AS FOB, Invoice_details.itf_unit_name, dropdown_unit_count.unit_name_en as Unit, itf.itf_name_en, net_weight AS Net_Weight, ROUND(Number_of_boxes) AS Boxes 
			FROM Invoice_details
			INNER JOIN itf on itf.itf_id=Invoice_details.ITF_ID
			INNER JOIN dropdown_unit_count on dropdown_unit_count.unit_id=Invoice_details.Unit_id 
			WHERE Invoice_id = ?
			 ORDER BY
     Invoice_details.Invoice_id,
     CAST(itf_classification_ID(Invoice_details.ITF_ID) AS INT),
     PDF_Customs_Produce_Name_ITF(Invoice_details.ITF_ID),
     (Invoice_details.net_weight / Invoice_details.Number_of_boxes)`,
			[invoice_id]
		);
		//console.log(tableData);
		// Loop through each element and execute queries sequentially
		for (let element of tableData) {
			/* const sqlFOB = `SELECT PDF_Invoice_details_FOB(${element.id_id}) AS FOB`;
			const [rowsFOB] = await db.query(sqlFOB);
			element.FOB = rowsFOB[0].FOB; */

			const sql1 = `SELECT PDF_Customs_Produce_Name_ITF(${element.ITF_ID}) AS ITF_Name`;
			const [rows1] = await db.query(sql1);
			element.itf_th = rows1[0].ITF_Name;

			const sqlHSCode = `
				SELECT sp.produce_hscode
				FROM setup_produce sp
				JOIN ean_details ed ON sp.produce_id = ed.item_id
				JOIN itf_details id ON id.item_id = ed.ean_id
				WHERE id.itf_id = ?
				AND id.detail_type = 3
				AND ed.detail_type = 3;
			`;

			const [data] = await db.execute(sqlHSCode, [element.ITF_ID]);
			if (data.length > 0) {
				element.HS_CODE = data[0].produce_hscode;
			} else {
				element.HS_CODE = null; // Handle the case where no data is found
			}
		}

		//console.log(tableData);

		//console.log();
		res.status(200).json({ results: tableData, message: "Invoice table data  successfully" });
	} catch (error) {
		res.status(500).json({
			message: "Internal server error",
			error: error.message
		});
	}
}

const copyOrder = async (req, res) => {
	try {
		const { order_id, user } = req.body;
		//console.log(req.body);

		const sqlFOB = 'CALL Order_Copy(?,?)';
		const [rows] = await db.query(sqlFOB, [order_id, user]);

		res.status(200).json({
			success: true,
			message: 'success'
		})

	} catch (error) {
		res.status(500).json({
			success: false,
			message: "Internal server error",
			error: error.message
		});
	}
}

const InvoiceNotes = async (req, res) => {
	try {
		const { invoice_id, notes } = req.body;

		await db.execute("UPDATE Invoices SET NOTES = ? WHERE Invoice_id = ?", [notes, invoice_id]);
		res.status(200).json({ success: true, message: "Note updated successfully" });

	} catch (error) {
		res.status(500).json({
			message: "Internal server error",
			error: error.message
		});
	}
}

const OrderNotes = async (req, res) => {
	try {
		const { order_id, notes } = req.body;
		await db.execute("UPDATE orders SET NOTES = ? WHERE Order_ID = ?", [notes, order_id]);
		res.status(200).json({ success: true, message: "Note updated successfully" });

	} catch (error) {
		res.status(500).json({
			message: "Internal server error",
			error: error.message
		});
	}
}


// Api for cancle_invoice
const cancle_invoice = async (req, res) => {
	const data = req.body
	try {
		const params = [
			data.Invoice_id || null,

		];

		await db.execute("SET @Message_EN = ''")
		await db.execute("SET @Message_TH = ''")

		const result = await db.execute("CALL Cancel_invoice(? , @message_EN , @message_TH)", params)
		const messagesResult = await db.execute("SELECT @message_EN AS message_EN, @Message_TH AS Message_TH")
		const anyMessageNotNull = messagesResult && messagesResult[0][0] &&
			(messagesResult[0][0].message_EN || messagesResult[0][0].message_TH);



		if (anyMessageNotNull) {
			const messages = messagesResult[0][0]


			return res.status(400).json({
				success: false,
				message: messages
			})
		}
		else {
			return res.status(200).json({
				success: true,
				message: "Success"
			})
		}
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: 'Internal server error',
			error: error.message
		})
	}
}

// Api for invoice procedure terms
const invoice_procedure = async (req, res) => {
	const data = req.body;

	try {
		const params = [data.Invoice_id];

		//console.log(data.Invoice_id);

		// Set the dynamic message variable
		await db.execute("SET @Dynamic_message = ''");

		// Execute the stored procedure
		const result = await db.execute("CALL Invoice_delivery_terms1(? , @Dynamic_message)", params);

		// Retrieve the dynamic message
		const [messagesResult] = await db.execute("SELECT @Dynamic_message AS Dynamic_message");

		const dynamicMessage = messagesResult[0]?.Dynamic_message;

		// Check if there is a dynamic message
		if (dynamicMessage) {
			return res.status(400).json({
				success: false,
				message: dynamicMessage
			});
		} else {
			return res.status(200).json({
				success: true,
				message: "Success"
			});
		}
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: 'Internal server error',
			error: error.message
		});
	}
}



// Api for pdf delivery by 

const pdf_delivery_by = async (req, res) => {
	const data = req.body;

	try {
		const params = [data.order_id || null];

		// Set the dynamic message variable
		await db.execute("SET @Delivery_By = ''");

		// Execute the stored procedure
		const result = await db.execute("CALL PDF_Delivery_by(? , @Delivery_By)", params);

		// Retrieve the dynamic message
		const [messagesResult] = await db.execute("SELECT @Delivery_By AS Delivery_By");

		const DeliveryBy = messagesResult[0]?.Delivery_By;

		// Check if there is a dynamic message
		res.status(200).json({
			success: true,
			message: DeliveryBy
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: 'Internal server error',
			error: error.message
		});
	}
}


// Api for get profoma  main Invoice details

const proformaMain_Invoice = async (req, res) => {
	const { Invoice_id, order_id } = req.query;
	//console.log(req.query);
	try {
		// Fetch order details
		const [orderDetailsArray] = await db.execute(
			`SELECT * FROM Invoice_details WHERE Invoice_id = ?`,
			[Invoice_id]
		);

		const [order] = await db.execute(
			`SELECT * FROM Invoices WHERE Invoice_id = ?`,
			[Invoice_id]
		)
		//console.log(order);
		//console.log(orderDetailsArray);
		for (let orderDetails of orderDetailsArray) {
			//console.log(orderDetails);
			const [orderPackingArray] = await db.execute(
				`SELECT buns FROM order_packing WHERE od_id = ?`,
				[orderDetails.od_id]
			);

			// Assuming there is only one packing detail for the given od_id
			const orderPacking = orderPackingArray[0];


			if (orderPacking) {
				orderDetails.buns = orderPacking.buns;
			} else {
				orderDetails.buns = null; // or any default value if no buns found
			}
			//console.log(orderDetails);
			const [eanBarcodeArray] = await db.execute(
				`SELECT ITF_EAN_BARCODE(?) AS ean_code`,
				[orderDetails.ITF_ID]
			);

			const eanBarcode = eanBarcodeArray[0];

			if (eanBarcode) {
				orderDetails.barcode = eanBarcode.ean_code;
			} else {
				orderDetails.barcode = null; // or any default value if no barcode found
			}

			if (order[0] && order[0].Consignee_id) {
				const [ConsigneeCustomizeDetails] = await db.execute(
					"SELECT Custom_Name as customize_Custom_Name FROM Consignee_Customize WHERE ConsigneeI = ?",
					[order[0].Consignee_id]
				);
				const ConsigneeCustomize = ConsigneeCustomizeDetails[0];
				// Do something with ConsigneeCustomize
				if (ConsigneeCustomize) {
					orderDetails.customize_Custom_Name = ConsigneeCustomize.customize_Custom_Name;
				} else {
					orderDetails.customize_Custom_Name = null; // or any default value if no barcode found
				}
			}
			else {
				orderDetails.customize_Custom_Name = null; // or any default value if no barcode found
			}
			//console.log(ConsigneeCustomizeDetails);

		}

		//console.log(orderDetailsArray);

		// Fetch invoice details
		const [invoiceDetails] = await db.execute(
			`SELECT * FROM Invoices WHERE Invoice_id = ?`,
			[Invoice_id]
		);

		// fetch order finance details
		// const [orderFinance] = await db.execute(
		// 	`SELECT * FROM order_financials WHERE order_id = ?`,
		// 	[order_id]
		// )

		// fetch company address details
		const [CompanyAddress] = await db.execute(
			"SELECT * FROM `Company_Address` WHERE `ID` = ?",
			[3],
		)
		const Company_Address = CompanyAddress[0];

		if (Company_Address) {
			Company_Address.logo = "https://terp.siameats.net/api/images/" + Company_Address.logo;
		}


		const [HeaderDetails] = await db.query(
			"SELECT journey_number, bl, DATE_FORMAT(Ship_date, '%d-%m-%Y') AS Ship_date FROM order_freight_details WHERE order_id = ?",
			[order_id]
		);

		var invoice_header = HeaderDetails[0];

		// Calculate line_total for each order detail
		const updatedOrderDetails = orderDetailsArray.map(detail => {
			const line_total = Math.round(detail.itf_quantity * detail.Final_Price * 1000) / 1000;
			return {
				...detail,
				line_total
			};
		});


		res.status(200).json({
			success: true,
			message: "Proforma Main Invoice Details",
			orderDetails: updatedOrderDetails,
			invoiceDetails: invoiceDetails,
			// orderFinancialDetails: orderFinance,
			Company_Address: Company_Address,
			invoice_header: invoice_header,
			order: order[0]
		});
	} catch (e) {
		res.status(400).json({
			success: false,
			message: "Error Occurred",
			error: e.message,
		});
	}
};

const proformaMain_Order = async (req, res) => {
	const { order_id } = req.query;
	//console.log(req.query);
	try {
		// Fetch order details
		const [orderDetailsArray] = await db.execute(
			`SELECT * 
   FROM order_details 
   WHERE Order_ID = ? 
   ORDER BY 
     order_details.Order_ID,
     CAST(itf_classification_ID(order_details.ITF) AS INT),
     PDF_Customs_Produce_Name_ITF(order_details.ITF),
     (order_details.OD_NW / order_details.OD_Box)`,
			[order_id]
		);

		const [order] = await db.execute(
			`SELECT * FROM orders WHERE Order_ID = ?`,
			[order_id]
		)
		//console.log(order);
		//console.log(orderDetailsArray);
		for (let orderDetails of orderDetailsArray) {
			//console.log(orderDetails);
			const sql1 = `SELECT ITF_HSCODE(${orderDetails.ITF}) AS HS_CODE`;
			const [rows1] = await db.query(sql1);
			orderDetails.hs_code = rows1[0].HS_CODE;

			if (order[0] && order[0].Consignee_id) {
				const [ConsigneeCustomizeDetails] = await db.execute(
					"SELECT Custom_Name as customize_Custom_Name FROM Consignee_Customize WHERE ConsigneeI = ?",
					[order[0].Consignee_id]
				);
				const ConsigneeCustomize = ConsigneeCustomizeDetails[0];
				// Do something with ConsigneeCustomize
				if (ConsigneeCustomize) {
					orderDetails.customize_Custom_Name = ConsigneeCustomize.customize_Custom_Name;
				} else {
					orderDetails.customize_Custom_Name = null; // or any default value if no barcode found
				}
			}
			else {
				orderDetails.customize_Custom_Name = null; // or any default value if no barcode found
			}
			//console.log(ConsigneeCustomizeDetails);

		}

		//console.log(orderDetailsArray);

		// Fetch invoice details
		const [invoiceDetails] = await db.execute(
			`SELECT * FROM Invoices WHERE order_id = ?`,
			[order_id]
		);

		// fetch order finance details
		// const [orderFinance] = await db.execute(
		// 	`SELECT * FROM order_financials WHERE Order_id = ?`,
		// 	[order_id]
		// )

		// fetch company address details
		const [CompanyAddress] = await db.execute(
			"SELECT * FROM `Company_Address` WHERE `ID` = ?",
			[3],
		)
		const Company_Address = CompanyAddress[0];

		if (Company_Address) {
			Company_Address.logo = "https://terp.siameats.net/api/images/" + Company_Address.logo;
		}


		const [HeaderDetails] = await db.query(
			"SELECT journey_number, bl, DATE_FORMAT(Ship_date, '%d-%m-%Y') AS Ship_date FROM order_freight_details WHERE order_id = ?",
			[order_id]
		);

		var invoice_header = HeaderDetails[0];

		// fetch order details

		// fetch order finance details


		// Calculate line_total for each order detail
		const updatedOrderDetails = orderDetailsArray.map(detail => {
			const line_total = Math.round(detail.OD_QTY * detail.OD_FP * 1000) / 1000;
			return {
				...detail,
				line_total
			};
		});


		res.status(200).json({
			success: true,
			message: "Proforma Main Invoice Details",
			orderDetails: updatedOrderDetails,
			invoiceDetails: invoiceDetails,
			// orderFinancialDetails: orderFinance,
			Company_Address: Company_Address,
			invoice_header: invoice_header,
			order: order[0]
		});
	} catch (e) {
		res.status(400).json({
			success: false,
			message: "Error Occurred",
			error: e.message,
		});
	}
};

// Api for get Invoice details
const InvoiceDetails = async (req, res) => {
	try {
		const { Invoice_id, order_id } = req.body;

		// Validate the request body
		if (!Invoice_id) {
			return res.status(400).json({
				message: "Missing Invoice_id",
			});
		}
		if (!order_id) {
			return res.status(400).json({
				message: "Missing order_id",
			});
		}

		const [Invoice] = await db.execute(
			"SELECT * FROM `Invoices` WHERE `Invoice_id` = ? AND `order_id` = ?",
			[Invoice_id, order_id]
		);

		if (Invoice.length === 0) {
			return res.status(400).json({
				message: "No invoice found",
			});
		}

		res.status(200).json({
			message: "Invoice Details",
			Invoice: Invoice[0]
		});
	} catch (e) {
		res.status(500).json({
			message: "Error Occurred",
			error: e.message,
		});
	}
};


// Api for order delivery rterms
const order_delivery_terms = async (req, res) => {
	const data = req.body;

	try {
		const params = [data.Order_id];

		// Set the dynamic message variable
		await db.execute("SET @Dynamic_message = ''");


		const result = await db.execute("CALL Order_delivery_terms(? , @Dynamic_message)", params);

		// Retrieve the dynamic message
		const [messagesResult] = await db.execute("SELECT @Dynamic_message AS Dynamic_message");

		const DynamicMessage = messagesResult[0]?.Dynamic_message;

		// Check if there is a dynamic message
		if (DynamicMessage) {
			res.status(400).json({
				success: false,
				message: DynamicMessage
			});
		} else {
			res.status(200).json({
				success: true,
				message: "Success"
			});
		}
	} catch (error) {
		res.status(500).json({
			success: false,
			message: 'Internal server error',
			error: error.message
		});
	}
}

// Api for quotation delivery terms

const insertInvoicePayment = async (req, res) => {
	try {
		const { datas } = req.body;

		//console.log(req.body);
		if (!Array.isArray(datas) || datas.length === 0) {
			return res.status(400).json({
				success: false,
				message: 'Invalid input data. Expecting an array of data.'
			});
		}


		for (const data of datas) {
			const { Payment_ID, Invoice_ID, FX_Payment } = data;

			// Call the stored procedure
			const [result] = await db.execute(
				`CALL Insert_Invoice_Details_payment(?, ?, ?)`,
				[Payment_ID, Invoice_ID, FX_Payment]
			);
		}

		// Send a success response
		res.status(200).json({
			success: true,
			message: 'Invoice payments inserted successfully',
		});
	} catch (error) {
		// Handle any errors
		res.status(500).json({
			success: false,
			message: 'Internal server error',
			error: error.message
		});
	}
};


const getInvoiceByClientID = async (req, res) => {
	try {
		const { Client_id, Consignee_id } = req.body;
		const [CompanyAddress] = await db.execute(
			"SELECT * FROM `Company_Address` WHERE `ID` = ?",
			[3],
		)
		const Company_Address = CompanyAddress[0];
		// Fetch the data from the database
		const [result] = await db.execute(
			`CALL Payment_list(?, ?)`,
			[Client_id, Consignee_id]
		);
		//console.log(result);

		// Define the transformKeys function to rename the keys
		const transformKeys = (data) => {
			return data.map(record => {
				return {
					invoice_id: record.Invoice_id,
					date: record.Date,
					bl: record.BL,
					transaction_ref: record['Transaction Ref'],
					tt_ref: record['TT REF'],
					currency: record.Currnecy,
					invoice_amount: record['Invoice Amount'],
					credit_note: record['Credit Note'],
					billed_amount: record['Billed Amount'],
					past_payment: record['Past Payment'],
					amount_to_pay: record['Amount to Pay']
				};
			});
		};

		// Transform the keys of the result data
		const transformedData = transformKeys(result[0]);

		// Send a success response
		res.status(200).json({
			success: true,
			message: 'Client and Consignee Invoice Details',
			data: transformedData,
			Company_Address: Company_Address
		});
	} catch (error) {
		// Handle any errors
		res.status(500).json({
			success: false,
			message: 'Internal server error',
			error: error.message
		});
	}
};


const AccountingStatistics = async (req, res) => {
	try {
		// Call the stored procedure
		await db.query('CALL Accounting_statistics(@Income, @Claims,  @Receivables, @Expenses, @Payables, @Profits, @ManHours, @Freight)');

		// Retrieve the output parameters
		const [results] = await db.query('SELECT @Income AS Income, @Claims AS Claims, @Receivables AS Receivables, @Expenses AS Expenses, @Payables AS Payables, @Profits AS Profits, @ManHours AS ManHours, @Freight AS Freight');
		res.status(200).json({
			success: true,
			data: results[0]
		});

	} catch (error) {
		res.status(500).json({
			success: false,
			message: 'Internal server error',
			error: error.message
		});
	}
}


const PaymentChannela = async (req, res) => {
	try {
		// Retrieve the output parameters
		const [results] = await db.execute('SELECT bank_id, bank_name, Bank_nick_name from setup_bank');
		res.status(200).json({
			success: true,
			data: results
		});

	} catch (error) {
		res.status(500).json({
			success: false,
			message: 'Internal server error',
			error: error.message
		});
	}
}

const InvoiceAWBReady = async (req, res) => {
	try {
		// Call the stored procedure
		const { Invoice_id } = req.body;
		const [data] = await db.query('CALL Invoice_AWB_Ready(?)', [Invoice_id]);

		// Retrieve the output parameters
		res.status(200).json({
			success: true,
			data: data
		});

	} catch (error) {
		res.status(500).json({
			success: false,
			message: 'Internal server error',
			error: error.message
		});
	}
}

const calculateInvoice = async (req, res) => {
	try {
		// Call the stored procedure
		const { Invoice_id } = req.body;
		const [data] = await db.query('CALL Update_Invoice(?)', [Invoice_id]);

		// Retrieve the output parameters
		res.status(200).json({
			success: true,
			data: data
		});

	} catch (error) {
		res.status(500).json({
			success: false,
			message: 'Internal server error',
			error: error.message
		});
	}
}

const UploadPdf = async (req, res) => {
	try {
		if (!req.file) {
			// Handle case where file is not present in the request
			console.error('No file uploaded');
			return res.status(400).json({
				success: false,
				message: 'No file uploaded'
			});
		}

		const document = req.file.filename;
		//console.log('Uploaded document:', document);

		res.status(200).json({
			success: true,
			message: 'Uploaded successfully'
		});
	} catch (error) {
		console.error('Error in file upload:', error);
		res.status(500).json({
			success: false,
			message: 'Internal server error',
			error: error.message
		});
	}
};


const ApproveOrder = async (req, res) => {
	try {
		const { order_id } = req.body;

		// Execute the procedure to approve the order
		const [data] = await db.query('CALL Order_Approve(?)', [order_id]);

		// Fetch order details for the notification
		const [order_details] = await db.query(
			`SELECT orders.Order_Number, orders.Consignee_ID, orders.Client_id, orders.Shipment_ref, 
				DATE_FORMAT(orders.created, '%d/%m/%Y') as created,
				DATE_FORMAT(orders.load_date, '%d/%m/%Y') as load_date, 
				clients.client_name, consignee.consignee_name, users.name 
				FROM orders 
				LEFT JOIN consignee ON orders.Consignee_ID  = consignee.consignee_id
				LEFT JOIN clients ON clients.client_id   = orders.Client_id
				LEFT JOIN users ON users.id = orders.user 
				WHERE orders.Order_ID = ?`, [order_id]
		);
		// console.log(order_details);

		// Set up notification title and body
		let title = 'Order Approved';
		let body = `An order has been approved.
			Order Number: ${order_details[0].Order_Number}
			Order Date: ${order_details[0].created}
			TTR REF: ${order_details[0].Shipment_ref}
			Client Name: ${order_details[0].client_name}
			Consignee Name: ${order_details[0].consignee_name}
			Load Date: ${order_details[0].load_date}
			Approved by: ${order_details[0].name}`;

		// Fetch notification details
		const [notification_id] = await db.execute(
			`SELECT * FROM notification_details 
				WHERE notify_on = 7 AND client = ? AND consignee = ?`,
			[order_details[0].Client_id, order_details[0].Consignee_ID]
		);


		if (notification_id.length > 0) {
			const [notification_users] = await db.execute(
				`SELECT notifications.user, users.email 
					FROM notifications 
					LEFT JOIN users ON users.id = notifications.user 
					WHERE notification_id = ?`, [notification_id[0].notification_id]
			);

			// Insert notifications into history and send emails
			for (let item of notification_users) {
				await db.execute(
					"INSERT INTO notification_history (notification_id, user_id, order_id, title, messages) VALUES (?, ?, ?, ?, ?)",
					[
						notification_id[0].notification_id,
						item.user,
						order_id,
						title,
						body
					]
				);

				// Prepare email content
				let Email = item.email;
				let mailSubject = "Order Approved";
				let content = `<!DOCTYPE html>
						<html lang="en">
						<head>
							<meta charset="UTF-8">
							<meta name="viewport" content="width=device-width, initial-scale=1.0">
							<style>
								body { font-family: Arial, sans-serif; }
							</style>
						</head>
						<body>
							<p>Hello,</p>
							<p>An order has been approved. Details:</p>
							<p><strong>Order Number:</strong> ${order_details[0].Order_Number}<br>
							<strong>Order Date:</strong> ${order_details[0].created}<br>
							<strong>TTR REF:</strong> ${order_details[0].Shipment_ref}<br>
							<strong>Client Name:</strong> ${order_details[0].client_name}<br>
							<strong>Consignee Name:</strong> ${order_details[0].consignee_name}<br>
							<strong>Load Date:</strong> ${order_details[0].load_date}<br>
							<strong>Approved by:</strong> ${order_details[0].name}</p>
						</body>
						</html>`;

				// Send email using your sendMail function
				sendMail(Email, mailSubject, content);
			}
		}

		// Return success response
		res.status(200).json({
			success: true,
			data: data,
			message: "Order approved successfully"
		});
	} catch (error) {
		// Handle errors
		res.status(500).json({
			success: false,
			message: 'Internal server error',
			error: error.message
		});
	}
};


const InvoiceCalculatedPrice = async (req, res) => {
	try {
		const { Invoice_ID } = req.body;
		const [data] = await db.query('CALL Invoice_use_calculated_Price(?)', [Invoice_ID]);

		// Retrieve the output parameters
		res.status(200).json({
			success: true,
			data: data,
			message: "successfully"
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: 'Internal server error',
			error: error.message
		});
	}
}


const ConsigneeITFdropdown = async (req, res) => {
	try {
		const { Consignee_id } = req.body;
		const [data] = await db.query('CALL Consignee_ITF_dropdown(?)', [Consignee_id]);
		//console.log(data);

		// Retrieve the output parameters
		res.status(200).json({
			success: true,
			data: data[0],
			message: "successfully"
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: 'Internal server error',
			error: error.message
		});
	}
}

const ConsigneeBrandDropdown = async (req, res) => {
	try {
		const { Consignee_id } = req.body;
		const [data] = await db.query('CALL Consignee_brand_dropdown(?)', [Consignee_id]);
		//console.log(data);

		// Retrieve the output parameters
		res.status(200).json({
			success: true,
			data: data[0],
			message: "successfully"
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: 'Internal server error',
			error: error.message
		});
	}
}



const ProduceTrendGraph = async (req, res) => {
	try {
		const { Produce_ID, Start_Date, Stop_Date } = req.body;
		const [data] = await db.query('CALL Produce_Trend_Graph(?,?,?)', [Produce_ID, Start_Date, Stop_Date]);
		const dataAll = data[1];
		const Data = data[0]
		// If data is present
		if (data.length > 0) {
			// Extract prices, wastage, and raw_kg_cost from the data, filtering out null values
			const prices = Data.map((item) => parseFloat(item.price)).filter(val => !isNaN(val));
			const wastages = dataAll.map((item) => parseFloat(item.Wastage)).filter(val => !isNaN(val));
			const rawKgCosts = dataAll.map((item) => parseFloat(item.Raw_Kg_Cost)).filter(val => !isNaN(val));

			// Combine prices and raw kg costs for min and max calculations, if both have values
			const combinedValues = [...prices, ...rawKgCosts].filter(val => !isNaN(val));

			// Calculate overall min and max if combined values are present
			let adjustedMinValue = null;
			let adjustedMaxValue = null;

			if (combinedValues.length > 0) {
				const minValue = Math.min(...combinedValues);
				const maxValue = Math.max(...combinedValues);

				// Adjust min and max values
				adjustedMinValue = Math.round(minValue - 1);
				adjustedMaxValue = Math.round(maxValue + 1);
			}

			// Respond with the adjusted values and extracted arrays
			res.status(200).json({
				success: true,
				// data: data[0],
				dataAll: data,
				prices: prices,
				wastages,
				rawKgCosts,
				minPrice: adjustedMinValue,
				maxPrice: adjustedMaxValue,
				message: "Prices, wastages, and raw kg costs successfully extracted and adjusted"
			});
		} else {
			res.status(404).json({
				success: false,
				message: 'No data found'
			});
		}
	} catch (error) {
		res.status(500).json({
			success: false,
			message: 'Internal server error',
			error: error.message
		});
	}
};

const getOrderById = async (req, res) => {
	try {
		const { order_id } = req.query;
		// console.log(req.query);

		if (!order_id) {
			return res.status(400).json({ success: false, message: "Please provide an order ID" });
		}

		// SQL query to fetch order details with joins for related information
		const sql = `
            SELECT orders.*,
                users.name AS created_by, 
                clients.client_name,
                clients.client_address,
                clients.client_tax_number,
                clients.client_email,
                clients.client_phone,
                setup_liner.liner_name AS Airline, 
                setup_liner.liner_code AS Airline_liner_code, 
                setup_ports.port_name AS Airport, 
                setup_ports.IATA_code AS Airport_IATA_code, 
                dropdown_currency.currency AS currency, 
                vendors.name AS clearance_name, 
                consignee.consignee_name,
                consignee.consignee_address,
                consignee.consignee_tax_number, 
                consignee.consignee_email,
                consignee.consignee_phone, 
                location.name AS location_name, 
                freight.Liner AS Freight_liner, 
                freight.journey_number AS Freight_journey_number, 
                freight.bl AS Freight_bl, 
                freight.Load_date AS Freight_load_date, 
                freight.Load_time AS Freight_load_time, 
                DATE_FORMAT(freight.Ship_date, '%m/%d/%Y') AS Freight_ship_date, 
                freight.ETD AS Freight_etd, 
                freight.Arrival_date AS Freight_arrival_date, 
                freight.ETA AS Freight_eta, 
                supplier.name AS supplier_name
            FROM orders
            INNER JOIN consignee ON orders.consignee_id = consignee.consignee_id
            INNER JOIN clients ON clients.client_id = orders.Client_id
            INNER JOIN setup_ports ON setup_ports.port_id = orders.Destination_Port
            INNER JOIN setup_liner ON setup_liner.liner_id = orders.Liner_ID
            INNER JOIN vendors AS supplier ON orders.O_Freight_Provider = supplier.vendor_id
            INNER JOIN setup_location AS location ON orders.loading_location = location.id
            INNER JOIN order_freight_details AS freight ON orders.Order_ID  = freight.order_id
            INNER JOIN users ON users.id = orders.user
            INNER JOIN dropdown_currency ON dropdown_currency.currency_id = orders.FX_ID
            INNER JOIN vendors ON vendors.vendor_id = orders.O_Clearance_Provider
            WHERE orders.Order_ID = ?
        `;

		// Execute the query with order_id as a parameter
		const [data] = await db.query(sql, [order_id]);

		// Check if the order was found
		if (data.length > 0) {
			res.status(200).json({ success: true, data: data[0] });
		} else {
			res.status(404).json({ success: false, message: "Order not found" });
		}
	} catch (error) {
		res.status(500).json({ success: false, message: "Internal server error", error });
	}
};

const getInvoiceById = async (req, res) => {
	try {
		const { invoiceId } = req.query;

		if (!invoiceId) {
			return res.status(400).json({
				message: "Invoice ID is required.",
			});
		}

		const sql = `
			SELECT Invoices.*, 
			       clients.client_address, 
			       consignee.consignee_address,
			       clients.client_tax_number,
			       clients.client_email,
			       clients.client_phone,
			       consignee.consignee_tax_number, 
			       consignee.consignee_email,
			       consignee.consignee_phone,
			       setup_liner.liner_name AS Airline,  
			       setup_liner.liner_code AS Airline_liner_code,
			       setup_ports.port_name AS Airport,
			       setup_ports.port_country,
			       setup_ports.IATA_code AS Airport_IATA_code, 
			       dropdown_currency.currency AS currency, 
			       orders.O_Markup, 
			       orders.Customer_ref,  
			       order_freight_details.bl, 
			       order_freight_details.Ship_date, 
			       order_freight_details.Load_date AS load_date
			FROM Invoices 
			INNER JOIN order_freight_details ON order_freight_details.order_id = Invoices.order_id
			INNER JOIN orders ON orders.Order_ID = Invoices.order_id
			INNER JOIN clients ON clients.client_id = orders.Client_id
			INNER JOIN consignee ON consignee.consignee_id = orders.Consignee_ID
			INNER JOIN setup_ports ON setup_ports.port_id = orders.Destination_Port
			INNER JOIN setup_liner ON setup_liner.liner_id = orders.Liner_ID
			INNER JOIN dropdown_currency ON dropdown_currency.currency_id = Invoices.fx_id
			WHERE Invoices.invoice_id = ?
		`;

		const [data] = await db.query(sql, [invoiceId]);

		if (data.length === 0) {
			return res.status(404).json({
				message: "Invoice not found.",
			});
		}

		res.status(200).json({
			message: "Invoice retrieved successfully.",
			data: data[0],
		});
	} catch (e) {
		res.status(400).json({
			message: "An error occurred while retrieving the invoice.",
			error: e.message,
		});
	}
};

const RebateRecord = async (req, res) => {
	try {
		const { Invoice_id } = req.body;
		if (!Invoice_id) {
			return res.status(400).json({
				success: false,
				message: "Invoice ID is required."
			})
		}
		const [data] = await db.query('CALL Rebate_Recorcd(?)', [Invoice_id]);
		//console.log(data);

		// Retrieve the output parameters
		res.status(200).json({
			success: true,
			data: data[0],
			message: "successfully"
		});
	} catch (error) {
		res.status(400).json({
			message: "An error occurred while retrieving the invoice.",
			error: error.message,
		});
	}
}

const RebateReduceInvoice = async (req, res) => {
	try {
		const { Invoice_id } = req.body;
		if (!Invoice_id) {
			return res.status(400).json({
				success: false,
				message: "Invoice ID is required."
			})
		}
		const [data] = await db.query('CALL Rebate_Reduce_Invoice(?)', [Invoice_id]);
		//console.log(data);

		// Retrieve the output parameters
		res.status(200).json({
			success: true,
			data: data[0],
			message: "successfully"
		});
	} catch (error) {
		res.status(400).json({
			message: "An error occurred while retrieving the invoice.",
			error: error.message,
		});
	}
}



module.exports = {
	getOrders,
	getOrdersPacking,
	createOrder,
	updateOrder,
	getOrdersDetails,
	getOrderPackingDetails,
	deleteOrderDetails,
	calculateOrder,
	doOrderPacking,
	addOrderInput,
	newCalculateOrder,
	getOrderSummary,
	deleteOrder,
	updateOrderFreight,
	aslWastage,
	RestoreOrderPacking,
	RecalculateOrder,
	getOrderPacking,
	CompanyAddress,
	invoiceDetailsList,
	getorderFreightDetails,
	GetOrderPdfDetails,
	OrderPdfDetails,
	InvoicePdfDetails,
	GenerateInvoiceTick,
	GetInvoicePdfDetails,
	GetinvoiceDetails,
	getInvoiceSummary,
	getInvoiceDeatilsTable,
	EditInvoiceDetails,
	orderPdfTable,
	getOrderFinancials,
	invoiceLoader,
	InvoiceAdjustWeight,
	InvoiceShipped,
	CustomeInvoicePdfDetails,
	copyOrder,
	invoicePdfTable,
	InvoiceNotes,
	OrderNotes,
	cancle_invoice,
	invoice_procedure,
	proformaMain_Invoice,
	pdf_delivery_by,
	InvoiceDetails,
	order_delivery_terms,
	proformaMain_Order,
	insertInvoicePayment,
	getInvoiceByClientID,
	AccountingStatistics,
	PaymentChannela,
	InvoiceAWBReady,
	calculateInvoice,
	UploadPdf,
	ApproveOrder,
	InvoiceCalculatedPrice,
	ConsigneeITFdropdown,
	ConsigneeBrandDropdown,
	ProduceTrendGraph,
	getOrderById,
	getInvoiceById,
	RebateRecord,
	RebateReduceInvoice
}
