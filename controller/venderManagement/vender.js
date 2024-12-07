const { db: db2 } = require("../../db/db2")
const db = require("../../db/dbConnection")
const moment = require("moment")

const addVendor = async (req, res) => {
	const vendorName = req.body.name
	const vendorEmail = req.body.email
	const vendorAddress = req.body.address
	const vendorIdCard = req.body.id_card
	const vendorPhone = req.body.phone
	const vendorLineId = req.body.line_id
	const vendorDistrict = req.body.district
	const vendorSubDistrict = req.body.subdistrict
	const vendorProvinces = req.body.provinces
	const vendorPostCode = req.body.postcode
	const vendorCountry = req.body.country
	const vendorBankName = req.body.bank_name
	const vendorBankAccName = req.body.bank_account
	const vendorBankNumber = req.body.bank_number
	const user_id = req.body.user_id
	const createdDate = moment().format()

	try {
		const insertVendorQuery =
			"INSERT INTO vendors (user_id, name, email, address, id_card, phone, line_id, district, subdistrict, provinces, postcode, country, bank_name, bank_account, bank_number, status, created, updated) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
		const insertVendorParams = [
			user_id,
			vendorName,
			vendorEmail,
			vendorAddress,
			vendorIdCard,
			vendorPhone,
			vendorLineId,
			vendorDistrict,
			vendorSubDistrict,
			vendorProvinces,
			vendorPostCode,
			vendorCountry,
			vendorBankName,
			vendorBankAccName,
			vendorBankNumber,
			"on",
			createdDate,
			createdDate,
		]

		await db2.query(insertVendorQuery, insertVendorParams)

		res.status(200).send({
			success: true,
			message: "Vendor Added Successfully",
		})
	} catch (err) {
		res.status(500).send({
			success: false,
			message: err,
		})
	}
}

const vendorUpdate = (req, res) => {
	const vendorId = req.body.vendor_id
	const vendorName = req.body.name
	const vendorEmail = req.body.email
	const vendorType = req.body.type
	const vendorAddress = req.body.address
	const vendorIdCard = req.body.id_card
	const vendorPhone = req.body.phone
	const vendorLineId = req.body.line_id
	const vendorDistrict = req.body.district
	const vendorSubDistrict = req.body.subdistrict
	const vendorProvinces = req.body.provinces
	const vendorPostCode = req.body.postcode
	const vendorCountry = req.body.country
	const vendorBankName = req.body.bank_name
	const vendorBankAccName = req.body.bank_account
	const vendorBankNumber = req.body.bank_number
	const updatedDate = moment().format()

	if (vendorId == "" || !vendorId) {
		res.status(400).send({
			success: false,
			message: "Please Provide Vendor Id",
		})
		return
	}

	db.query(
		`SELECT vendor_id FROM vendors WHERE vendor_id = "${vendorId}"`,
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
					message: "Vendor Id Does Not Exist",
				})
				return
			}
			db.query(
				`UPDATE vendors SET name = "${vendorName}", email = "${vendorEmail}", address = "${vendorAddress}", id_card = "${vendorIdCard}", phone = "${vendorPhone}", line_id = "${vendorLineId}", district = "${vendorDistrict}", subdistrict = "${vendorSubDistrict}", provinces = "${vendorProvinces}", country = "${vendorCountry}", postcode = "${vendorPostCode}", bank_name = "${vendorBankName}", bank_account = "${vendorBankAccName}", bank_number = "${vendorBankNumber}", updated = "${updatedDate}" WHERE vendor_id = "${vendorId}"`,
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
						message: "Vendor Updated Successfully",
					})
					return
				},
			)
		},
	)
}

const getAllVendor = async (req, res) => {
	try {
		const [data] = await db2.query("SELECT * FROM vendors")
		res.status(200).send({
			success: true,
			message: "Getting Vendor Data Successfully",
			data: data,
		})
	} catch (e) {
		res.status(500).send({
			success: false,
			message: e,
		})
	}
}

const vendorStatusUpdate = (req, res) => {
	const vendor_id = req.body.vendor_id
	const updatedDate = moment().format()

	if (vendor_id == "" || !vendor_id) {
		res.status(400).send({
			success: false,
			message: "Please Enter Vendor Id",
		})
		return
	}

	db.query(
		`SELECT status FROM vendors WHERE vendor_id = "${vendor_id}"`,
		(err, data) => {
			if (err) {
				res.status(500).send({
					success: false,
					message: err,
				})
				return
			}
			const statusUpdate = () => {
				if (data[0].status == "on") {
					return "off"
				}
				if (data[0].status == "off") {
					return "on"
				}
				return "on"
			}

			statusUpdate()

			db.query(
				`UPDATE vendors SET status = "${statusUpdate()}", updated = "${updatedDate}" WHERE vendor_id = "${vendor_id}"`,
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
						status: statusUpdate(),
						message: "Vendor Status Updated Successfully",
					})
					return
				},
			)
		},
	)
}

const getDropdownAddressProvinces = (req, res) => {
	db.query("SELECT * FROM dropdown_address_provinces", (error, data) => {
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

const getDropdownAddressDistrict = (req, res) => {
	db.query("SELECT * FROM dropdown_address_district", (error, data) => {
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

const getDropdownAddressSubDistrict = (req, res) => {
	db.query("SELECT * FROM `dropdown_address_sub_district`", (error, data) => {
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

const getDropdownPortType = (req, res) => {
	db.query("SELECT * FROM `dropdown_port_type`", (error, data) => {
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
module.exports = {
	addVendor,
	vendorUpdate,
	getAllVendor,
	vendorStatusUpdate,
	getDropdownAddressSubDistrict,
	getDropdownAddressDistrict,
	getDropdownAddressProvinces,
	getDropdownPortType,
}
