const bcrypt = require("bcryptjs")
const moment = require("moment")
const { db } = require("../../db/db2")
const sendMail = require('../../helpers/sendMail');

const adminLogin = async (req, res) => {
	const password = req.body.password

	try {
		if (!req.body.email || req.body.email == " " || req.body.email == null)
			throw new Error("email is empty!")
		if (
			!req.body.password ||
			req.body.password == " " ||
			req.body.password == null
		)
			throw new Error("password is empty!")

		const [rows, fields] = await db.execute(
			"SELECT * FROM users WHERE email = ? and is_deleted= ?",
			[req.body.email, 0],
		)
		if (!rows.length) throw new Error("Username Incorrect")

		const user = rows[0];

		// Check if the user's status is Inactive
		if (user.status === 'Inactive') {
			throw new Error("Account is inactive. Please contact support.");
		}

		if (!(await bcrypt.compareSync(password, rows[0].password)))
			throw new Error("Username Or Password Incorrect")
		await db.execute("UPDATE users SET last_login = NOW() WHERE id = ?", [
			rows[0].id,
		])
		res.status(200).send({
			success: true,
			message: "Login Successfully",
			user: { ...rows[0], password: undefined },
		})
	} catch (err) {
		return res.status(500).send({
			success: false,
			msg: err.message,
		})
	}
}

const forgotPassword = async (req, res) => {
	try {
		const { email } = req.body;

		function generateOTP() {
			return Math.floor(1000 + Math.random() * 9000);
		}

		const otp = generateOTP();
		const sqlQuery = `SELECT * FROM users WHERE email=? AND is_deleted=?`;

		const [data] = await db.execute(sqlQuery, [email, 0]);
		// console.log(data);
		if (data.length > 0) {
			const Email = data[0].email;
			const mailSubject = 'OTP Verification';
			const content = `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Forgot Password - Reset Your Password</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            margin: 0;
                            padding: 0;
                            background-color: #f4f4f4;
                        }
                        .container {
                            width: 60%;
                            margin: 0 auto;
                            overflow: hidden;
                        }
                        .message {
                            text-align: center;
                            margin-top: 20px;
                            color: #666;
                        }
                        .otp-box {
                            background-color: #f3fcfd;
                            text-align: center;
                            padding: 20px;
                            border-radius: 5px;
                            margin-top: 20px;
                        }
                        
                        .otp-code {
                            font-size: 36px;
                            font-weight: bold;
                            color: #333;
                        }
                        header {
                            background: #ffffff;
                            color: #000000;
                        }
                        header::after {
                            content: '';
                            display: table;
                            clear: both;
                        }
                        section {
                            float: left;
                            width: 70%;
                            margin-top: 20px;
                            padding: 20px;
                            background: #ffffff;
                            border-radius: 5px;
                        }
                        section h2 {
                            color: #333;
                        }
                        .footer {
                            float: left;
                            width: 100%;
                            padding: 10px 0;
                            background: #ffffff;
                            text-align: center;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <section>
                            <h2>Dear ${data[0].name},</h2>
                            <p>We received a request to reset your password. To proceed, please use the following One-Time Password (OTP):</p>
                            <div class="otp-box">
                                <div class="otp-code">${otp}</div>
                            </div>
                            <p class="message">This OTP will expire in 30 minutes.</p>
                            <p>If you didn't request a password reset, you can ignore this email.</p>
                            <p>Thank you!</p>
                            <div class="footer">&copy; 2023 Siam Eats. All rights reserved. </div>
                        </section>
                    </div>
                </body>
                </html>`;

			await sendMail(Email, mailSubject, content, (error, info) => {
				if (error) {
					return res.status(500).json({
						success: false,
						message: 'Failed to send email',
						error: error.message,
					});
				}
			});

			const delTokenQuery = "DELETE FROM resetpass_otp WHERE email = ?";
			await db.execute(delTokenQuery, [data[0].email]);

			const sql = 'INSERT INTO resetpass_otp (email, otp) VALUES (?, ?)';
			await db.execute(sql, [email, otp]);

			res.status(200).json({
				success: true,
				message: 'Your OTP has been sent to the email'
			});
		} else {
			res.status(200).send({
				success: false,
				message: 'Email address is invalid!'
			});
		}
	} catch (error) {
		res.status(500).send({
			success: false,
			message: error.message
		});
	}
};


const VerifyOtp = async (req, res) => {
	try {
		const { otp } = req.body;
		const otpCheckQuery = 'SELECT * FROM resetpass_otp WHERE otp = ?';

		const [results] = await db.execute(otpCheckQuery, [otp]);

		if (results.length === 0) {
			res.status(200).json({
				success: false,
				message: 'Invalid OTP'
			});
		} else {
			const selectQuery = 'SELECT * FROM users WHERE email = ?';
			const [userData] = await db.execute(selectQuery, [results[0].email]);

			res.status(200).json({
				success: true,
				message: 'OTP verified successfully',
				user_id: userData[0].id
			});
		}
	} catch (error) {
		res.status(500).send({
			success: false,
			message: error.message
		});
	}
};


const ResetPassword = async (req, res) => {
	try {
		const { newPassword, confirmPassword } = req.body;
		const { id } = req.query;

		if (newPassword !== confirmPassword) {
			res.status(400).send({
				success: false,
				msg: "New password and confirm password do not match!"
			});
			return;
		}

		const selectQuery = 'SELECT * FROM users WHERE id = ?';
		const [result] = await db.execute(selectQuery, [id]);

		if (result.length === 0) {
			res.status(400).send({
				success: false,
				message: 'User not found!'
			});
			return;
		}

		const hashedPassword = await bcrypt.hash(newPassword, 10);

		const updateQuery = 'UPDATE users SET password = ? WHERE id = ?';
		const [updateResult] = await db.execute(updateQuery, [hashedPassword, id]);

		if (updateResult.affectedRows > 0) {
			const delTokenQuery = 'DELETE FROM resetpass_otp WHERE email = ?';
			await db.execute(delTokenQuery, [result[0].email]);

			res.status(200).send({
				success: true,
				message: 'Password reset successfully!'
			});
		} else {
			res.status(400).send({
				success: false,
				message: 'Failed to update password!'
			});
		}
	} catch (error) {
		res.status(500).send({
			success: false,
			message: error.message
		});
	}
};


module.exports = { adminLogin, forgotPassword, VerifyOtp, ResetPassword }
