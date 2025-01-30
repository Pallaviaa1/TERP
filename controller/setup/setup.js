const db = require("../../db/dbConnection")
const getInventoryID = require("../../function/genInventoryID")
const { db: db2 } = require("../../db/db2")

const addPackage = async (req, res) => {
	const packagingName = req.body.packaging_name
	const packagingWeight = req.body.packaging_weight
	const packagingInventoryTypeId = req.body.packaging_inventory_type_id
	const inventoryId = req.body.Inventory_ID
	const user_id = req.body.user_id
	try {
		const query =
			"INSERT INTO setup_packaging(packaging_name, packaging_weight, Inventory_ID, packaging_inventory_type_id, user_id) VALUES (?, ?, ?, ?, ?)"
		const values = [
			packagingName,
			packagingWeight,
			inventoryId,
			packagingInventoryTypeId,
			user_id
		]
		const [data] = await db2.execute(query, values)
		await db2.execute(
			"UPDATE setup_packaging SET Inventory_ID = ? WHERE packaging_id = ?",
			[
				getInventoryID(data.insertId, "", packagingInventoryTypeId),
				data.insertId,
			],
		)
		res.status(200).send({
			success: true,
			message: "Packaging Added Successfully",
		})
	} catch (e) {
		res.status(500).send({
			success: false,
			message: e,
		})
	}
}

const updatePackaging = async (req, res) => {
	const packagingId = req.body.packaging_id
	const packagingName = req.body.packaging_name
	const packagingWeight = req.body.packaging_weight
	const packaging_inventory_type_id = req.body.packaging_inventory_type_id
	const Inventory_ID = req.body.Inventory_ID

	try {
		await db2.execute(
			`UPDATE setup_packaging SET packaging_name = "${packagingName}", packaging_weight = "${packagingWeight}", Inventory_ID = "${getInventoryID(
				packagingId,
				"",
				packaging_inventory_type_id,
			)}", packaging_inventory_type_id="${packaging_inventory_type_id}" WHERE packaging_id = "${packagingId}"`,
		)
		res.status(200).send({
			success: true,
			message: "Packaging Updated Successfully",
		})
	} catch (e) {
		res.status(500).send({
			success: false,
			message: e,
		})
	}
}

const getAllPackaging = (req, res) => {
	db.query("SELECT * FROM setup_packaging", (error, getPackagingData) => {
		if (error) {
			res.status(500).send({
				success: false,
				message: error,
			})
			return
		}
		res.status(200).send({
			success: true,
			message: "Getting Packaging Data Successfully",
			data: getPackagingData,
		})
		return
	})
}

const addAirport = (req, res) => {
	const {
		port_type_id,
		port_name,
		port_country,
		port_city,
		Seaport_code,
		IATA_code,
		ICAO_Code,
		preferred_clearance,
		preferred_transport,
		prefered_liner,
		user_id
	} = req.body;

	if (!port_type_id) {
		res.status(400).send({
			success: false,
			message: "Please Provide Port Type Id",
		});
		return;
	}

	if (!port_name) {
		res.status(400).send({
			success: false,
			message: "Please Enter Port Name",
		});
		return;
	}

	if (!port_country) {
		res.status(400).send({
			success: false,
			message: "Please Enter Port Country",
		});
		return;
	}

	if (!port_city) {
		res.status(400).send({
			success: false,
			message: "Please Enter Port City",
		});
		return;
	}

	db.query(
		`SELECT port_name FROM setup_ports WHERE port_name = ?`,
		[port_name],
		(error, data) => {
			if (error) {
				res.status(500).send({
					success: false,
					message: error,
				});
				return;
			}

			if (data.length > 0) {
				res.status(200).send({
					success: false,
					message: "Port Name Already Exists",
				});
				return;
			}

			db.query(
				`INSERT INTO setup_ports (port_type_id, user_id, port_name, port_country, port_city, status, IATA_code, ICAO_Code, Seaport_code, preferred_clearance, preferred_transport, prefered_liner) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
				[port_type_id, user_id, port_name, port_country, port_city, "on", IATA_code, ICAO_Code, Seaport_code, preferred_clearance, preferred_transport, prefered_liner],
				(insertErr, updateErr) => {
					if (insertErr) {
						res.status(500).send({
							success: false,
							message: insertErr.message,
						});
						return;
					}
					res.status(200).send({
						success: true,
						message: "Port Added Successfully",
					});
					return;
				}
			);
		}
	);
};


const updateAirPort = (req, res) => {
	const {
		port_id,
		port_type_id,
		port_name,
		port_country,
		port_city,
		Seaport_code,
		IATA_code,
		ICAO_Code,
		preferred_clearance,
		preferred_transport,
		prefered_liner
	} = req.body
	if (port_id == "" || !port_id) {
		res.status(400).send({
			success: false,
			message: "Please Provide Port Id",
		})
		return
	}

	if (port_type_id == "" || !port_type_id) {
		res.status(400).send({
			success: false,
			message: "Please Provide Port Type Id",
		})
		return
	}

	if (port_name == "" || !port_name) {
		res.status(400).send({
			success: false,
			message: "Please Provide Port Name",
		})
		return
	}

	if (port_country == "" || !port_country) {
		res.status(400).send({
			success: false,
			message: "Please Provide Country",
		})
		return
	}

	if (port_city == "" || !port_city) {
		res.status(400).send({
			success: false,
			message: "Port Provide City",
		})
		return
	}

	db.query(
		`SELECT port_id FROM setup_ports WHERE port_id = "${port_id}"`,
		(err, data) => {
			if (err) {
				res.status(500).send({
					success: false,
					message: err,
				})
				return
			}

			if (data.length === 0) {
				res.status(200).send({
					success: false,
					message: "Port Id Does Not Exist",
				})
				return
			}
			db.query(
				`UPDATE setup_ports SET port_type_id = "${port_type_id}", port_name = "${port_name}", port_country = "${port_country}", port_city = "${port_city}", IATA_code = "${IATA_code}", 
				ICAO_Code = "${ICAO_Code}", Seaport_code = "${Seaport_code}",
				preferred_clearance = "${preferred_clearance}", preferred_transport = "${preferred_transport}", prefered_liner = "${prefered_liner}"
				 WHERE port_id = "${port_id}"`,
				(updateErr, updateRes) => {
					if (updateErr) {
						res.status(500).send({
							success: false,
							message: updateErr,
						})
						return
					}
					res.status(200).send({
						success: true,
						message: "Port Updated Successfully",
					})
					return
				},
			)
		},
	)
}

const updateAirportStatus = (req, res) => {
	const portId = req.body.port_id

	if (portId == "" || !portId) {
		res.status(400).send({
			success: false,
			message: "Please Provide Port Id",
		})
		return
	}

	db.query(
		`SELECT port_id, status FROM setup_ports WHERE port_id = "${portId}"`,
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
					message: "Port Id Does Not Exist",
				})
				return
			}
			const updateStatus = () => {
				if (data[0].status == "on") {
					return "off"
				}
				if (data[0].status == "off") {
					return "on"
				}
				return "on"
			}

			db.query(
				`UPDATE setup_ports SET status = "${updateStatus()}" WHERE port_id = "${portId}"`,
				(updateErr, updateRes) => {
					if (updateErr) {
						res.status(500).send({
							success: false,
							message: updateErr,
						})
						return
					}
					res.status(200).send({
						success: true,
						status: updateStatus(),
						message: "Port Status Updated Successfully",
					})
					return
				},
			)
		},
	)
}

const getAllAirports = async (req, res) => {
	try {
		const [data] = await db2.query(
			"SELECT a.*, b.port_type FROM setup_ports a INNER JOIN dropdown_port_type b ON a.port_type_id = b.port_type_id",
		)
		res.status(200).send({
			success: true,
			message: "Getting Airport Data Successfully",
			data: data,
		})
	} catch (error) {
		res.status(500).send({
			success: false,
			message: error,
		})
	}
}

const addBank = (req, res) => {
	const {
		Bank_nick_name,
		bank_name,
		bank_account_number,
		Account_Name,
		Currency,
		Bank_Address,
		Swift,
		IBAN,
		user_id
	} = req.body

	if (bank_name == "" || !bank_name) {
		res.status(400).send({
			success: false,
			message: "Please Enter Bank Name",
		})
		return
	}

	if (bank_account_number == "" || !bank_account_number) {
		res.status(400).send({
			success: false,
			message: "Please Enter Bank Acccount Number",
		})
		return
	}

	db.query(
		`SELECT bank_account_number FROM setup_bank WHERE bank_account_number = "${bank_account_number}"`,
		(err, data) => {
			if (err) {
				res.status(500).send({
					success: false,
					message: err,
				})
				return
			}

			if (data.length > 0) {
				res.status(200).send({
					success: false,
					message: "Bank Account Number Already Exist",
				})
				return
			}
			db.query(
				`INSERT INTO setup_bank(bank_name, bank_account_number, Bank_nick_name, Account_Name, Currency, Bank_Address, Swift, IBAN, user_id) VALUES('${bank_name}', '${bank_account_number}', '${Bank_nick_name}', '${Account_Name}', '${Currency}', '${Bank_Address}', '${Swift}', '${IBAN}', '${user_id}')`,
				(insertErr, insertRes) => {
					if (insertErr) {
						res.status(500).send({
							success: false,
							message: insertErr,
						})
						return
					}
					res.status(200).send({
						success: true,
						message: "Data Inserted Successfully",
					})
					return
				},
			)
		},
	)
}

const updateBank = (req, res) => {
	const {
		bank_id,
		bank_name,
		bank_account_number,
		Bank_nick_name,
		Account_Name,
		Currency,
		Bank_Address,
		Swift,
		IBAN,
	} = req.body

	if (bank_id == "" || !bank_id) {
		res.status(400).send({
			success: false,
			message: "Please Provide Bank Id",
		})
		return
	}

	if (bank_name == "" || !bank_name) {
		res.status(400).send({
			success: false,
			message: "Please Provide Bank Name",
		})
		return
	}

	if (bank_account_number == "" || !bank_account_number) {
		res.status(400).send({
			success: false,
			message: "Please Provide Bank Account Number",
		})
		return
	}

	db.query(
		`SELECT bank_id FROM setup_bank WHERE bank_id = "${bank_id}"`,
		(err, data) => {
			if (err) {
				res.status(500).send({
					success: false,
					message: err,
				})
				return
			}

			if (data.length === 0) {
				res.status(200).send({
					success: false,
					message: "Bank Id Does Not Exist",
				})
				return
			}
			db.query(
				`UPDATE setup_bank SET bank_name = "${bank_name}", bank_account_number = "${bank_account_number}", Bank_nick_name = "${Bank_nick_name}", Account_Name = "${Account_Name}", Currency = "${Currency}", Bank_Address = "${Bank_Address}", Swift = "${Swift}", IBAN = "${IBAN}" WHERE bank_id = "${bank_id}"`,
				(updateErr, updateRes) => {
					if (updateErr) {
						res.status(500).send({
							success: false,
							message: updateErr,
						})
						return
					}
					res.status(200).send({
						success: true,
						message: "Bank Details Updated Successfully",
					})
					return
				},
			)
		},
	)
}

const DeleteBank = async (req, res) => {
	const { bank_id } = req.body

	db.query(
		`DELETE FROM setup_bank WHERE bank_id = "${bank_id}"`,
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
				message: "Data Deleted Successfully",
			})
			return
		},
	)
}

const updateBankStatus = (req, res) => {
	const bankId = req.body.bank_id

	if (bankId == "" || !bankId) {
		res.status(400).send({
			success: false,
			message: "Please Provide Bank Id",
		})
		return
	}

	db.query(
		`SELECT status, bank_id FROM setup_bank WHERE bank_id = "${bankId}"`,
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
					message: "Bank Id Does Not Exist",
				})
				return
			}
			const updateStatus = () => {
				if (data[0].status == 1) {
					return 0
				}

				if (data[0].status == 0) {
					return 1
				}
				return 1
			}

			db.query(
				`UPDATE setup_bank SET status = "${updateStatus()}" WHERE bank_id = "${bankId}"`,
				(updateError, updateResp) => {
					if (updateError) {
						res.status(500).send({
							success: false,
							message: updateError,
						})
						return
					}
					res.status(200).send({
						success: true,
						bankStatus: updateStatus(),
						message: "Bank Status Updated Successfully",
					})
					return
				},
			)
		},
	)
}

const getBank = (req, res) => {
	db.query("SELECT * FROM setup_bank", (error, banks) => {
		if (error) {
			return res.status(500).send({
				success: false,
				message: error,
			});
		}

		if (banks.length === 0) {
			return res.status(200).send({
				success: true,
				message: "Empty Data",
			});
		}

		// Create a promise for each bank to get its balance
		const balancePromises = banks.map(bank => {
			return new Promise((resolve, reject) => {
				db.query(`CALL Wallet_Total(?)`, [bank.bank_id], (err, results) => {
					if (err) {
						return reject(err);
					}
					// Assume that `results` returns an array with the balance in the first object
					const balance = results[0][0]?.balance || 0;
					// Add balance to the bank object
					bank.balance = balance;
					resolve();
				});
			});
		});

		// Wait for all promises to complete
		Promise.all(balancePromises)
			.then(() => {
				res.status(200).send({
					success: true,
					message: "Getting Bank Data Successfully",
					bankData: banks,
				});
			})
			.catch(err => {
				res.status(500).send({
					success: false,
					message: "Error retrieving balance for banks",
					error: err,
				});
			});
	});
};



const addClearance = (req, res) => {
	const {
		vendor_id,
		from_port,
		custom_clearance_charges,
		phyto_charges,
		co_chamber_charges,
		extra_charges,
		user_id
	} = req.body

	if (vendor_id == "" || !vendor_id) {
		res.status(400).send({
			success: false,
			message: "Please Provide Vendor Id",
		})
		return
	}

	if (from_port == "" || !from_port) {
		res.status(400).send({
			success: false,
			message: "Please Provide From Port",
		})
		return
	}

	if (custom_clearance_charges == "" || !custom_clearance_charges) {
		res.status(400).send({
			success: false,
			message: "Please Enter Custom Clearence Charges",
		})
		return
	}

	if (phyto_charges == "" || !phyto_charges) {
		res.status(400).send({
			success: false,
			message: "Please Enter Phyto Charges",
		})
		return
	}

	if (co_chamber_charges == "" || !co_chamber_charges) {
		res.status(400).send({
			success: false,
			message: "Please Enter Co Chember Charges",
		})
		return
	}

	if (extra_charges == "" || !extra_charges) {
		res.status(400).send({
			success: false,
			message: "Please Enter Extra Charges",
		})
		return
	}

	db.query(
		`SELECT Clearance_provider FROM setup_clearance WHERE Clearance_provider = "${vendor_id}"`,
		(error, data) => {
			if (error) {
				res.status(500).send({
					success: false,
					message: error,
				})
				return
			}

			if (data.length > 0) {
				res.status(200).send({
					success: false,
					message: "Vendor Id Already Exist",
				})
				return
			}
			db.query(
				`INSERT INTO setup_clearance(user_id, Clearance_provider, from_port, custom_clearance_charges , phyto_charges, co_chamber_charges, extra_charges, status, created) VALUES('${user_id}', '${vendor_id}', '${from_port}', '${custom_clearance_charges}', '${phyto_charges}', '${co_chamber_charges}', '${extra_charges}', '${"on"}', now())`,
				(insertErr, insertRes) => {
					if (insertErr) {
						res.status(500).send({
							success: false,
							message: insertErr,
						})
						return
					}
					res.status(200).send({
						success: true,
						message: "Clearence Added Successfully",
					})
					return
				},
			)
		},
	)
}

const updateclearance = (req, res) => {
	const {
		clearance_id,
		vendor_id,
		from_port,
		custom_clearance_charges,
		phyto_charges,
		co_chamber_charges,
		extra_charges,
	} = req.body

	if (clearance_id == "" || !clearance_id) {
		res.status(400).send({
			success: false,
			message: "Please Provide Clearance Id",
		})
		return false
	}

	if (vendor_id == "" || !vendor_id) {
		res.status(400).send({
			success: false,
			message: "Please Provide Vendor Id",
		})
		return false
	}

	if (from_port == "" || !custom_clearance_charges) {
		res.status(400).send({
			success: false,
			message: "Please Provide Custom Clearance Charges",
		})
		return false
	}

	if (phyto_charges == "" || !phyto_charges) {
		res.status(400).send({
			success: false,
			message: "Please Provide Phyto Charges",
		})
		return false
	}

	if (co_chamber_charges == "" || !co_chamber_charges) {
		res.status(400).send({
			success: false,
			message: "Please Provide Co Chember Charges",
		})
		return false
	}

	db.query(
		`SELECT clearance_id FROM setup_clearance WHERE clearance_id = "${clearance_id}"`,
		(error, data) => {
			if (error) {
				res.status(500).send({
					success: false,
					message: error,
				})
				return false
			}

			if (data.length === 0) {
				res.status(200).send({
					success: false,
					message: "Clearance Id Does Not Exist",
				})
				return false
			}
			db.query(
				`UPDATE setup_clearance SET Clearance_provider = "${vendor_id}", from_port = "${from_port}", custom_clearance_charges = "${custom_clearance_charges}", phyto_charges = "${phyto_charges}", co_chamber_charges = "${co_chamber_charges}", extra_charges = "${extra_charges}" WHERE clearance_id = "${clearance_id}"`,
				(updateError, updateResp) => {
					if (updateError) {
						res.status(500).send({
							success: false,
							message: updateError,
						})
						return
					}
					res.status(200).send({
						success: true,
						message: "Clearance Updated Successfully",
					})
					return
				},
			)
		},
	)
}

const updateClearanceStatus = (req, res) => {
	const clearanceId = req.body.clearance_id

	if (clearanceId == "" || !clearanceId) {
		res.status(400).send({
			success: false,
			message: "Please Provide Clearance Id",
		})
		return
	}

	db.query(
		`SELECT clearance_id, status FROM setup_clearance WHERE clearance_id = "${clearanceId}"`,
		(error, getData) => {
			if (error) {
				res.status(500).send({
					success: false,
					message: error,
				})
				return
			}

			if (getData.length === 0) {
				res.status(200).send({
					success: false,
					message: "Clearance Id Does Not Exist",
				})
				return
			}
			const updateStatus =
				`${getData[0]?.status || ""}`.toLocaleLowerCase() === "on"
					? "off"
					: "on"

			db.query(
				`UPDATE setup_clearance SET status = "${updateStatus}", updated = now() WHERE clearance_id = "${clearanceId}"`,
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
						clearanceStatus: updateStatus,
						message: "Clearance Status Updated Successfully",
					})
					return
				},
			)
		},
	)
}

const getAllClearance = async (req, res) => {
	try {
		const [data] = await db2.query(
			"SELECT a.*, b.name, b.vendor_id, d.port_type, c.port_name FROM setup_clearance a INNER JOIN vendors b ON a.Clearance_provider = b.vendor_id INNER JOIN setup_ports c ON a.from_port = c.port_id INNER JOIN dropdown_port_type d ON c.port_type_id =  d.port_type_id",
		)
		res.status(200).send({
			success: true,
			message: "Getting Clearance Data Successfully",
			data: data,
		})
	} catch (e) {
		res.status(500).send({
			success: false,
			message: e,
		})
	}
}

const addTransPort = (req, res) => {
	const {
		Transportation_provider,
		loading_from,
		departure_port,
		port_type,
		truck1,
		max_weight1,
		max_cbm1,
		max_pallet1,
		price1,
		truck2,
		max_weight2,
		max_cbm2,
		max_pallet2,
		price2,
		truck3,
		max_weight3,
		max_cbm3,
		max_pallet3,
		price3,
		user_id
	} = req.body

	if (Transportation_provider == "" || !Transportation_provider) {
		res.status(400).send({
			success: false,
			message: "Please Provide Supplier Id",
		})
		return
	}

	if (loading_from == "" || !loading_from) {
		res.status(400).send({
			success: false,
			message: "Please Enter Loading From ",
		})
		return
	}

	if (departure_port == "" || !departure_port) {
		res.status(400).send({
			success: false,
			message: "Please Enter Departure Port",
		})
		return
	}

	if (port_type == "" || !port_type) {
		res.status(400).send({
			success: false,
			message: "Please Enter Port Type",
		})
		return
	}

	db.query(
		`SELECT Transportation_provider FROM setup_transportation WHERE Transportation_provider = "${Transportation_provider}"`,
		(error, data) => {
			if (error) {
				res.status(500).send({
					success: false,
					message: error,
				})
				return
			}

			if (data.length > 0) {
				res.status(200).send({
					success: false,
					message: "Supplier Already Exist",
				})
				return
			}
			db.query(
				`INSERT INTO setup_transportation(user_id, Transportation_provider, loading_from, departure_port, port_type, truck1, max_weight1, max_cbm1, max_pallet1, price1, truck2, max_weight2, max_cbm2, max_pallet2, price2, truck3, max_weight3, max_cbm3, max_pallet3, price3 ) VALUES('${user_id}', '${Transportation_provider}', '${loading_from}', '${departure_port}', '${port_type}', '${truck1}', '${max_weight1}', '${max_cbm1}', '${max_pallet1}', '${price1}', '${truck2}', '${max_weight2}', '${max_cbm2}', '${max_pallet2}', '${price2}', '${truck3}', '${max_weight3}', '${max_cbm3}', '${max_pallet3}', '${price3}')`,
				(insertErr, insertResp) => {
					if (insertErr) {
						res.status(500).send({
							success: false,
							message: insertErr,
						})
						return
					}
					res.status(200).send({
						success: true,
						message: "Data Inserted Successfully",
					})
					return
				},
			)
		},
	)
}

const updateTransportation = (req, res) => {
	const {
		transport_id,
		Transportation_provider,
		loading_from,
		departure_port,
		port_type,
		truck1,
		max_weight1,
		max_cbm1,
		max_pallet1,
		price1,
		truck2,
		max_weight2,
		max_cbm2,
		max_pallet2,
		price2,
		truck3,
		max_weight3,
		max_cbm3,
		max_pallet3,
		price3,
	} = req.body

	if (transport_id == "" || !transport_id) {
		res.status(400).send({
			success: false,
			message: "Please Provide Transport Id",
		})
		return
	}

	if (Transportation_provider == "" || !Transportation_provider) {
		res.status(400).send({
			success: false,
			message: "Please Provide Supplier Id",
		})
		return
	}

	if (loading_from == "" || !loading_from) {
		res.status(400).send({
			success: false,
			message: "Please Provide Loading From",
		})
		return
	}

	if (departure_port == "" || !departure_port) {
		res.status(400).send({
			success: false,
			message: "Please Provide Departure Port",
		})
		return
	}

	if (port_type == "" || !port_type) {
		res.status(400).send({
			success: false,
			message: "Please Provide Port Type",
		})
		return
	}

	db.query(
		`SELECT transport_id FROM setup_transportation WHERE transport_id = "${transport_id}"`,
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
					message: "Trasport Id Does Not Exist",
				})
				return
			}
			db.query(
				`UPDATE setup_transportation SET Transportation_provider = "${Transportation_provider}", loading_from = "${loading_from}", departure_port = "${departure_port}", port_type = "${port_type}", truck1 = "${truck1 || ""
				}", max_weight1 = "${max_weight1}", max_cbm1 = "${max_cbm1}", max_pallet1 = "${max_pallet1}", price1 = "${price1}", truck2 = "${truck2 || ""
				}", max_weight2 = "${max_weight2}", max_cbm2 = "${max_cbm2}", max_pallet2 = "${max_pallet2}", price2 = "${price2}", truck3 = "${truck3 || ""
				}", max_weight3 = "${max_weight3}", max_cbm3 = "${max_cbm3}", max_pallet3 = "${max_pallet3}", price3 = "${price3}" WHERE transport_id = ${transport_id} LIMIT 1`,
				(updateError, updateResp) => {
					if (updateError) {
						res.status(500).send({
							success: false,
							message: updateError,
						})
						return
					}
					res.status(200).send({
						success: true,
						message: "Transport Data Updated Successfully",
					})
					return
				},
			)
		},
	)
}


const getTransportation = (req, res) => {//setup_ports
	db.query(
		`SELECT a.*, CASE 
           WHEN a.Status = 1 THEN 'on' 
           ELSE 'off' 
       END AS Status, b.name as Transportation_provider_name, c.port_type, c.port_type_id, s.name as location, p.port_name as port from Transport_Route as a
		INNER JOIN vendors b ON a.Transportation_provider = b.vendor_id 
		INNER JOIN dropdown_port_type c ON a.port_type = c.port_type_id
		INNER JOIN setup_location s ON a.loading_from = s.id
		INNER JOIN setup_ports p ON a.departure_port = p.port_id `,
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
					message: "Empty Data",
				})
				return
			}
			res.status(200).send({
				success: true,
				message: "Getting Transport Data Successfully",
				transportData: data,
			})
			return
		},
	)
}

const getTransportRouteCost = (req, res) => {
	const { transport_id } = req.body;
	db.query(
		`SELECT * from Transport_Route_cost where Transport_Route_ID ='${transport_id}'`,
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
					message: "Empty Data",
				})
				return
			}
			res.status(200).send({
				success: true,
				message: "Getting Transport Data Successfully",
				transportData: data,
			})
			return
		},
	)
}

const EditTransportRouteCost = (req, res) => {
	try {
		const { transport_route_cost_id, truck, max_weight, max_cbm, max_pallet, Cost, user_id } = req.body;
		//  freight_route_cost

		db.query(
			`update Transport_Route_cost set truck='${truck}', max_weight='${max_weight}', max_cbm='${max_cbm}', max_pallet='${max_pallet}', Cost='${Cost}', user_id='${user_id}' where transport_id='${transport_route_cost_id}'`,
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
					message: "Data updated successfully"
				})
				return
			},
		)
	} catch (error) {
		res.status(500).send({
			success: false,
			message: error.message
		})
	}
}

const AddTransportRouteCost = (req, res) => {
	try {
		const { Transport_Route_ID, truck, max_weight, max_cbm, max_pallet, Cost, user_id } = req.body;

		// Insert query for adding new transport route cost
		db.query(
			`INSERT INTO Transport_Route_cost (Transport_Route_ID, truck, max_weight, max_cbm, max_pallet, Cost, user_id) 
			 VALUES ('${Transport_Route_ID}', '${truck}', '${max_weight}', '${max_cbm}', '${max_pallet}', '${Cost}', '${user_id}')`,
			(error, data) => {
				if (error) {
					res.status(500).send({
						success: false,
						message: error,
					});
					return;
				}

				db.query(
					`CALL Update_Transport_Route_cost(?)`, [data.insertId],
					(error, data) => {
						if (error) {
							res.status(500).send({
								success: false,
								message: error,
							})
							return
						}
					})
				res.status(200).send({
					success: true,
					message: "Data added successfully"
				});
				return;
			}
		);
	} catch (error) {
		res.status(500).send({
			success: false,
			message: error.message
		});
	}
};


const AddTransportRoute = (req, res) => {
	try {
		const { Transportation_provider, loading_from, departure_port, user_id, port_type } = req.body;

		// Check if the same combination already exists in the Transport_Route table
		const checkQuery = `
			SELECT * FROM Transport_Route 
			WHERE Transportation_provider = ? 
			  AND loading_from = ? 
			  AND departure_port = ? 
			  AND port_type = ?`;

		db.query(checkQuery, [Transportation_provider, loading_from, departure_port, port_type], (error, results) => {
			if (error) throw err;

			// If duplicate entry found, return custom error message
			if (results.length > 0) {
				const getErrorMessageQuery = `SELECT Error_en, Error_th FROM Error_Messages WHERE error_id = 25`;

				db.query(getErrorMessageQuery, (err, errorMessageResult) => {
					if (err) {
						return res.status(500).send({
							success: false,
							message: "Error fetching error message",
						});
					}

					// Return the error message if found
					const errorMessage = errorMessageResult.length > 0
						? `${errorMessageResult[0].Error_en} / ${errorMessageResult[0].Error_th}`
						: "Duplicate transport route detected";

					return res.status(200).send({
						success: false,
						message: errorMessage,
					});
				});
			} else {
				// If no duplicate entry, proceed with insertion
				const insertQuery = `
					INSERT INTO Transport_Route (Transportation_provider, loading_from, departure_port, user_id, port_type) 
					VALUES (?, ?, ?, ?, ?)`;

				db.query(insertQuery, [Transportation_provider, loading_from, departure_port, user_id, port_type], (error, data) => {
					if (error) {
						return res.status(500).send({
							success: false,
							message: "Error inserting transport route",
						});
					}

					return res.status(200).send({
						success: true,
						message: "Data added successfully",
					});
				});
			}
		});
	} catch (error) {
		res.status(500).send({
			success: false,
			message: error.message,
		});
	}
};

const DeleteTransportRoute = (req, res) => {
	try {
		const { Transportation_id } = req.body;
		// Query to get port_type_id from setup_ports based on loading_from (port_id)
		db.query(
			`DELETE from Transport_Route where transport_id=?`,
			[Transportation_id],
			(error, data) => {
				if (error) {
					res.status(500).send({
						success: false,
						message: "Error deleting transport route",
					});
					return;
				}
				res.status(200).send({
					success: true,
					message: "Data deleted successfully",
				});
			}
		);
	} catch (error) {
		res.status(500).send({
			success: false,
			message: error.message,
		});
	}
};

const DeleteTransportRouteCost = (req, res) => {
	try {
		const { Transportation_cost_id } = req.body;
		// Query to get port_type_id from setup_ports based on loading_from (port_id)
		db.query(
			`DELETE from Transport_Route_cost where transport_id=?`,
			[Transportation_cost_id],
			(error, data) => {
				if (error) {
					res.status(500).send({
						success: false,
						message: "Error deleting transport route",
					});
					return;
				}
				res.status(200).send({
					success: true,
					message: "Data deleted successfully",
				});
			}
		);
	} catch (error) {
		res.status(500).send({
			success: false,
			message: error.message,
		});
	}
};

const StatusChangeTransportRoute = (req, res) => {
	try {
		const { transport_id } = req.body;
		let status;

		// Step 1: Fetch the current status from Freight_Route table
		db.query(`SELECT Status FROM Transport_Route WHERE transport_id = ?`, [transport_id], (err, result) => {
			if (err) {
				res.status(500).send({
					success: false,
					message: "Error fetching port type",
				});
				return;
			}

			// Step 2: Determine the new status
			if (result.length > 0) {
				status = result[0].Status == 1 ? 0 : 1;

				// Step 3: Update the status in Freight_Route table
				db.query(
					`UPDATE Transport_Route SET Status = ? WHERE transport_id = ?`,
					[status, transport_id],
					(error) => {
						if (error) {
							res.status(500).send({
								success: false,
								message: error.message,
							});
							return;
						}

						res.status(200).send({
							success: true,
							message: 'Transport route status updated successfully.',
						});
					}
				);
			} else {
				res.status(404).send({
					success: false,
					message: 'Freight route not found.',
				});
			}
		});
	} catch (error) {
		res.status(500).send({
			success: false,
			message: error.message,
		});
	}
};

const getSelectedPakagingForEan = (req, res) => {
	db.query(
		"SELECT packaging_id, packaging_name, type_id FROM setup_packaging ",
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
				data: data,
			})
			return
		},
	)
}

const addEan = (request, response) => {
	const values = [
		[
			request.body.ean_id,
			request.body.produce_id,
			request.body.ean_produce_qty_grams,
			request.body.user,
		],
	]

	for (const record of dataToInsert) {
		const sql =
			"INSERT INTO ean_produce (ean_id , produce_id, ean_produce_qty_grams, user) VALUES ?"

		db.query(sql, [values], (err, result) => {
			if (err) {
				response.status(500).send({
					success: false,
					message: err,
				})
				return false
			}
			response.status(200).send({
				success: true,
				message: `Number of records inserted: ${result.affectedRows}`,
			})
		})
	}
}

const addEanPackaging = (req, res) => {
	const { ean_id, type_id, packaging_id, qty } = req.body

	if (!ean_id || ean_id == "") {
		res.status(400).send({
			success: false,
			message: "Please Provide Ean Id",
		})
		return
	}

	if (!packaging_id || packaging_id == 0) {
		res.status(400).send({
			success: false,
			message: "Please Provide Packaging Id",
		})
		return
	}

	if (!qty || qty == "") {
		res.status(400).send({
			success: false,
			message: "Please Provide qty",
		})
		return
	}

	for (let i = 0; i < packaging_id.length; i++) {
		if (packaging_id[i] == 0) {
			continue
		}

		const sql =
			"INSERT INTO `ean_packaging`(`ean_id`, `type_id`, `packaging_id`, `qty`) VALUES (?, ?, ?, ?);"
		const values = [ean_id[i], 1, packaging_id[i], qty[i]]

		db.query(sql, values, (error, data) => {
			if (error) {
				res.status(500).send({
					success: false,
					message: error,
				})
				return
			}
		})
	}
	res.status(200).send({
		success: true,
		message: "Data Inserted Successfully",
	})
	return
}

const addEanProduce = (req, res) => {
	const { ean_id, produce_id, ean_produce_qty_grams } = req.body

	if (!ean_id || ean_id == "") {
		res.status(400).send({
			success: false,
			message: "Please Provide Ean Id",
		})
		return
	}

	if (!produce_id || produce_id == 0) {
		res.status(400).send({
			success: false,
			message: "Please Prodvide ",
		})
		return
	}

	if (!ean_produce_qty_grams || ean_produce_qty_grams == "") {
		res.status(400).send({
			success: false,
			message: "Please Provide ean_produce_qty_grams",
		})
		return
	}

	for (let i = 0; i < produce_id.length; i++) {
		if (produce_id[i] == 0) {
			continue
		}

		const sql =
			"INSERT INTO ean_produce(ean_id, produce_id, ean_produce_qty_grams) VALUES(?,?,?)"
		const values = [ean_id[i], produce_id[i], ean_produce_qty_grams[i]]

		db.query(sql, values, (err, data) => {
			if (err) {
				res.status(500).send({
					success: false,
					message: err,
				})
				return
			}
		})
	}
	res.status(200).send({
		success: true,
		message: "success",
	})
	return
}

const newUpdateEanName = (req, res) => {
	const ean_id = req.body.ean_id
	const sql = `CALL New_Update_EAN_name(${ean_id})`

	db.query(sql, true, (error, results, fields) => {
		if (error) {
			res.status(500).send({
				success: false,
				message: error,
			})
			return
		}
		res.status(200).send({
			success: true,
			data: results,
		})
	})
}

const editEanPackaging = (req, res) => {
	const { ean_id, type_id, packaging_id, qty } = req.body

	if (!ean_id || ean_id == "") {
		res.status(400).send({
			success: false,
			message: "Please Provide Ean Id",
		})
		return false
	}

	if (!packaging_id || packaging_id == "") {
		res.status(400).send({
			success: false,
			message: "Please Provide Packaging Id",
		})
		return
	}

	if (!qty || qty == "") {
		res.status(400).send({
			success: false,
			message: "Please Provide qty",
		})
		return
	}

	db.query(
		`SELECT ean_detail_id FROM ean_packaging WHERE ean_id ="${ean_id}"`,
		(error, data) => {
			if (error) {
				res.status(500).send({
					success: false,
					message: error,
				})
				return
			}

			for (let i = 0; i < data.length; i++) {
				if (packaging_id[i] == 0) {
					continue
				}

				const sql = `UPDATE ean_packaging SET packaging_id = ?, qty = ? WHERE ean_detail_id = ${data[i].ean_detail_id} `
				const values = [packaging_id[i], qty[i]]

				db.query(sql, values, (error, data) => {
					if (error) {
						res.status(500).send({
							success: false,
							message: error,
						})
						return
					}
				})
			}
			res.status(200).send({
				success: true,
				message: "Updated Successfully",
			})
			return
		},
	)
}

const editEanProduce = (req, res) => {
	const { ean_id, produce_id, ean_produce_qty_grams } = req.body

	if (!ean_id || ean_id == "") {
		res.status(400).send({
			success: false,
			message: "Please Provide Ean Id",
		})
		return false
	}

	if (!produce_id || produce_id == "") {
		res.status(400).send({
			success: false,
			message: "Please Provide produce_id",
		})
		return
	}

	if (!ean_produce_qty_grams || ean_produce_qty_grams == "") {
		res.status(400).send({
			success: false,
			message: "Please Provide ean_produce_qty_grams",
		})
		return
	}

	db.query(
		`SELECT ean_produce_id FROM ean_produce WHERE ean_id ="${ean_id}"`,
		(error, data) => {
			if (error) {
				res.status(500).send({
					success: false,
					message: error,
				})
				return
			}

			for (let i = 0; i < data.length; i++) {
				if (produce_id[i] == 0) {
					continue
				}

				const sql = `UPDATE ean_produce SET produce_id = ?, ean_produce_qty_grams = ? WHERE ean_produce_id = ${data[i].ean_produce_id} `
				const values = [produce_id[i], ean_produce_qty_grams[i]]

				db.query(sql, values, (error, data) => {
					if (error) {
						res.status(500).send({
							success: false,
							message: error,
						})
						return
					}
				})
			}
			res.status(200).send({
				success: true,
				message: "Updated Successfully",
			})
			return
		},
	)
}

const deleteEanPackaging = (req, res) => {
	const { ean_detail_id } = req.body

	db.query(
		`DELETE FROM ean_packaging WHERE ean_detail_id = "${ean_detail_id}"`,
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
				message: "Data Deleted Successfully",
			})
			return
		},
	)
}

const deleteEanProduce = (req, res) => {
	const { ean_produce_id } = req.body

	db.query(
		`DELETE FROM ean_details WHERE ean_detail_id = "${ean_produce_id}"`,
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
				message: "Data Deleted Successfully",
			})
			return
		},
	)
}

const updateEan = (request, response) => {
	const { ean_name, ean_unit, ean_id } = request.body

	if (ean_id == "" || !ean_id) {
		response.status(400).send({
			success: false,
			message: "Please Provide Ean Id",
		})
		return
	}

	if (ean_name == "" || !ean_name) {
		response.status(400).send({
			success: false,
			message: "Please Provide Ean _Name",
		})
		return
	}

	if (ean_unit == "" || !ean_unit) {
		response.status(400).send({
			success: false,
			message: "Please Provide Ean Unit",
		})
		return
	}

	db.query(
		`SELECT ean_id FROM ean WHERE ean_id = "${ean_id}"`,
		(error, data) => {
			if (error) {
				response.status(500).send({
					success: false,
					message: error,
				})
				return
			}

			if (data.length === 0) {
				response.status(200).send({
					success: false,
					message: "Ean Id Does Not Exist",
				})
				return
			}
			db.query(
				`UPDATE ean SET ean_name = "${ean_name}", ean_unit = "${ean_unit}" WHERE ean_id = "${ean_id}"`,
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
						message: "Ean Data Updated Successfully",
					})
					return
				},
			)
		},
	)
}

const getEanData = (request, response) => {
	db.query(
		"SELECT a.*, b.ean_packaging_weight, b.ean_net_weight, b.ean_gross_weight from ean a INNER JOIN ean_weight b ON a.ean_id = b.ean_id",
		(error, data) => {
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
					message: "Empty Data",
				})
				return
			}
			response.status(200).send({
				success: true,
				message: "Getting Data Succssfully",
				data: data,
			})
			return
		},
	)
}

const getEanPackagingData = (req, res) => {
	db.query(
		`SELECT * FROM ean_packaging WHERE ean_id = "${req.body.ean_id}" AND packaging_id != 0`,
		(err, data) => {
			if (err) {
				res.status(500).send({
					success: false,
					message: err,
				})
				return
			}
			res.status(200).send({
				success: true,
				message: "Getting Data Successfully",
				data: data,
			})
			return
		},
	)
}

const getEanProduceData = (req, res) => {
	db.query(
		`SELECT * FROM ean_produce WHERE ean_id = "${req.body.ean_id}" AND produce_id != 0`,
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
				data: data,
			})
			return
		},
	)
}

const eanStatusUpdate = (req, resp) => {
	const eanId = req.body.ean_id

	if (eanId == "" || !eanId) {
		resp.status(400).send({
			success: false,
			message: "Please Provide Ean Id",
		})
		return
	}

	db.query(
		`SELECT ean_id, status FROM ean WHERE ean_id = "${eanId}"`,
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
					message: "Ean Id Does Not Exist",
				})
				return
			}
			const statusUpdate = () => {
				if (data[0].status === "on") {
					return "off"
				}

				if (data[0].status === "off") {
					return "on"
				}
				return "on"
			}

			db.query(
				`UPDATE ean SET status = "${statusUpdate()}" WHERE ean_id = "${eanId}"`,
				(updateErr, updateResp) => {
					if (updateErr) {
						resp.status(500).send({
							success: false,
							message: updateErr,
						})
						return
					}
					resp.status(200).send({
						success: true,
						status: statusUpdate(),
						message: "Status Updated Successfully",
					})
					return
				},
			)
		},
	)
}

const addFreight = (req, resp) => {
	const {
		Freight_provider,
		liner,
		from_port,
		destination_port,
		port_type,
		range1,
		price1,
		range2,
		price2,
		range3,
		price3,
		range4,
		price4,
		range5,
		price5,
		user_id
	} = req.body

	if (Freight_provider == "" || !Freight_provider) {
		resp.status(400).send({
			success: false,
			message: "Please Enter Supplier Id",
		})
		return
	}

	if (liner == "" || !liner) {
		resp.status(400).send({
			success: false,
			message: "Please Enter Liner",
		})
		return
	}

	if (from_port == "" || !from_port) {
		resp.status(400).send({
			success: false,
			message: "Please Enter From Port",
		})
		return
	}

	if (destination_port == "" || !destination_port) {
		resp.status(400).send({
			success: false,
			message: "Please Enter Destination Port",
		})
		return
	}

	if (port_type == "" || !port_type) {
		resp.status(400).send({
			success: false,
			message: "Please Enter Port Type",
		})
		return
	}

	db.query(
		`INSERT INTO setup_freight (user_id, Freight_provider,liner,from_port, destination_port, port_type, range1, price1, range2, price2, range3, price3, range4, price4, range5, price5) VALUES('${user_id}','${Freight_provider}', '${liner}', '${from_port}', '${destination_port}', '${port_type}', ${range1 || "NULL"
		}, ${price1 || "NULL"}, ${range2 || "NULL"}, ${price2 || "NULL"}, ${range3 || "NULL"
		}, ${price3 || "NULL"}, ${range4 || "NULL"}, ${price4 || "NULL"}, ${range5 || "NULL"
		}, ${price5 || "NULL"})`,
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
				message: "Insert Data Successfully",
			})
			return
		},
	)
}

const updateFreight = (req, resp) => {
	const {
		id,
		Freight_provider,
		liner,
		from_port,
		destination_port,
		port_type,
		range1,
		price1,
		range2,
		price2,
		range3,
		price3,
		range4,
		price4,
		range5,
		price5,
	} = req.body

	if (id == "" || !id) {
		resp.status(400).send({
			success: false,
			message: "Please Provide Id",
		})
		return
	}

	if (Freight_provider == "" || !Freight_provider) {
		resp.status(400).send({
			success: false,
			message: "Please Provide Supplier Id",
		})
		return
	}

	if (liner == "" || !liner) {
		resp.status(400).send({
			success: false,
			message: "Please Provide Liner",
		})
		return
	}

	if (destination_port == "" || !destination_port) {
		resp.status(400).send({
			success: false,
			message: "Please Provide Destination Port",
		})
		return
	}

	if (port_type == "" || !port_type) {
		resp.status(400).send({
			success: false,
			message: "Please Provide Port Type",
		})
		return
	}

	db.query(`SELECT id FROM setup_freight WHERE id = "${id}"`, (error, data) => {
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
				message: "Id Does Not Exist",
			})
			return
		}
		db.query(
			`UPDATE setup_freight SET Freight_provider = "${Freight_provider}", liner = "${liner}", destination_port = "${destination_port}", from_port = "${from_port}", port_type = "${port_type}", range1 = ${range1 || "NULL"
			}, price1 = ${price1 || "NULL"}, range2 = ${range2 || "NULL"}, price2 = ${price2 || "NULL"
			}, range3 = ${range3 || "NULL"}, price3 = ${price3 || "NULL"}, range4 = ${range4 || "NULL"
			}, price4 = ${price4 || "NULL"}, range5 = ${range5 || "NULL"}, price5 = ${price5 || "NULL"
			} WHERE id = "${id}"`,
			(updateErr, updateResp) => {
				if (updateErr) {
					resp.status(500).send({
						success: false,
						message: updateErr,
					})
					return
				}
				resp.status(200).send({
					success: true,
					message: "Freight Updated Successfully",
				})
				return
			},
		)
	})
}

const getFreight = (request, response) => {
	db.query(
		`SELECT a.*, CASE 
           WHEN a.Status = 1 THEN 'on' 
           ELSE 'off' 
       END AS Status, b.name AS Freight_provider_name, c.port_name AS DestinationPort, e.port_name AS FromPort, d.liner_name AS Airline FROM Freight_Route as a 
		INNER JOIN vendors b ON a.Freight_provider = b.vendor_id 
		INNER JOIN setup_ports c ON a.destination_port = c.port_id 
		INNER JOIN setup_liner d ON a.liner = d.liner_id 
		INNER JOIN setup_ports e ON a.from_port = e.port_id`,
		(error, data) => {
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
					message: "No Freight Data Found",
				})
				return
			}
			response.status(200).send({
				success: true,
				message: "Getting Data Successfully",
				freightData: data,
			})
			return
		},
	)
}

const GetfreightRouteCost = (req, res) => {
	try {
		const { freight_route_id } = req.body;
		//  freight_route_cost
		db.query(
			`SELECT * FROM  Freight_Route_Cost where Freight_Route_ID=${freight_route_id}`,
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
						success: true,
						message: "No Freight Data Found",
					})
					return
				}
				res.status(200).send({
					success: true,
					message: "Getting Data Successfully",
					freightData: data,
				})
				return
			},
		)
	} catch (error) {
		res.status(500).send({
			success: false,
			message: error.message
		})
	}
}

const EditfreightRouteCost = (req, res) => {
	try {
		const { freight_route_cost_id, Min_Weight, Cost, user_id } = req.body;
		//  freight_route_cost
		db.query(
			`update Freight_Route_Cost set Min_Weight='${Min_Weight}', Cost='${Cost}', user_id='${user_id}' where id='${freight_route_cost_id}'`,
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
					message: "Data updated successfully"
				})
				return
			},
		)
	} catch (error) {
		res.status(500).send({
			success: false,
			message: error.message
		})
	}
}


const AddfreightRoute = (req, res) => {
	try {
		const { vendor_id, port_of_origin, destination_port, liner, user_id } = req.body;

		// Step 1: Fetch port_type_id based on port_of_origin
		db.query(`SELECT port_type_id FROM setup_ports WHERE port_id = ?`, [port_of_origin], (err, result) => {
			if (err) {
				return res.status(500).send({
					success: false,
					message: "Error fetching port type",
				});
			}

			// Check if the result contains port_type_id, default to 0 if not found
			const port_type_id = result.length > 0 ? result[0].port_type_id : 0;

			// Step 2: Check for duplicate entry in Freight_Route
			const checkDuplicateQuery = `
				SELECT * FROM Freight_Route 
				WHERE Freight_provider = ? 
				  AND from_port = ? 
				  AND destination_port = ? 
				  AND liner = ? 
				  AND port_type = ?`;

			db.query(checkDuplicateQuery, [vendor_id, port_of_origin, destination_port, liner, port_type_id], (checkError, duplicateResult) => {
				if (checkError) {
					return res.status(500).send({
						success: false,
						message: "Error checking for existing freight route",
					});
				}

				// If duplicate entry found, return error message from error_messages table
				if (duplicateResult.length > 0) {
					const getErrorMessageQuery = `SELECT Error_en, Error_th FROM Error_Messages WHERE error_id = 25`;

					db.query(getErrorMessageQuery, (err, errorMessageResult) => {
						if (err) {
							return res.status(500).send({
								success: false,
								message: "Error fetching error message",
							});
						}

						// Return the error message if found
						const errorMessage = errorMessageResult.length > 0
							? `${errorMessageResult[0].Error_en} / ${errorMessageResult[0].Error_th}`
							: "Duplicate freight route detected";

						return res.status(200).send({
							success: false,
							message: errorMessage,
						});
					});
				} else {
					// Step 3: If no duplicate entry, insert into Freight_Route
					const insertFreightRouteQuery = `
						INSERT INTO Freight_Route (Freight_provider, from_port, destination_port, liner, user_id, port_type) 
						VALUES (?, ?, ?, ?, ?, ?)`;

					db.query(insertFreightRouteQuery, [vendor_id, port_of_origin, destination_port, liner, user_id, port_type_id], (freightError, freightResult) => {
						if (freightError) {
							return res.status(500).send({
								success: false,
								message: `Error inserting into Freight_Route: ${freightError}`,
							});
						}

						return res.status(200).send({
							success: true,
							message: "Data added successfully",
						});
					});
				}
			});
		});
	} catch (error) {
		res.status(500).send({
			success: false,
			message: error.message,
		});
	}
};


const AddfreightRouteCost = (req, res) => {
	try {
		const { Freight_Route_ID, Min_Weight, Cost, user_id } = req.body;
		// Step 1: Insert into Freight_Route table
		const insertFreightRouteQuery = `
		INSERT INTO  Freight_Route_Cost (Freight_Route_ID, Min_Weight, Cost, user_id) 
		VALUES ('${Freight_Route_ID}', '${Min_Weight}', '${Cost}', '${user_id}')`;

		db.query(insertFreightRouteQuery, (freightError, freightResult) => {
			if (freightError) throw freightError;


			// Get the newly inserted Freight_Route ID

			res.status(200).send({
				success: true,
				message: "Data added successfully",
			})
		});
	} catch (error) {
		res.status(500).send({
			success: false,
			message: error.message,
		});
	}
};

const DeletefreightRoute = (req, res) => {
	try {
		const { freight_id } = req.body;
		// Query to get port_type_id from setup_ports based on loading_from (port_id)
		db.query(
			`DELETE from Freight_Route where id=?`,
			[freight_id],
			(error, data) => {
				if (error) {
					res.status(500).send({
						success: false,
						message: "Error deleting freight route",
					});
					return;
				}
				res.status(200).send({
					success: true,
					message: "Data deleted successfully",
				});
			}
		);
	} catch (error) {
		res.status(500).send({
			success: false,
			message: error.message,
		});
	}
};

const DeletefreightRouteCost = (req, res) => {
	try {
		const { freight_cost_id } = req.body;
		// Query to get port_type_id from setup_ports based on loading_from (port_id)
		db.query(
			`DELETE from Freight_Route_Cost where id=?`,
			[freight_cost_id],
			(error, data) => {
				if (error) {
					res.status(500).send({
						success: false,
						message: "Error deleting freight route",
					});
					return;
				}
				res.status(200).send({
					success: true,
					message: "Data deleted successfully",
				});
			}
		);
	} catch (error) {
		res.status(500).send({
			success: false,
			message: error.message,
		});
	}
};

const StatusChangeFreightRoute = (req, res) => {
	try {
		const { Freight_Route_ID } = req.body;
		let status;

		// Step 1: Fetch the current status from Freight_Route table
		db.query(`SELECT Status FROM Freight_Route WHERE id = ?`, [Freight_Route_ID], (err, result) => {
			if (err) {
				res.status(500).send({
					success: false,
					message: "Error fetching port type",
				});
				return;
			}

			// Step 2: Determine the new status
			if (result.length > 0) {
				status = result[0].Status == 1 ? 0 : 1;

				// Step 3: Update the status in Freight_Route table
				db.query(
					`UPDATE Freight_Route SET Status = ? WHERE id = ?`,
					[status, Freight_Route_ID],
					(error) => {
						if (error) {
							res.status(500).send({
								success: false,
								message: error.message,
							});
							return;
						}

						res.status(200).send({
							success: true,
							message: 'Freight route status updated successfully.',
						});
					}
				);
			} else {
				res.status(404).send({
					success: false,
					message: 'Freight route not found.',
				});
			}
		});
	} catch (error) {
		res.status(500).send({
			success: false,
			message: error.message,
		});
	}
};


const StatusChangeItf = (req, res) => {
	try {
		const { itf_id } = req.body;
		let status;

		// Step 1: Fetch the current status from Freight_Route table
		db.query(`SELECT status FROM itf WHERE itf_id = ?`, [itf_id], (err, result) => {
			if (err) {
				res.status(500).send({
					success: false,
					message: "Error fetching Itf",
				});
				return;
			}

			// Step 2: Determine the new status
			if (result.length > 0) {
				status = result[0].status == 1 ? 0 : 1;

				// Step 3: Update the status in Freight_Route table
				db.query(
					`UPDATE itf SET status = ? WHERE itf_id = ?`,
					[status, itf_id],
					(error) => {
						if (error) {
							res.status(500).send({
								success: false,
								message: error.message,
							});
							return;
						}

						res.status(200).send({
							success: true,
							message: 'Itf status updated successfully.',
						});
					}
				);
			} else {
				res.status(404).send({
					success: false,
					message: 'Itf not found.',
				});
			}
		});
	} catch (error) {
		res.status(500).send({
			success: false,
			message: error.message,
		});
	}
};

/* const addItf = (req, res) => {
	const { itf_name_en, itf_name_th, brand, itf_code, ITF_ean_adjustment, Notes } = req.body;

	db.query(
		`INSERT INTO itf(itf_name_en, itf_name_th, itf_code, brand, ITF_ean_adjustment, Notes) VALUES(?, ?, ?, ?, ?, ?)`,
		[itf_name_en, itf_name_th, itf_code, brand, ITF_ean_adjustment, Notes],
		(error, data) => {
			if (error) {
				return res.status(500).send({
					success: false,
					message: error.message, // Use error.message for a more concise error message
				});
			}

			// Proceed with updating the image if req.file is present
			if (req.file) {
				const imageData = req.file.filename; // Assuming req.file.filename contains the image filename

				db.query(
					"UPDATE itf SET images = ? WHERE itf_id = ?",
					[imageData, data.insertId],
					(err) => {
						if (err) {
							return res.status(500).send({
								success: false,
								message: "Image update failed: " + err.message,
							});
						}
						return res.status(200).send({
							success: true,
							itf_id: data.insertId,
							message: "Inserted Successfully with Image",
						});
					}
				);
			} else {
				// Respond when there is no image to update
				return res.status(200).send({
					success: true,
					itf_id: data.insertId,
					message: "Inserted Successfully",
				});
			}
		}
	);
};
 */


const addItf = (req, res) => {
	const { itf_name_en, itf_name_th, brand, itf_code, ITF_ean_adjustment, Notes, user_id } = req.body;

	db.query(
		`INSERT INTO itf(itf_code, brand, ITF_ean_adjustment, Notes, user) VALUES(?, ?, ?, ?, ?)`,
		[itf_code, brand, ITF_ean_adjustment, Notes || null, user_id],
		(error, data) => {
			if (error) {
				return res.status(500).send({
					success: false,
					message: error.message, // Use error.message for a more concise error message
				});
			}

			// Proceed with updating the image if req.file is present
			if (req.file) {
				const imageData = req.file.filename; // Assuming req.file.filename contains the image filename

				db.query(
					"UPDATE itf SET images = ? WHERE itf_id = ?",
					[imageData, data.insertId],
					(err) => {
						if (err) {
							return res.status(500).send({
								success: false,
								message: "Image update failed: " + err.message,
							});
						}
						return res.status(200).send({
							success: true,
							itf_id: data.insertId,
							message: "Inserted Successfully with Image",
						});
					}
				);
			} else {
				// Respond when there is no image to update
				return res.status(200).send({
					success: true,
					itf_id: data.insertId,
					message: "Inserted Successfully",
				});
			}
		}
	);
};


const getVendorList = (req, res) => {
	db.query("SELECT name, vendor_id FROM vendors", (error, data) => {
		if (error) {
			res.status(500).send({
				success: false,
				message: error,
			})
			return
		}
		res.status(200).send({
			success: true,
			message: "Getting Successfully",
			vendorList: data,
		})
		return
	})
}

const getCurrency = async (req, resp) => {
	try {
		const [data] = await db2.query(
			`SELECT t.*, (select fx_rate_history.fx_rate
				from fx_rate_history,orders
				where t.currency_id=fx_rate_history.fx_id
				order by fx_rate_history.id DESC Limit 1) fx_rate FROM dropdown_currency t
	`,
		)
		resp.status(200).send({
			success: true,
			message: "Getting Data Successfully",
			data: data,
		})
	} catch (e) {
		resp.status(500).send({
			success: false,
			message: e,
		})
	}
}



// const getIft = async (req, resp) => {
// 	try {
// 		// First, fetch the main `itf` data as you are already doing
// 		const [itfData] = await db2.query(`
//             SELECT 
//     itf.itf_code,
//     itf.itf_id,
//     itf.brand,
// 	itf.Internal_Name_EN AS  ITF_Internal_Name_EN,
// 	itf.Internal_Name_TH AS  ITF_Internal_Name_TH,
//     ITF_Produce(itf.itf_id) AS itf_produce,
//     itf_Net_Weight(itf.itf_id) AS itf_Net_Weight,
//     itf.itf_name_en,
// 	itf.itf_name_th AS ITF_name_th,
// 	itf.ITF_ean_adjustment,
//     Calculated_ITF_Gross_Weight(itf.itf_id) AS Calculated_ITF_Gross_Weight,
//     ITF_VVSW(itf.itf_id) AS ITF_VVSW,
//     itf_box_pallet(itf.itf_id) AS itf_box_pallet,
//     itf.status,
// 	itf.Notes,
//     CONCAT(itf.itf_name_th, ITF_EAN_PACKAGING(itf.itf_id)) AS itf_name_th
// FROM 
//     itf
// WHERE 
//     ITF_Produce_Status(itf.itf_id) = 1
// ORDER BY
//     CAST(itf_classification_ID(itf.itf_id) AS INT),
//     PDF_Customs_Produce_Name_ITF(itf.itf_id),
//     itf_Net_Weight(itf.itf_id);
// `);
// 		// Send the modified results as the response
// 		resp.status(200).send({
// 			success: true,
// 			message: "Data fetched and processed successfully",
// 			data: itfData,
// 		});
// 	} catch (e) {
// 		// Handle any errors
// 		resp.status(500).send({
// 			success: false,
// 			message: e.message || "An error occurred",
// 		});
// 	}
// };


const getIft = async (req, resp) => {
	try {
		// First, fetch the main `itf` data as you are already doing
		const [itfData] = await db2.query(`
            SELECT
    itf.itf_code,
    itf.itf_id,
    itf.brand,
	itf.Internal_Name_EN AS  ITF_Internal_Name_EN,
	itf.Internal_Name_TH AS  ITF_Internal_Name_TH,
    ITF_Produce(itf.itf_id) AS itf_produce,
    itf.ITF_NW AS itf_Net_Weight,
    itf.itf_name_en,
	itf.itf_name_th AS ITF_name_th,
	itf.ITF_ean_adjustment,
    itf.ITF_GW AS Calculated_ITF_Gross_Weight,
    itf.ITF_VVSW AS ITF_VVSW,
    itf.ITF_PALLET AS itf_box_pallet,
    itf.status,
	itf.Notes
FROM 
    itf
WHERE 
    ITF_Produce_Status(itf.itf_id) = 1
ORDER BY 
    CAST(itf_classification_ID(itf.itf_id) AS INT),
    PDF_Customs_Produce_Name_ITF(itf.itf_id),
    itf.ITF_NW;
`);
		// Send the modified results as the response
		resp.status(200).send({
			success: true,
			message: "Data fetched and processed successfully",
			data: itfData,
		});
	} catch (e) {
		// Handle any errors
		resp.status(500).send({
			success: false,
			message: e.message || "An error occurred",
		});
	}
};

const getDropdownVendor = (req, res) => {
	db.query("SELECT * FROM dopdown_vendor_entity", (error, data) => {
		if (error) {
			res.status(500).send({
				success: false,
				message: error,
			})
			return false
		}
		res.status(200).send({
			success: true,
			message: "Getting Data Successfully",
			data: data,
		})
		return
	})
}

const setupLocation = async (req, res) => {
	try {
		const [data] = await db2.query("SELECT * FROM setup_location")

		res.status(200).send({
			success: true,
			message: "Getting Data Successfully",
			data: data,
		})
	} catch (error) {
		res.status(500).send({
			success: false,
			message: error,
		})
	}
}

const createSetupLocation = (req, res) => {
	const { name, address, gps_location, user_id } = req.body

	if (name === "" || !name) {
		res.status(400).send({
			success: false,
			message: "Please Provide Name",
		})
		return false
	}

	if (address == "" || !address) {
		res.status(400).send({
			success: false,
			message: "Please Provide Address",
		})
		return false
	}

	db.query(
		`INSERT INTO setup_location (name, address, gps_location, user_id) VALUES('${name}', '${address}', '${gps_location}', '${user_id}')`,
		(error, insertResp) => {
			if (error) {
				res.status(500).send({
					success: false,
					message: error,
				})
				return false
			}
			res.status(200).send({
				success: true,
				message: "Inserted Address Successfully",
			})
			return
		},
	)
}

const updateSetupLocation = (req, res) => {
	const { id, name, address, gps_location } = req.body

	if (id == "" || !id) {
		req.status(400).send({
			success: false,
			message: "Please Provide Id",
		})
		return false
	}

	if (name == "" || !name) {
		req.status(400).send({
			success: false,
			message: "Please Provide Name",
		})
		return false
	}

	if (address == "" || !address) {
		req.status(400).send({
			success: false,
			message: "Please Provide Address",
		})
	}

	if (gps_location == "" || !gps_location) {
		req.status(400).send({
			success: false,
			message: "Please Provide Gps Location",
		})
		return false
	}

	db.query(
		`UPDATE setup_location SET name = "${name}", address = "${address}", gps_location = "${gps_location}" WHERE id = "${req.body.id}"`,
		(error, updateData) => {
			if (error) {
				res.status(500).send({
					success: false,
					message: error,
				})
				return false
			}
			res.status(200).send({
				success: true,
				message: "Location Data Updated Successfully",
			})
			return
		},
	)
}

const updateItf = (req, res) => {
	const {
		itf_id,
		itf_name_en,
		itf_name_th,
		itf_unit,
		itf_code,
		brand,
		ITF_ean_adjustment,
		Notes
	} = req.body
	db.query(
		"UPDATE itf SET itf_name_en = ?, itf_name_th = ?, brand =?, itf_code = ?, ITF_ean_adjustment = ?, Notes=? WHERE itf_id = ?",
		[itf_name_en, itf_name_th, brand, itf_code, ITF_ean_adjustment, Notes || null, itf_id],
		(error, updateData) => {
			if (error) {
				res.status(500).send({
					success: false,
					message: error,
				})
				return false
			}
			if (req.file) {
				// Assuming req.file contains the image file
				const imageData = req.file.filename; // Assuming the image is stored in a buffer

				// Assuming db2 is your database connection object
				db2.execute(
					"UPDATE itf SET images = ? WHERE itf_id = ?",
					[imageData, itf_id]
				);
			}
			res.status(200).send({
				success: true,
				message: "ITF Data Updated Successfully",
			})
			return
		},
	)
}

const Clearancedropdown = async (req, res) => {
	try {
		const [data] = await db2.query("SELECT vendor_id, name FROM vendors")

		res.status(200).send({
			success: true,
			message: "Getting Data Successfully",
			data: data,
		})
	} catch (error) {
		res.status(500).send({
			success: false,
			message: error,
		})
	}
}


const Transportationdropdown = async (req, res) => {
	try {
		const [data] = await db2.query("SELECT vendor_id, name FROM vendors")

		res.status(200).send({
			success: true,
			message: "Getting Data Successfully",
			data: data,
		})
	} catch (error) {
		res.status(500).send({
			success: false,
			message: error,
		})
	}
}
const Linerdropdown = async (req, res) => {
	try {
		const [data] = await db2.query("SELECT liner_id, liner_name FROM setup_liner")

		res.status(200).send({
			success: true,
			message: "Getting Data Successfully",
			data: data,
		})
	} catch (error) {
		res.status(500).send({
			success: false,
			message: error,
		})
	}
}

const Providerdropdown = async (req, res) => {
	try {
		const [data] = await db2.query("SELECT vendor_id, name FROM vendors")

		res.status(200).send({
			success: true,
			message: "Getting Data Successfully",
			data: data,
		})
	} catch (error) {
		res.status(500).send({
			success: false,
			message: error,
		})
	}
}

const WalletTotalAccounts = async (req, res) => {
	try {
		const [data] = await db2.query("SELECT * FROM Wallets")

		res.status(200).send({
			success: true,
			message: "Getting Data Successfully",
			data: data,
		})
	} catch (error) {
		res.status(500).send({
			success: false,
			message: error,
		})
	}
}

const getFxRateHistoryGraph = async (req, resp) => {
	try {
		const today = new Date();
		const pastDates = [];
		const futureDates = [];

		// Create date arrays for -60 days and +45 days
		for (let i = 60; i >= 0; i--) {
			const pastDate = new Date(today);
			pastDate.setDate(today.getDate() - i);
			pastDates.push(pastDate.toLocaleDateString("en-US", { day: '2-digit', month: 'short' }));
		}
		for (let i = 1; i <= 45; i++) {
			const futureDate = new Date(today);
			futureDate.setDate(today.getDate() + i);
			futureDates.push(futureDate.toLocaleDateString("en-US", { day: '2-digit', month: 'short' }));
		}

		// Combine past and future dates
		const allDates = [...pastDates, ...futureDates];

		// Fetch data from the database with INNER JOIN to include currency
		const [data] = await db2.query(`
            SELECT fx_rate_history.fx_id, 
                   fx_rate_history.fx_rate, 
                   DATE_FORMAT(fx_rate_history.created, '%e %b %Y') AS created_date, 
                   dropdown_currency.currency
            FROM fx_rate_history
            INNER JOIN dropdown_currency ON dropdown_currency.currency_id = fx_rate_history.fx_id
            WHERE fx_rate_history.created BETWEEN DATE_SUB(CURDATE(), INTERVAL 60 DAY) AND DATE_ADD(CURDATE(), INTERVAL 45 DAY)
        `);

		// Create a map to store rates based on fx_id
		const ratesMap = new Map();
		const uniqueDatesWithValues = new Set(); // To track dates with values

		data.forEach(row => {
			const { fx_id, fx_rate, created_date, currency } = row;

			// Only consider rates that are greater than 0
			if (parseFloat(fx_rate) > 0) {
				uniqueDatesWithValues.add(created_date);
			}

			if (!ratesMap.has(fx_id)) {
				ratesMap.set(fx_id, { rates: {}, currency: currency, minDate: null, maxDate: null });
			}

			ratesMap.get(fx_id).rates[created_date] = parseFloat(fx_rate);
		});

		const responseData = [];

		ratesMap.forEach((value, key) => {
			const result = {
				fx_id: key,
				currency: value.currency, // Include currency in response
				rates: []
			};

			// Only include dates with values in the response
			uniqueDatesWithValues.forEach(date => {
				result.rates.push({
					date: date,
					value: value.rates[date] !== undefined ? value.rates[date] : 0 // Use existing value or 0
				});
			});

			responseData.push(result);
		});

		// Prepare the overall min and max data
		const overallMin = Math.min(...data.map(row => parseFloat(row.fx_rate)).filter(rate => rate > 0));
		const overallMax = Math.max(...data.map(row => parseFloat(row.fx_rate)).filter(rate => rate > 0));

		// Final response
		resp.status(200).send({
			success: true,
			data: responseData,
			overall: {
				overallMin: overallMin,
				overallMax: overallMax
			}
		});

	} catch (e) {
		resp.status(500).send({
			success: false,
			message: e.message,
		});
	}
};



const statisticsDropdownGraphSelection = async (req, res) => {
	try {
		const [data] = await db2.query("SELECT * FROM Statistics_dropdown_graph_Selection WHERE Access='C'")

		res.status(200).send({
			success: true,
			message: "Getting Data Successfully",
			data: data,
		})
	} catch (error) {
		res.status(500).send({
			success: false,
			message: error,
		})
	}
}

const ConsigneeStatisticsGraph = async (req, res) => {
	const { Selection_id, Consignee_id, Client_id, Start_Date, End_Date, Compare_Start_DATE, Compare_END_DATE } = req.body;

	try {
		// Fetch data from the stored procedure
		const [data] = await db2.query("CALL Consignee_statistics_Graph(?,?,?,?,?,?,?)", [
			Selection_id, Client_id, Consignee_id, Start_Date, End_Date, Compare_Start_DATE, Compare_END_DATE
		]);

		// Extract Selected_Period and Compared_To_Period from data
		const graphData = data.slice(0, 2);

		// Extract numeric values from Selected_Period and Compared_To_Period
		if (Selection_id == 4) {
			const selectedPeriod = graphData[0].map(item => parseFloat(item.Selected_Period));
			const comparedToPeriod = graphData[1].map(item => parseFloat(item.Compared_To_Period));

			// Combine both periods into a single array for comparison
			const combinedValues = [...selectedPeriod, ...comparedToPeriod];

			// Find the max and min values
			const maxValue = Math.max(...combinedValues) + 1;
			const minValue = Math.min(...combinedValues) - 1;

			// Send the response with the calculated values
			res.status(200).send({
				success: true,
				message: "Getting Data Successfully",
				GraphData: graphData,
				selectedPeriod: selectedPeriod,
				comparedToPeriod: comparedToPeriod,
				MaxPlusOne: maxValue,
				MinMinusOne: minValue,
			});
		} else {
			const selectedPeriod = graphData[1].map(item => parseFloat(item.Selected_Period));
			const comparedToPeriod = graphData[0].map(item => parseFloat(item.Compared_To_Period));

			// Combine both periods into a single array for comparison
			const combinedValues = [...selectedPeriod, ...comparedToPeriod];

			// Find the max and min values
			const maxValue = Math.max(...combinedValues) + 1;
			const minValue = Math.min(...combinedValues) - 1;

			// Send the response with the calculated values
			res.status(200).send({
				success: true,
				message: "Getting Data Successfully",
				GraphData: graphData,
				selectedPeriod: selectedPeriod,
				comparedToPeriod: comparedToPeriod,
				MaxPlusOne: maxValue,
				MinMinusOne: minValue,
			});
		}
	} catch (error) {
		console.error("Error:", error.message); // Log error for debugging
		res.status(500).send({
			success: false,
			message: error.message,
		});
	}
};


const ConsigneeStatisticsTopITF = async (req, res) => {
	const { Selection_id, Consignee_id, Client_id, Start_Date, End_Date, Compare_Start_DATE, Compare_END_DATE } = req.body;
	try {

		const [details] = await db2.query("CALL Consignee_statistics_top_5_ITF(?,?,?,?,?,?,?)",
			[Client_id, Consignee_id, Selection_id, Start_Date, End_Date, Compare_Start_DATE, Compare_END_DATE])

		res.status(200).send({
			success: true,
			message: "Getting Data Successfully",
			Top5Data: details[0]
		})
	} catch (error) {
		res.status(500).send({
			success: false,
			message: error,
		})
	}
}


module.exports = {
	addPackage,
	updatePackaging,
	getAllPackaging,
	addAirport,
	updateAirPort,
	updateAirportStatus,
	getAllAirports,
	addBank,
	updateBankStatus,
	getTransportation,
	getTransportRouteCost,
	EditTransportRouteCost,
	AddTransportRouteCost,
	AddTransportRoute,
	DeleteTransportRoute,
	DeleteTransportRouteCost,
	StatusChangeTransportRoute,
	updateBank,
	getBank,
	addClearance,
	updateclearance,
	updateClearanceStatus,
	getAllClearance,
	addTransPort,
	updateTransportation,
	addEan,
	updateEan,
	getEanData,
	eanStatusUpdate,
	addFreight,
	updateFreight,
	getFreight,
	GetfreightRouteCost,
	EditfreightRouteCost,
	AddfreightRoute,
	AddfreightRouteCost,
	DeletefreightRoute,
	DeletefreightRouteCost,
	StatusChangeFreightRoute,
	StatusChangeItf,
	updateItf,
	addItf,
	getVendorList,
	getCurrency,
	getIft,
	setupLocation,
	createSetupLocation,
	updateSetupLocation,
	getSelectedPakagingForEan,
	addEanPackaging,
	addEanProduce,
	getEanPackagingData,
	getEanProduceData,
	editEanPackaging,
	editEanProduce,
	deleteEanPackaging,
	deleteEanProduce,
	newUpdateEanName,
	getDropdownVendor,
	Clearancedropdown,
	Transportationdropdown,
	Linerdropdown,
	Providerdropdown,
	DeleteBank,
	WalletTotalAccounts,
	getFxRateHistoryGraph,
	statisticsDropdownGraphSelection,
	ConsigneeStatisticsGraph,
	ConsigneeStatisticsTopITF
}
