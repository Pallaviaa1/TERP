const bcrypt = require("bcryptjs")
const { db } = require("../../db/db2")


const CreateUser = async (req, res) => {
	const password = req.body.password

	try {
		if (
			!password ||
			password == " " ||
			password == null
		)
			throw new Error("password is empty!")
		var hash = bcrypt.hashSync(password, 8);
		const [rows] = await db.execute(
			"INSERT INTO users (name, email, client, consignee, permission, password, role, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
			[
				req.body.name,
				req.body.user_name,
				req.body.client,
				req.body.consignee,
				req.body.permission,
				hash,
				req.body.role,
				req.body.status
			],
		)
		res.status(200).send({
			success: true,
			message: "User Added Successfully"
		})
	} catch (err) {
		return res.status(500).send({
			success: false,
			msg: err.message,
		})
	}
}


const getClientConsignee = async (req, res) => {
	try {
		const { client_id } = req.body;
		const [data] = await db.query(`SELECT consignee_id, consignee_name FROM consignee where client_id='${client_id}'`)
		res.status(200).json({
			message: "All Consignee",
			data: data,
		})
	} catch (e) {
		res.status(400).json({
			message: "Error Occured",
			error: e.message,
		})
	}
}

const getAllUsers = async (req, res) => {
	try {
		const [data] = await db.query(`
			SELECT users.*, consignee.consignee_name, clients.client_name 
			FROM users 
			LEFT JOIN consignee ON users.consignee = consignee.consignee_id
			LEFT JOIN clients ON clients.client_id = users.client
			WHERE users.is_deleted='${0}'
		`);
		res.status(200).json({
			message: "All Users",
			data: data,
		});
	} catch (e) {
		res.status(400).json({
			message: "Error Occurred",
			error: e.message,
		});
	}
};


const deleteUser = async (req, res) => {
	try {
		const { user_id } = req.body;
		const [data] = await db.query(`update users set is_deleted='${1}' where id='${user_id}'`)
		res.status(200).json({
			success: true,
			message: "Delete user successfully"
		})
	} catch (e) {
		res.status(400).json({
			message: "Error Occured",
			error: e.message,
		})
	}
}


const updateUser = async (req, res) => {
	try {

		if (!req.body.password) {
			var hash = bcrypt.hashSync(req.body.password, 8);
			await db.query(
				"UPDATE users SET name=?,  client=?, consignee=?, permission=?, role=?, status=? WHERE id = ?",
				[
					req.body.name,
					req.body.client,
					req.body.consignee,
					req.body.permission,
					req.body.role,
					req.body.status,
					req.body.user_id
				],
			)
			res.status(200).send({
				success: true,
				message: "User Updated Successfully",
			})
			return
		}
		else {
			var hash = bcrypt.hashSync(req.body.password, 8);

			await db.query(
				"UPDATE users SET name=?,  client=?, consignee=?, permission=?, role=?, status=?, password=? WHERE id = ?",
				[
					req.body.name,
					req.body.client,
					req.body.consignee,
					req.body.permission,
					req.body.role,
					req.body.status,
					hash,
					req.body.user_id
				],
			)
			res.status(200).send({
				success: true,
				message: "User Updated Successfully"
			})
			return
		}

	} catch (e) {
		res.status(500).send({
			success: false,
			message: e,
		})
	}
}

const UserReset = async (req, res) => {
	var hash = bcrypt.hashSync('req.body.password', 8);
	if (req.body.user_name) {
		// Update both user_name and password
		await db.query(
			"UPDATE users SET email=?, password=? WHERE id = ?",
			[
				req.body.user_name,
				hash,
				req.body.user_id
			]
		);
	} else {
		// Update only password
		await db.query(
			"UPDATE users SET password=? WHERE id = ?",
			[
				hash,
				req.body.user_id
			]
		);
	}

	res.status(200).send({
		success: true,
		message: "User reset Successfully"
	});
};


const CheckIsActive = async (req, res) => {
	try {
		const { user_id } = req.body;

		// Query to check user activity status
		const [result] = await db.query("SELECT status FROM users WHERE id = ?", [user_id]);

		if (result.length > 0) {
			const status = result[0].status; // Get the status value, e.g., 'Active' or 'Inactive'

			// Set isActive to 1 if status is 'Active', otherwise set to 0
			const isActive = status === 'Active' ? 1 : 0;

			res.status(200).json({
				success: true,
				isActive: isActive // Returns 1 for 'Active' and 0 for 'Inactive'
			});
		} else {
			res.status(404).json({
				success: false,
				message: "User not found"
			});
		}
	} catch (error) {
		res.status(500).json({
			success: false,
			message: "Internal server error",
			error: error.message
		});
	}
};


module.exports = { CreateUser, getClientConsignee, getAllUsers, deleteUser, updateUser, UserReset, CheckIsActive } 