const db = require("../../db/dbConnection")
const { db: db2 } = require("../../db/db2")
const { array } = require("yup")
const { error } = require("winston")

const addPurchageOrder = (req, resp) => {
	const {
		po_id,
		pod_code,
		accounting_id,
		pod_type_id,
		pod_item,
		pod_quantity,
		unit_count_id,
		pod_price,
		pod_vat,
		pod_wht_id,
		pod_line_total,
		pod_crate,
		pod_status,
		confirm,
		confirm_by,
		inventory,
		inventory_entry,
		vendor_id,
		po_code,
	} = req.body


	if (po_id == "" || !po_id) {
		resp.status(400).send({
			success: false,
			message: "Please Provide Po_Id",
		})
		return
	}

	if (pod_type_id == "" || !pod_type_id) {
		resp.status(400).status(400).send({
			success: false,
			message: "Please Provide Pod Type Id",
		})
		return
	}

	if (pod_item == "" || !pod_item) {
		resp.status(400).send({
			success: false,
			message: "Please Provide Pod Item",
		})
		return
	}

	if (pod_quantity == "" || !pod_quantity) {
		resp.status(400).send({
			success: false,
			message: "Please Provide Pod Quantity",
		})
		return
	}

	if (pod_quantity == "" || !pod_quantity) {
		resp.status(400).send({
			success: false,
			message: "Please Provide Pod Quantity",
		})
		return
	}

	if (unit_count_id == "" || !unit_count_id) {
		resp.status(400).send({
			success: false,
			message: "Please Provide Unit Count Id",
		})
		return
	}

	if (pod_price == "" || !pod_price) {
		resp.status(400).send({
			success: false,
			message: "Please Provide Pod Price",
		})
		return
	}

	if (pod_code == "" || !pod_code) {
		resp.status(400).send({
			success: false,
			message: "Please Provide Pod Code",
		})
		return
	}

	db.query(
		`SELECT vendor_id FROM vendors WHERE vendor_id = "${vendor_id}"`,
		(error, data) => {
			if (error) {
				resp.status(500).send({
					success: false,
					message: error,
				})
				return
			}

			if (data.length === 0) {
				resp.status(200).send({
					success: false,
					message: "Vendor Id Does Not Exist",
				})
				return
			}
			db.query(
				`INSERT INTO purchase_order(vendor_id, po_code) VALUES('${vendor_id}', '${po_code}')`,
				(error, data) => {
					if (error) {
						resp.status(500).send({
							success: false,
							message: error,
						})
						return
					}
					db.query(
						`INSERT INTO purchase_order_details (po_id, pod_code, accounting_id, pod_type_id, pod_item, pod_quantity, unit_count_id, pod_price, pod_vat, pod_wht_id ) VALUES('${po_id}', '${pod_code}', '${accounting_id}', '${pod_type_id}', '${pod_item}', '${pod_quantity}', '${unit_count_id}', '${pod_price}', '${pod_vat}', '${pod_wht_id}')`,
						(insertErr, insertResp) => {
							if (insertErr) {
								resp.status(500).send({
									success: false,
									message: insertErr,
								})
								return
							}
							resp.status(200).send({
								success: true,
								message: "Purchase Order Successfully",
							})
							return
						},
					)
				},
			)
		},
	)
}

const newAddPurchaseOrder = async (req, resp) => {
	const { user_id, vendor_id, created, supplier_invoice_number, supplier_invoice_date } = req.body;
	try {
		// Format the supplier invoice date

		if (!created || created == "0000-00-00") {
			await db.query(
				`select * from Error_Messages where error_id =?`
				, [26], (err, data) => {
					if (err) throw err;

					resp.status(200).send({
						success: false,
						message_en: data[0].Error_en,
						message_th: data[0].Error_th,
					});
				})
			// If check message is null, show the success message

		}
		else {
			const formattedSupplierInvoiceDate = supplier_invoice_date
				? new Date(supplier_invoice_date).toISOString().slice(0, 10)
				: null;

			// Step 2: Insert the new purchase order
			const [data] = await db2.execute(
				`INSERT INTO purchase_order (vendor_id, PO_date, supplier_invoice_number, supplier_invoice_date, created, user_id) 
				VALUES ( ?, ?, ?, ?, ?, ?)`,
				[vendor_id, created, supplier_invoice_number || "", formattedSupplierInvoiceDate || null, created, user_id]
			);
			// await db2.execute("CALL Purchase_order_Number(?)", [data.insertId])
			await db2.execute("CALL Purchase_Order_New(?)", [data.insertId])
			await db2.execute("CALL Purchase_Order_New_B(?)", [data.insertId])

			// Send the response
			resp.status(200).json({ success: true, message: "Success", po_id: data.insertId });
		}
	} catch (e) {
		resp.status(500).json({ message: "Error has occurred", error: e.message });
	}
};

const getPurchaseOrder = (request, response) => {
	db.query("SELECT * FROM  purchase_order_details", (error, data) => {
		if (error) {
			response.status(500).send({
				success: false,
				message: error,
			})
			return
		}

		if (data.length === 0) {
			response.status(200).send({
				success: true,
				message: "No Data Found",
			})
			return
		}
		response.status(200).send({
			success: true,
			message: "Getting Data Successfully",
			data: data,
		})
		return
	})
}


const getNewPurchaseOrder = async (request, response) => {
	try {
		// Get 'status' from the request query or body (depending on how it's sent)
		const { status } = request.query; // or request.body if sent via POST request

		// Base query for selecting purchase orders
		let query = `
				SELECT purchase_order.*, setup_bank.bank_name as paid_with,
       DATE_FORMAT(purchase_order.created, '%Y-%m-%d') AS created, 
       DATE_FORMAT(purchase_order.supplier_invoice_date, '%Y-%m-%d') AS supplier_invoice_date, 
       dropdown_currency.currency AS currency
FROM purchase_order
LEFT JOIN dropdown_currency ON dropdown_currency.currency_id = purchase_order.FX_ID
LEFT JOIN setup_bank ON setup_bank.bank_id = purchase_order.paid_by`;

		// Add a condition to filter by PO_STATUS if the status is provided
		if (status !== undefined) {
			query += ` WHERE purchase_order.po_status = ${db.escape(status)} `;
		}

		// Order by po_code in descending order
		query += ` ORDER BY purchase_order.po_code DESC;`;

		// Execute the query
		db.query(query, async (error, data) => {
			if (error) {
				// console.error("Error executing main query: ", error); // Log the main query error
				return response.status(500).send({
					success: false,
					message: "Error executing main query",
					error: error.message
				});
			}

			if (data.length === 0) {
				return response.status(200).send({
					success: true,
					message: "No Data Found",
				});
			}

			// Process each item and fetch vendor type and PO status asynchronously
			try {
				const updatedData = await Promise.all(data.map(async (item) => {
					// Fetch vendor type
					const typeQuery = `SELECT * FROM dropdown_vendor_type WHERE vt_id='${item.Classification}'`;
					await new Promise((resolve, reject) => {
						db.query(typeQuery, (err, type) => {
							if (err) {
								console.error("Error fetching vendor type: ", err); // Log vendor type error
								return reject(new Error(`Error fetching vendor type for Classification ID ${item.Classification}`));
							}
							if (type.length > 0) {
								item.vendor_Type = type[0].name_th || "";
							} else {
								item.vendor_Type = "";
							}
							resolve();
						});
					});

					// Assign PO_STATUS to the item
					return item;
				}));

				return response.status(200).send({
					success: true,
					message: "Getting Data Successfully",
					data: updatedData,
				});

			} catch (mapError) {
				console.error("Error in Promise.all processing: ", mapError); // Log mapError
				return response.status(500).send({
					success: false,
					message: mapError.message || "Error fetching additional data",
				});
			}
		});
	} catch (err) {
		console.error("General server error: ", err); // Log general server error
		return response.status(500).send({
			success: false,
			message: err.message,
		});
	}
};



const getNewPurchaseOrderDetails = (req, res) => {
	const { po_id } = req.body;

	// First, fetch the purchase order details
	db.query(
		`SELECT
    a.po_id, a.po_code, 
    b.name AS vendor_name, b.address AS vendor_address, b.district AS vendor_district,
		b.postcode AS vendor_postcode, b.country AS vendor_country, b.line_id AS vendor_line_id, b.phone AS vendor_phone,
		b.bank_name AS vendor_bank_name, b.bank_number AS vendor_bank_number, b.bank_account AS vendor_bank_account,
    s.status,
    CASE
        WHEN a.user_id IS NOT NULL THEN u.name
        ELSE NULL
    END AS created_by
FROM purchase_order AS a
INNER JOIN vendors AS b ON a.vendor_id = b.vendor_id
LEFT JOIN purchase_order_details AS pod ON a.po_id = pod.po_id
INNER JOIN dropdown_status AS s ON a.po_status = s.status_id
LEFT JOIN users AS u ON u.id = a.user_id
WHERE a.po_id =?
GROUP BY a.po_id
ORDER BY a.po_code DESC;`, [po_id],
		(error, orderData) => {
			if (error) {
				res.status(500).send({
					success: false,
					message: error,
				});
				return;
			}

			if (orderData.length === 0) {
				res.status(200).send({
					success: true,
					message: "No Data Found",
				});
				return;
			}
			// Combine both order data and vendor data into the response
			res.status(200).send({
				success: true,
				message: "Getting Data Successfully",
				data: orderData[0]
			});
		}
	);
};



const updatePurchaseOrder = (request, response) => {
	const {
		pod_id,
		po_id,
		pod_code,
		accounting_id,
		pod_type_id,
		pod_item,
		pod_quantity,
		unit_count_id,
		pod_price,
		pod_vat,
		pod_wht_id,
		pod_line_total,
		pod_crate,
		pod_status,
		confirm,
		confirm_by,
		inventory,
		inventory_entry,
		vendor_id,
		po_code,
	} = request.body

	if (pod_id == "" || !pod_id) {
		response.status(400).send({
			success: false,
			message: "Please Provide Pod Id",
		})
		return
	}

	db.query(
		`SELECT pod_id FROM purchase_order_details WHERE pod_id = "${pod_id}"`,
		(error, data) => {
			if (error) {
				response.status(400).send({
					success: false,
					message: error,
				})
				return
			}

			if (data.length === 0) {
				response.status(200).send({
					success: false,
					message: "Pod Id Does Not Exist",
				})
				return
			}
			db.query(
				`UPDATE purchase_order_details SET pod_item = "${pod_item}", pod_quantity = "${pod_quantity}", unit_count_id = "${unit_count_id}", pod_price = "${pod_price}", pod_vat = "${pod_vat}" WHERE pod_id = "${pod_id}"`,
				(error, data) => {
					if (error) {
						response.status(500).send({
							success: false,
							message: error,
						})
						return
					}
					response.status(200).send({
						success: true,
						message: "Purchase Updated Successfully",
					})
					return
				},
			)
		},
	)
}

// const newUpdatePurchaseOrder = (req, res) => {
// 	const {
// 		po_id,
// 		vendor_id,
// 		created,
// 		supplier_invoice_number,
// 		supplier_invoice_date,
// 	} = req.body;

// 	// Call the function to get Vendor_name

// 	if (!created || created == "0000-00-00" || created == "") {
// 		db.query(
// 			`select * from Error_Messages where error_id =?`
// 			, [26], (err, data) => {
// 				if (err) throw err;

// 				res.status(200).send({
// 					success: false,
// 					message_en: data[0].Error_en,
// 					message_th: data[0].Error_th,
// 				});
// 			})
// 		// If check message is null, show the success message

// 	}
// 	else {
// 		db.query(`SELECT Vendor_name(?) AS vendor_name`, [vendor_id], (err, result) => {
// 			if (err) {
// 				return res.status(500).json({ success: false, message: "Internal Server Error" });
// 			}

// 			// Check if result has data
// 			if (result.length === 0) {
// 				return res.status(404).json({ success: false, message: "Vendor not found" });
// 			}

// 			const vendor_name = result[0].vendor_name;

// 			// Update purchase order
// 			const sql = `UPDATE purchase_order 
// 						 SET Vendor_name = ?, 
// 							 vendor_id = ?, 
// 							 created = ?, 
// 							 supplier_invoice_number = ?, 
// 							 supplier_invoice_date = ? 
// 						 WHERE po_id = ?`;

// 			db.query(sql, [
// 				vendor_name,
// 				vendor_id,
// 				created,
// 				supplier_invoice_number || null,
// 				supplier_invoice_date || null,
// 				po_id
// 			], (err, result) => {
// 				if (err) {
// 					return res.status(500).json({ success: false, message: "Internal Server Error" });
// 				}
// 				return res.status(200).json({ success: true, message: "Success" });
// 			});
// 		});
// 	}
// };


const newUpdatePurchaseOrder = (req, res) => {
	const {
		po_id,
		vendor_id,
		created,
		supplier_invoice_number,
		supplier_invoice_date,
	} = req.body;

	// Check if 'created' is null or invalid
	if (!created || created === "0000-00-00" || created === "") {
		db.query(
			`SELECT * FROM Error_Messages WHERE error_id = ?`,
			[26],
			(err, data) => {
				if (err) throw err;

				res.status(200).send({
					success: false,
					message_en: data[0].Error_en,
					message_th: data[0].Error_th,
				});
			}
		);
		return; // Exit after sending error response
	}

	// Process 'supplier_invoice_date' and other fields
	const formattedInvoiceDate =
		supplier_invoice_date === "0000-00-00" || !supplier_invoice_date
			? null
			: supplier_invoice_date;

	db.query(`SELECT Vendor_name(?) AS vendor_name`, [vendor_id], (err, result) => {
		if (err) {
			return res.status(500).json({ success: false, message: err.message });
		}

		if (result.length === 0) {
			return res.status(404).json({ success: false, message: "Vendor not found" });
		}

		const vendor_name = result[0].vendor_name;

		const sql = `UPDATE purchase_order 
				   SET Vendor_name = ?, 
					   vendor_id = ?, 
					   created = ?, 
					   supplier_invoice_number = ?, 
					   supplier_invoice_date = ? 
				   WHERE po_id = ?`;

		db.query(
			sql,
			[
				vendor_name,
				vendor_id,
				created,
				supplier_invoice_number || null,
				formattedInvoiceDate, // Use formatted date here
				po_id,
			],
			(err, result) => {
				if (err) {
					return res.status(500).json({ success: false, message: err.message });
				}
				return res.status(200).json({ success: true, message: "Success" });
			}
		);
	});
};

const purchaseOrderDetails = (req, res) => {
	const podId = req.body.pod_id

	if (podId == "" || !podId) {
		res.status(400).send({
			success: false,
			message: "Please Provide Pod Id",
		})
		return
	}

	db.query(
		`SELECT pod_id FROM purchase_order_details WHERE pod_id = "${podId}"`,
		(error, data) => {
			if (error) {
				res.status(500).send({
					success: false,
					message: error,
				})
				return
			}

			if (data.length === 0) {
				res.status(200).send({
					success: false,
					message: "Pod Id Does Not Exist",
				})
				return
			}
			db.query(
				`SELECT * FROM purchase_order_details WHERE pod_id = "${podId}"`,
				(error, data) => {
					if (error) {
						res.status(500).send({
							success: false,
							message: error,
						})
						return
					}
					res.status(200).send({
						success: true,
						message: "Getting Data Successfully",
						purchaseOrder: data[0],
					})
					return
				},
			)
		},
	)
}

/* const addPurchaseOrderDetails = async (req, res) => {
	const { data, po_id } = req.body;
	try {
		for (const v of data) {
			const {
				unit_count_id,
				pod_quantity,
				pod_price,
				pod_vat,
				pod_wht_id,
				pod_crate,
				POD_Selection
			} = v;
			// Using Promises to ensure asynchronous database calls complete before returning the response
			await new Promise((resolve, reject) => {
				const sql = `CALL Insert_Purchase_Order_Details(${po_id}, ${POD_Selection},  ${pod_quantity}, ${unit_count_id}, ${pod_price}, ${pod_vat}, ${pod_wht_id}, ${pod_crate})`;
				db.query(sql, (err, result) => {
					if (err) {
						reject(err);
					} else {
						resolve();
					}
				});
			});
		}
		return res.status(200).json({ success: true, message: "Success" });
	} catch (error) {
		return res.status(500).json({ success: false, message: "An error occurred", error: error.message });
	}
}; */


const addPurchaseOrderDetails = async (req, res) => {
	const { data, po_id } = req.body;
	try {
		for (const v of data) {
			const {
				unit_count_id,
				pod_quantity,
				pod_price,
				pod_vat,
				pod_wht_id,
				pod_crate,
				POD_Selection,
			} = v;

			// Generate pod_code based on the logic in the procedure
			const podcodeQuery = `
                SELECT CONCAT(
                    SUBSTR(po_code, 4, 11),
                    LPAD(
                        (SELECT COUNT(a.pod_id) + 1 
                         FROM purchase_order_details AS a 
                         WHERE a.po_id = ?), 
                        3, '0'
                    )
                ) AS pod_code 
                FROM purchase_order 
                WHERE po_id = ?`;
			const [podcodeResult] = await new Promise((resolve, reject) => {
				db.query(podcodeQuery, [po_id, po_id], (err, result) => {
					if (err) reject(err);
					else resolve(result);
				});
			});
			const pod_code = podcodeResult.pod_code;

			// Insert into purchase_order_details
			const insertQuery = `
                INSERT INTO purchase_order_details (
                    po_id, pod_code, pod_type_id, pod_item, pod_quantity, 
                    unit_count_id, pod_price, pod_vat, pod_wht_id, 
                    pod_crate, accounting_id, POD_SELECTION
                ) 
                SELECT 
                    ?, ?, Type, Item, ?, 
                    ?, ?, ?, ?, 
                    ?, chart_of_accounts, ?
                FROM POD_Selection_List 
                WHERE ID = ?`;
			await new Promise((resolve, reject) => {
				db.query(insertQuery, [
					po_id, pod_code, pod_quantity, unit_count_id, pod_price,
					pod_vat, pod_wht_id, pod_crate, POD_Selection, POD_Selection
				], (err) => {
					if (err) reject(err);
					else resolve();
				});
			});

			await db2.execute("CALL Purchase_Order_New_B(?)", [po_id])

			// Call Update_PO_Total stored procedure
			// const updateTotalQuery = `CALL Update_PO_Total(?)`;
			// await new Promise((resolve, reject) => {
			// 	db.query(updateTotalQuery, [po_id], (err) => {
			// 		if (err) reject(err);
			// 		else resolve();
			// 	});
			// });
		}

		return res.status(200).json({ success: true, message: "Success" });
	} catch (error) {
		return res.status(500).json({ success: false, message: "An error occurred", error: error.message });
	}
};



const getPurchaseOrderDetails = (req, res) => {
	const po_id = req.query.po_id
	const sql = `SELECT p.*, ps.ID as dropDown_id, ps.produce_name_en FROM purchase_order_details as p
	LEFT JOIN 
            POD_Selection_List ps ON ps.Item = p.pod_item AND ps.Type = p.pod_type_id
	 WHERE p.po_id = '${po_id}'`
	db.query(sql, (err, result) => {
		if (err) {
			return res
				.status(500)
				.json({ success: false, message: "Internal Server Error" })
		}

		return res
			.status(200)
			.json({ success: true, message: "Success", data: result })
	})
}

const purchaseOrderStatus = (req, resp) => {
	const po_id = req.body.po_id

	if (po_id == "" || !po_id) {
		resp.status(400).send({
			success: false,
			message: "Please Provide Pod Id",
		})
		return
	}

	db.query(
		`SELECT po_id, po_status FROM purchase_order WHERE po_id = "${po_id}"`,
		(error, data) => {
			if (error) {
				resp.status(500).send({
					success: false,
					message: error,
				})
				return
			}

			if (data.length === 0) {
				resp.status(200).send({
					success: false,
					message: "Po Id Does Not Exist",
				})
				return
			}
			db.query(
				`UPDATE purchase_order SET po_status = "${data[0].po_status == 0
				}" WHERE po_id = "${po_id}"`,
				(statusErr, statusResp) => {
					if (statusErr) {
						resp.status(500).send({
							success: false,
							message: statusErr,
						})
						return
					}
					resp.status(200).send({
						success: true,
						status: updatePurchaseStatus(),
						message: "Purchase Order Status Updated Successfully",
					})
					return
				},
			)
		},
	)
}

const getDropdownType = (req, res) => {
	db.query("SELECT * FROM dropdown_type", (error, data) => {
		if (error) {
			res.status(500).send({
				success: false,
				message: error,
			})
			return
		}

		res.status(200).send({
			success: true,
			message: "Getting Data Successfully",
			data: data,
		})
		return
	})
}

const deletePurchaseOrderDetails = (req, res) => {
	const pod_id = req.body.pod_id
	const sql = `DELETE FROM purchase_order_details WHERE pod_id = '${pod_id}' LIMIT 1`
	db.query(sql, (err, result) => {
		if (err) {
			return res
				.status(500)
				.json({ success: false, message: "Internal Server Error" })
		}
		return res.status(200).json({ success: true, message: "Success" })
	})
}

const updatePurchaseOrderDetails = async (req, res) => {
	const { data } = req.body
	for (const v of data) {
		const {
			pod_id,
			pod_type_id,
			unit_count_id,
			pod_item,
			pod_quantity,
			pod_price,
			pod_vat,
			pod_wht_id,
			pod_crate,
			dropDown_id
		} = v

		const query = 'SELECT * FROM POD_Selection_List WHERE ID=?';
		await db.query(query, [dropDown_id], (err, result) => {
			if (err) {
				return res
					.status(500)
					.json({ success: false, message: "Internal Server Error" })
			}
			const details = result[0];




			const sql = `UPDATE purchase_order_details SET pod_type_id = '${details.Type}', unit_count_id = '${unit_count_id}', pod_item = '${details.Item}', pod_quantity = '${pod_quantity}', pod_price = '${pod_price}', pod_vat = '${pod_vat}', pod_wht_id = '${pod_wht_id}', pod_crate = '${pod_crate}' WHERE pod_id = '${pod_id}'`
			db.query(sql, (err, result) => {
				if (err) {
					return res
						.status(500)
						.json({ success: false, message: "Internal Server Error" })
				}
			})
		})


	}

	return res.status(200).json({ success: true, message: "Success" })
}

//// find dublicate array

const purchaseOrderView = async (req, res) => {
	const { po_id } = req.body;

	// Step 1: Fetch purchase order details

	const sql = `
        SELECT p.*, u.unit_name_en 
        FROM purchase_order_details as p
        INNER JOIN dropdown_unit_count as u ON u.unit_id = p.unit_count_id
        WHERE p.po_id = ?`;

	db.query(sql, [po_id], async (err, result) => {
		if (err) {
			return res.status(500).json({ success: false, message: "Internal Server Error" });
		}

		if (!result.length) {
			return res.status(404).json({ success: false, message: "No records found for the provided purchase order ID." });
		}

		try {
			// Step 2: Call the stored procedure or fetch from the pod_selection_list table
			const podItems = result.map(item => item.pod_item); // Extract pod_items to use in the query
			const query = 'SELECT * FROM POD_Selection_List WHERE Item IN (?)';

			const procedureData = await new Promise((resolve, reject) => {
				db.query(query, [podItems], (error, data) => {
					if (error) return reject(error);
					resolve(data);
				});
			});

			// Step 3: Enrich order details with filtered data
			const enrichedResult = result.map(orderDetail => {
				// Filter procedure data based on pod_type_id and pod_item
				const matchingItem = procedureData.find(item =>
					Number(item.Item) === Number(orderDetail.pod_item) &&
					Number(item.Type) === Number(orderDetail.pod_type_id)
				);

				// If a matching item is found, add accounting and produce_en_name directly to orderDetail
				return {
					...orderDetail,
					typeNameen: matchingItem ? matchingItem.Acccount : null, // Replace accounting with type_name_en
					produceENname: matchingItem ? matchingItem.produce_name_en : null // Include produce_en_name
				};
			});

			// Step 4: Send the response
			return res.status(200).json({ success: true, message: "Success", data: enrichedResult });
		} catch (error) {
			return res.status(500).json({ success: false, message: error.message });
		}
	});
};



const getArrayValues = (req, res) => {
	const string = "Hello, world!";

	function revers(strings) {
		return strings.split('').reverse().join('')
	}
	let ans = revers(string)
	res.json({ ans })
}

const LastPurchase = async (req, res) => {
	try {
		db.query("SELECT *, DATE_FORMAT(date1, '%d/%m/%Y') as date1, DATE_FORMAT(date2, '%d/%m/%Y') as date2 FROM 1_day_produce_price_trend_view", (error, data) => {
			if (error) {
				res.status(500).send({
					success: false,
					message: error,
				})
				return
			}

			res.status(200).send({
				success: true,
				message: "Getting Data Successfully",
				data: data,
			})
			return
		})

	} catch (error) {
		// Send error response
		res.status(500).json({
			success: false,
			message: 'Internal server error',
			error: error.message
		});
	}
}

const purchaseOrderPayment = async (req, res) => {
	try {
		const {
			Vendor_ID,
			Payment_date,
			Payment_Channel,
			FX_Payment,
			FX_ID,
			FX_Rate,
			Intermittent_bank_charges,
			Local_bank_Charges,
			THB_Paid,
			LOSS_GAIN_THB,
			Client_payment_ref,
			Bank_Ref,
			Notes,
			user_id
		} = req.body;

		// Log the request body for debugging

		await db.query(
			`INSERT INTO Expense_payment(Vendor_ID, 
				Payment_date, 
				Payment_Channel, 
				FX_Payment, 
				FX_ID, 
				FX_Rate, 
				Intermittent_bank_charges, 
				Local_bank_Charges,  
				THB_Paid, 
				Rounding, 
				Client_payment_ref, 
				Bank_Ref, Notes, user_id) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [Vendor_ID,
			Payment_date,
			Payment_Channel,
			FX_Payment,
			FX_ID,
			FX_Rate,
			Intermittent_bank_charges,
			Local_bank_Charges,
			THB_Paid,
			LOSS_GAIN_THB,
			Client_payment_ref,
			Bank_Ref, Notes || null, user_id],
			(error, data) => {
				if (error) {
					resp.status(500).send({
						success: false,
						message: error,
					})
					return
				}

				db2.execute("CALL Expense_payment()")

				res.status(200).send({
					success: true,
					message: "Purchase Order Successfully",
					data: data.insertId
				})
				return
			},
		)

	} catch (error) {
		// Send error response
		return res.status(500).json({
			success: false,
			message: 'Internal server error',
			error: error.message,
		});
	}
};

const RecordCommissionPayment = async (req, res) => {
	try {
		const {
			Vendor_ID,
			Payment_date,
			Payment_Channel,
			FX_Payment,
			FX_ID,
			FX_Rate,
			Intermittent_bank_charges,
			Local_bank_Charges,
			Client_payment_ref,
			Bank_Ref,
			Notes,
			user_id
		} = req.body;

		// Log the request body for debugging

		await db.query(
			`INSERT INTO Expense_payment(Vendor_ID, 
				Payment_date, 
				Payment_Channel, 
				FX_Payment, 
				FX_ID, 
				FX_Rate, 
				Intermittent_bank_charges,  
				Local_bank_Charges, 
				Client_payment_ref, 
				Bank_Ref, Notes, V, C, user_id) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?,?)`, [Vendor_ID,
			Payment_date,
			Payment_Channel,
			FX_Payment,
			FX_ID,
			FX_Rate,
			Intermittent_bank_charges,
			Local_bank_Charges,
			Client_payment_ref,
			Bank_Ref, Notes || null, null, 1, user_id || null],
			(error, data) => {
				if (error) {
					resp.status(500).send({
						success: false,
						message: error,
					})
					return
				}

				// db2.execute("CALL Expense_payment()")
				db.query('CALL Commission_Payement_Record(?)', [data.insertId], (error, results) => {
					if (error) throw error;
				})
				res.status(200).send({
					success: true,
					message: "Added Successfully",
					data: data.insertId
				})
				return
			},
		)

	} catch (error) {
		// Send error response
		return res.status(500).json({
			success: false,
			message: 'Internal server error',
			error: error.message,
		});
	}
};


const purchaseOrderPaymentDetails = (req, res) => {
	const paymentDetailsArray = req.body.paymentDetailsArray;
	// Check if paymentDetailsArray exists, is an array, and is not empty
	if (!paymentDetailsArray || !Array.isArray(paymentDetailsArray) || paymentDetailsArray.length === 0) {
		return res.status(400).json({
			success: false,
			message: 'No payment details provided or invalid format',
		});
	}

	// Function to process payment details one by one
	const processDetails = (index) => {
		// If all details have been processed, send a success response
		if (index >= paymentDetailsArray.length) {
			return res.status(200).json({
				success: true,
				message: "Data inserted successfully"
			});
		}

		const {
			V_Payment_ID,
			PO_id,
			CNF_FX
		} = paymentDetailsArray[index];

		// Process each payment detail using a stored procedure
		db.query('CALL Expense_payment_Details(?,?,?)', [V_Payment_ID, PO_id, CNF_FX], (error, results) => {
			if (error) {
				// If an error occurs, send an error response and stop further processing
				return res.status(500).json({
					success: false,
					message: 'Error inserting payment details',
					error: error.message
				});
			}

			// Proceed to the next payment detail after successful insertion
			processDetails(index + 1);
		});
	};

	// Start processing the first item in the array
	processDetails(0);
};


const RecordCommissionPaymentDetails = (req, res) => {
	const paymentDetailsArray = req.body.paymentDetailsArray;

	// Check if paymentDetailsArray exists, is an array, and is not empty
	if (!paymentDetailsArray || !Array.isArray(paymentDetailsArray) || paymentDetailsArray.length === 0) {
		return res.status(400).json({
			success: false,
			message: 'No payment details provided or invalid format',
		});
	}

	// Function to process payment details one by one
	const processDetails = (index) => {
		// If all details have been processed, send a success response
		if (index >= paymentDetailsArray.length) {
			return res.status(200).json({
				success: true,
				message: "Data inserted successfully"
			});
		}

		const {
			Payment_ID, Client_ID, Invoice_ID, Paid_Amount
		} = paymentDetailsArray[index];

		// Process each payment detail by inserting into the table
		const query = `INSERT INTO Commissions (Payment_ID, Client_ID, Invoice_ID, Commision_FX_Paid) VALUES (?, ?, ?, ?)`;
		db.query(query, [Payment_ID, Client_ID, Invoice_ID, Paid_Amount], (error, results) => {
			if (error) {
				// If an error occurs, send an error response and stop further processing
				return res.status(500).json({
					success: false,
					message: 'Error inserting payment details',
					error: error.message
				});
			}

			// Proceed to the next payment detail after successful insertion
			processDetails(index + 1);
		});
	};

	// Start processing the first item in the array
	processDetails(0);
};


const purchaseOrderListByVendor = async (req, res) => {
	try {
		const { vendor_id } = req.body;
		db.query('CALL Expense_Payment_list(?)', [vendor_id], (error, results) => {
			if (error) throw error;

			const transformKeys = (data) => {
				return data.map(record => {
					return {
						po_id: record.po_id,
						PO_Code: record.PO_Code,
						PO_Date: record.PO_Date,
						Invoice_Number: record.Invoice_Number,
						Invoice_Date: record.Invoice_Date,
						PO_Amount: record.PO_Amount,
						Debit_Note: record.Debit_Note,
						Net_Amount: record.Net_Amount,
						Past_payment: record.Past_payment,
						amount_to_pay: record['Amount to Pay']
					};
				});
			};

			// Transform the keys of the result data
			const transformedData = transformKeys(results[0]);

			// Send a success response
			res.status(200).json({
				success: true,
				message: 'Client and Consignee Invoice Details',
				data: transformedData
			});
		});

		// Define the transformKeys function to rename the keys

	} catch (error) {
		res.status(500).json({
			success: false,
			message: 'Internal server error',
			error: error.message,
		});
	}
}

const PurchaseStatistics = (req, res) => {
	try {
		// Call the stored procedure
		db.query('CALL Purchase_statistics(@total_payable)', (error, data) => {
			if (error) {
				return res.status(500).json({
					success: false,
					message: 'Error calling stored procedure',
					error: error.message
				});
			}

			// Fetch the output parameter
			db.query('SELECT @total_payable AS total_payable', (error, results) => {
				if (error) {
					return res.status(500).json({
						success: false,
						message: 'Error fetching total payable',
						error: error.message
					});
				}

				// Send the response with both results from stored procedure and output parameter
				return res.status(200).json({
					success: true,
					total_payable: results[0]?.total_payable || 0, // Ensure total_payable is returned safely
					Top_payable_accounts: data[0],
					pie_chart: data[1][0],
					All_Payable: data[2][0],
					data
				});
			});
		});
	} catch (error) {
		// Global catch for any uncaught errors
		res.status(500).json({
			success: false,
			message: 'Internal server error',
			error: error.message
		});
	}
};

const SuggestedPurchases = async (req, res) => {
	try {
		db.query("SELECT * FROM Suggested_purchases", (error, data) => {
			if (error) {
				res.status(500).send({
					success: false,
					message: error,
				})
				return
			}

			res.status(200).send({
				success: true,
				message: "Getting Data Successfully",
				data: data,
			})
			return
		})

	} catch (error) {
		// Send error response
		res.status(500).json({
			success: false,
			message: 'Internal server error',
			error: error.message
		});
	}
}

const DeletePurchase = async (req, res) => {
	try {
		// Call the stored procedure
		const { po_id } = req.body;

		db.query('CALL Delete_Purchase_order(?,@Message_EN, @Message_TH)', [po_id], (error, data) => {
			if (error) throw error;
			// Fetch the output parameter
			db.query('SELECT @Message_EN AS Message_EN, @Message_TH AS Message_TH', (error, results) => {
				if (error) throw error;
				// Send the response with both results from stored procedure and output parameter
				return res.status(200).json({
					success: true,
					Message_EN: results[0]?.Message_EN,// Ensure total_payable is returned safely
					Message_TH: results[0]?.Message_TH
				});
			});
		});
	} catch (error) {
		// Global catch for any uncaught errors
		res.status(500).json({
			success: false,
			message: 'Internal server error',
			error: error.message
		});
	}
}


const CancelPurchaseOrder = async (req, res) => {
	try {
		// Extract `po_id` from request body
		const { po_id } = req.body;

		if (!po_id) {
			return res.status(400).json({ success: false, message: "Purchase Order ID is required." });
		}

		// Delete from purchase_order_details
		const deleteDetailsQuery = `DELETE FROM purchase_order_details WHERE po_id = ?`;
		await db.query(deleteDetailsQuery, [po_id], (err, result) => {
			if (err) throw err;
		});


		// Delete from purchase_order
		const deleteOrderQuery = `DELETE FROM purchase_order WHERE po_id = ?`;
		await db.query(deleteOrderQuery, [po_id], (err, result) => {
			if (err) reject(err);
		});

		// Send success response
		return res.status(200).json({
			success: true,
			message: "Purchase order and its details Cancelled successfully.",
		});
	} catch (error) {
		// Send error response
		return res.status(500).json({
			success: false,
			message: "An error occurred while deleting the purchase order.",
			error: error.message,
		});
	}
};


const PurchaseVendorStatement = async (req, res) => {
	try {
		// Call the stored procedure

		const { Vendor_ID, From_date, To_date } = req.body;

		db.query('CALL Vendor_statement_2(?, ?, ?, @pre_statement_Invoices, @pre_statement_claims, @pre_statement_payments, @pre_statement_Totals, @statement_Invoices, @statement_claims, @statement_payments, @statement_Totals, @Total_Invoices, @Total_Claims, @Total_Payment, @Total)', [Vendor_ID, From_date, To_date], (error, data) => {
			if (error) throw error;
			// Fetch the output parameter
			db.query('SELECT @pre_statement_Invoices as pre_statement_Invoices, @pre_statement_claims as pre_statement_claims, @pre_statement_payments as pre_statement_payments, @pre_statement_Totals as pre_statement_Totals, @statement_Invoices as statement_Invoices, @statement_claims as statement_claims, @statement_payments as statement_payments, @statement_Totals as statement_Totals, @Total_Invoices as Total_Invoices, @Total_Claims as Total_Claims, @Total_Payment as Total_Payment, @Total as Total', (error, results) => {
				if (error) throw error;
				db.query(
					"SELECT * FROM `Company_Address` WHERE `ID` = ?",
					[3],
					(error, address) => {
						if (error) throw error;
						const Company_Address = address[0];
						// Send the response with both results from stored procedure and output parameter
						db.query(
							"SELECT * FROM `vendors` WHERE `vendor_id` = ?",
							[Vendor_ID],
							(error, vendorData) => {
								if (error) throw error;


								const transformKeys = (data) => {
									return data.map(record => {
										return {
											date: record.Date,
											PO_Number: record['PO Number'],
											transaction_ref: record['Transaction Ref'],
											currency: record.Currency,
											Amount: record.Amount,
											Paid_Amount: record['Paid Amount'],
											Vendore_Reference: record['Vendore Reference'],
											Invoice_Date: record['Invoice Date'],
											AWB: record.AWB
										};
									});
								};

								// Transform the keys of the result data
								const transformedData = transformKeys(data[0]);
								return res.status(200).json({
									success: true,
									data: results[0],
									Company_Address: Company_Address,
									vendorData: vendorData[0],
									TableData: transformedData
								});
							})
					})
			});
		});
	} catch (error) {
		// Global catch for any uncaught errors
		res.status(500).json({
			success: false,
			message: 'Internal server error',
			error: error.message
		});
	}
}

const PurchaseTypeItemsList = async (req, res) => {
	try {
		db.query('select * from POD_Selection_List', (error, data) => {
			if (error) throw error;

			return res.status(200).json({
				success: true,
				data: data
			});
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: 'Internal server error',
			error: error.message
		});
	}
}

const purchaseOrderPdfDetails = async (req, res) => {
	try {
		const { po_id } = req.body;

		// Step 1: Fetch the company address details
		const companyAddressQuery = 'SELECT * FROM `Company_Address` WHERE `ID` = ?';
		const companyAddress = await new Promise((resolve, reject) => {
			db.query(companyAddressQuery, [3], (err, result) => {
				if (err) return reject(err);
				resolve(result[0]); // Assuming you want the first result
			});
		});

		// Step 2: Fetch vendor and purchase order details
		const sqlData = `
    SELECT 
        b.vendor_id, 
        Vendor_name_Address(b.vendor_id) AS vendor_name_address, 
        b.bank_name AS vendor_bank_name, 
        b.bank_number AS vendor_bank_number, 
        b.bank_account AS vendor_bank_account
    FROM purchase_order AS a
    INNER JOIN vendors AS b ON a.vendor_id = b.vendor_id
    WHERE a.po_id = ?`;

		const vendorDetails = await new Promise((resolve, reject) => {
			db.query(sqlData, [po_id], (err, result) => {
				if (err) {
					console.error("SQL Error: ", err); // Log the SQL error
					return reject(err);
				}
				resolve(result[0]); // Assuming you want the first result
			});
		});
		// Step 3: Fetch purchase order details along with line total calculation
		const sql = `
			SELECT 
				p.*, 
				u.unit_name_en,
				(p.pod_quantity * p.pod_price) AS line_total,  -- Calculating the line total for each item
				p.VAT_value AS item_vat,                           -- Include item VAT
				p.WHT_value AS item_wht                         -- Include item WHT (Withholding Tax)
			FROM purchase_order_details as p
			INNER JOIN dropdown_unit_count as u ON u.unit_id = p.unit_count_id
			WHERE p.po_id = ?`;

		const purchaseOrderDetails = await new Promise((resolve, reject) => {
			db.query(sql, [po_id], (err, result) => {
				if (err) return reject(err);
				if (!result.length) {
					return res.status(404).json({ success: false, message: "No records found for the provided purchase order ID." });
				}
				resolve(result);
			});
		});

		// Step 4: Calculate the total sum of all items, total VAT, and total WHT
		const totalAllAndVatQuery = `
			SELECT 
				SUM(p.pod_quantity * p.pod_price) AS total_all,    -- Total sum of all items
				SUM(p.VAT_value) AS total_vat,                       -- Total VAT
				SUM(p.WHT_value) AS total_WHT                     -- Total Withholding Tax
			FROM purchase_order_details AS p
			WHERE p.po_id = ?`;

		const totalValues = await new Promise((resolve, reject) => {
			db.query(totalAllAndVatQuery, [po_id], (err, result) => {
				if (err) return reject(err);
				const { total_all, total_vat, total_WHT } = result[0]; // Destructure the result
				resolve({ total_all, total_vat, total_WHT });
			});
		});

		// Calculate the payable amount
		const payable = totalValues.total_all + totalValues.total_vat - totalValues.total_WHT;

		// Step 5: Fetch POD selection list based on the pod_items
		const podItems = purchaseOrderDetails.map(item => item.pod_item); // Extract pod_items to use in the query
		const podSelectionQuery = 'SELECT * FROM POD_Selection_List WHERE Item IN (?)';

		const procedureData = await new Promise((resolve, reject) => {
			db.query(podSelectionQuery, [podItems], (error, data) => {
				if (error) return reject(error);
				resolve(data);
			});
		});

		// Step 6: Enrich order details with filtered data
		const enrichedResult = purchaseOrderDetails.map(orderDetail => {
			// Filter procedure data based on pod_type_id and pod_item
			const matchingItem = procedureData.find(item =>
				Number(item.Item) === Number(orderDetail.pod_item) &&
				Number(item.Type) === Number(orderDetail.pod_type_id)
			);

			// If a matching item is found, add accounting and produce_en_name directly to orderDetail
			return {
				...orderDetail,
				typeNameen: matchingItem ? matchingItem.Acccount : null, // Replace accounting with type_name_en
				produceENname: matchingItem ? matchingItem.produce_name_en : null // Include produce_en_name
			};
		});

		// Step 7: Send the response
		return res.status(200).json({
			success: true,
			message: "Success",
			data: enrichedResult,
			vendor_details: vendorDetails,
			companyAddress: companyAddress,
			total_all: totalValues.total_all,  // Include the total sum in the response
			total_vat: totalValues.total_vat,  // Include the total VAT in the response
			total_WHT: totalValues.total_WHT,  // Include the total Withholding Tax in the response
			payable: payable                   // Include the payable amount in the response
		});
	} catch (error) {
		// Handle any errors and send a 500 status code
		return res.status(500).json({ success: false, message: error.message });
	}
};


const expensePaymentSlip = async (req, res) => {
	try {
		const { Expense_Payment_ID } = req.body;
		// console.log(Expense_Payment_ID);
		const companyAddressQuery = 'SELECT * FROM `Company_Address` WHERE `ID` = ?';
		const companyAddress = await new Promise((resolve, reject) => {
			db.query(companyAddressQuery, [3], (err, result) => {
				if (err) return reject(err);
				resolve(result[0]); // Assuming you want the first result
			});
		});
		// Properly await the result of the procedure call
		const [data] = await db2.execute("CALL Expence_Payment_Slip(?)", [Expense_Payment_ID]);

		// console.log(data); // Log the data returned from the query
		const vendor_address = data[0][0]
		const bank_details = data[1][0]
		const table_data = data[2]
		const total_all = data[3][0]
		// Send the response with the data

		res.status(200).json({ success: true, message: "Success", companyAddress: companyAddress || {}, vendorAddress: vendor_address || {}, bank_details: bank_details || {}, table_data: table_data, total_all: total_all || {} });

	} catch (e) {
		console.error(e.message); // Log the error for debugging
		res.status(500).json({ message: "Error has occurred", error: e.message });
	}
};


const InvoicePaymentSlip = async (req, res) => {
	try {
		const { Invoice_Payment_ID } = req.body;
		const companyAddressQuery = 'SELECT * FROM `Company_Address` WHERE `ID` = ?';
		const companyAddress = await new Promise((resolve, reject) => {
			db.query(companyAddressQuery, [3], (err, result) => {
				if (err) return reject(err);
				resolve(result[0]); // Assuming you want the first result
			});
		});
		// Properly await the result of the procedure call
		const [data] = await db2.execute("CALL Invoice_Payment_Slip(?)", [Invoice_Payment_ID]);

		//	const bank_details = data[1][0]
		const headerData = data[0][0]
		const table_data = data[1]

		res.status(200).json({ success: true, message: "Success", companyAddress: companyAddress, table_data: table_data, headerData: headerData || {} });

	} catch (e) {
		res.status(500).json({ message: "Error has occurred", error: e.message });
	}
};


const CommissionPaymentSlip = async (req, res) => {
	try {
		const { Expense_Payment_ID } = req.body;

		// Step 1: Get company address
		const companyAddressQuery = 'SELECT * FROM `Company_Address` WHERE `ID` = ?';
		const companyAddress = await new Promise((resolve, reject) => {
			db.query(companyAddressQuery, [3], (err, result) => {
				if (err) return reject(err);
				resolve(result[0]); // Assuming you want the first result
			});
		});

		// Step 2: Get Vendor ID
		const vendorQuery = `SELECT Expense_payment.Vendor_ID FROM Expense_payment 
		WHERE Expense_payment.V_payment_id = ?`;
		const [vendorResult] = await new Promise((resolve, reject) => {
			db.query(vendorQuery, [Expense_Payment_ID], (err, result) => {
				if (err) return reject(err);
				resolve(result);
			});
		});


		// Check if vendorResult has data
		if (!vendorResult || vendorResult.length === 0) {
			return res.status(400).json({ message: "Vendor not found for the given payment ID" });
		}

		const vendorID = vendorResult.Vendor_ID;

		// Step 3: Get Vendor Name Address
		const vendorNameAddressQuery = 'SELECT Vendor_name_Address.Name_exp_2 FROM Vendor_name_Address WHERE Vendor_name_Address.vendor_id = ?';
		const [vendorNameAddress] = await new Promise((resolve, reject) => {
			db.query(vendorNameAddressQuery, [vendorID], (err, result) => {
				if (err) return reject(err);
				resolve(result);
			});
		});

		// Step 4: Get Vendor Bank Details and Payment Information
		const vendorBankDetailsQuery = `
		SELECT 
		  vendors.bank_name,
		  vendors.bank_number,
		  vendors.bank_account,
		  Expense_payment.Payment_date,
		  setup_bank.Bank_nick_name
		FROM vendors
		JOIN Expense_payment ON Expense_payment.Vendor_ID = vendors.vendor_id
		JOIN setup_bank ON Expense_payment.Payment_Channel = setup_bank.bank_id
		WHERE vendors.vendor_id = ? AND Expense_payment.V_payment_id = ?
	  `;
		const [vendorBankDetails] = await new Promise((resolve, reject) => {
			db.query(vendorBankDetailsQuery, [vendorID, Expense_Payment_ID], (err, result) => {
				if (err) return reject(err);
				resolve(result);
			});
		});

		// Step 5: Get Commission Data
		const commissionDataQuery = `SELECT Commissions.*, Invoices.Invoice_number, Expense_payment.Payment_date, dropdown_currency.currency AS currency  FROM Commissions 
		INNER JOIN Invoices ON Invoices.Invoice_id = Commissions.Invoice_ID
		INNER JOIN Expense_payment ON Expense_payment.V_payment_id = Commissions.Payment_ID
		INNER JOIN dropdown_currency ON dropdown_currency.currency_id= Expense_payment.FX_ID
		WHERE Commissions.Payment_ID = ?`;
		const commissionData = await new Promise((resolve, reject) => {
			db.query(commissionDataQuery, [Expense_Payment_ID], (err, result) => {
				if (err) return reject(err);
				resolve(result);
			});
		});

		// Step 6: Get Total Commission and WHT
		const totalDataQuery = `
		SELECT 
		  SUM(Commision_THB) AS total_commision_THB, 
		  SUM(WHT_15) AS total_WHT, 
		  SUM(Commision_THB) - SUM(WHT_15) AS AllTotal 
		FROM Commissions 
		WHERE Payment_ID = ?
	  `;
		const [totalData] = await new Promise((resolve, reject) => {
			db.query(totalDataQuery, [Expense_Payment_ID], (err, result) => {
				if (err) return reject(err);
				resolve(result);
			});
		});

		// Sending the response with all the gathered data
		res.status(200).json({
			success: true,
			message: "Success",
			companyAddress,
			table_data: commissionData,
			headerData: vendorNameAddress || {},
			vendorBankDetails: vendorBankDetails || {},
			Toataldata: totalData || {},
			vendorResult
		});

	} catch (e) {
		res.status(500).json({ message: "Error has occurred", error: e.message });
	}
};


//  Purchase_Order_Packaging_Payable
const PurchaseOrderPackagingPayable = async (req, res) => {
	try {
		// Properly await the result of the procedure call
		const [data] = await db2.execute("CALL Purchase_Order_Packaging_Payable()");

		// console.log(data); // Log the data returned from the query
		// Send the response with the data

		res.status(200).json({ success: true, message: "Success", data: data[0] || {} });

	} catch (e) {
		console.error(e.message); // Log the error for debugging
		res.status(500).json({ message: "Error has occurred", error: e.message });
	}
};

const RecordCommission = async (req, res) => {
	try {
		const { client_id, consignee_id } = req.body;
		// Properly await the result of the procedure call
		const [data] = await db2.execute("CALL Commission_list(?,?)", [client_id, consignee_id || 0]);
		// Send the response with the data

		res.status(200).json({ success: true, message: "Success", data: data[0] });

	} catch (e) {
		console.error(e.message); // Log the error for debugging
		res.status(500).json({ message: "Error has occurred", error: e.message });
	}
};


const DebitNotes = async (req, res) => {
	try {
		const {
			Debit_date,
			PO_ID,
			Vendor_ID,
			FX_ID,
			User_id
		} = req.body;

		// Log the request body for debugging

		await db.query(
			`INSERT INTO Debit_Notes(Debit_date,
			PO_ID,
			Vendor_ID,
			FX_ID, User_id) VALUES(?, ?, ?, ?, ?)`, [Debit_date,
			PO_ID,
			Vendor_ID,
			FX_ID, User_id],
			(error, data) => {
				if (error) {
					resp.status(500).send({
						success: false,
						message: error,
					})
					return
				}

				// db2.execute("CALL Expense_payment()")
				db.query('CALL Debit_Note_New(?)', [data.insertId], (error, results) => {
					if (error) throw error;
				})
				res.status(200).send({
					success: true,
					message: "Added  Successfully",
					data: data.insertId
				})
				return
			},
		)

	} catch (error) {
		// Send error response
		return res.status(500).json({
			success: false,
			message: 'Internal server error',
			error: error.message,
		});
	}
}

const DebitNotesDetails = (req, res) => {
	const DebitNotesDetails = req.body.DebitNotesDetailsArray;

	// Check if paymentDetailsArray exists, is an array, and is not empty
	if (!DebitNotesDetails || !Array.isArray(DebitNotesDetails) || DebitNotesDetails.length === 0) {
		return res.status(400).json({
			success: false,
			message: 'No payment details provided or invalid format',
		});
	}

	// Function to process payment details one by one
	const processDetails = (index) => {
		// If all details have been processed, send a success response
		if (index >= DebitNotesDetails.length) {
			return res.status(200).json({
				success: true,
				message: "Data inserted successfully"
			});
		}

		const {
			Debit_Note_ID, POD_ID, Item, QTY, Unit, Debit_Amount
		} = DebitNotesDetails[index];

		// Process each payment detail by inserting into the table
		const query = `INSERT INTO Debit_Note_Details (Debit_Note_ID, POD_ID, Item, QTY, Unit, Debit_Amount) VALUES (?, ?, ?, ?, ?, ?)`;
		db.query(query, [Debit_Note_ID, POD_ID, Item, QTY, Unit, Debit_Amount], (error, results) => {
			if (error) {
				// If an error occurs, send an error response and stop further processing
				return res.status(500).json({
					success: false,
					message: 'Error inserting payment details',
					error: error.message
				});
			}

			// Proceed to the next payment detail after successful insertion
			processDetails(index + 1);
		});
	};

	// Start processing the first item in the array
	processDetails(0);
};

module.exports = {
	addPurchageOrder,
	newAddPurchaseOrder,
	getPurchaseOrder,
	updatePurchaseOrder,
	purchaseOrderDetails,
	purchaseOrderStatus,
	getDropdownType,
	getNewPurchaseOrder,
	newUpdatePurchaseOrder,
	addPurchaseOrderDetails,
	getPurchaseOrderDetails,
	deletePurchaseOrderDetails,
	updatePurchaseOrderDetails,
	purchaseOrderView,
	getArrayValues,
	LastPurchase,
	purchaseOrderPayment,
	purchaseOrderPaymentDetails,
	purchaseOrderListByVendor,
	PurchaseStatistics,
	getNewPurchaseOrderDetails,
	SuggestedPurchases,
	DeletePurchase,
	PurchaseVendorStatement,
	PurchaseTypeItemsList,
	purchaseOrderPdfDetails,
	expensePaymentSlip,
	CommissionPaymentSlip,
	InvoicePaymentSlip,
	PurchaseOrderPackagingPayable,
	RecordCommission,
	RecordCommissionPayment,
	RecordCommissionPaymentDetails,
	DebitNotes,
	DebitNotesDetails
}
