
const mysql = require("mysql")

/* let config = {
	host: "localhost",
	user: 'siameats_terpdbadmin',
	password: 'terpdbadmin@1oct',
	database: 'siameats_terp'
} */

let config = {
	host: "localhost",
	port: '3306',
	user: 'root',
	password: '',
	//database: 'terpdp'
	database:'terp_app'
}


/* let config = {
	host: "localhost",
	user: 'siameats_siameatsterp',
	password: 'iFq(6K^+tIT4',
	database: 'siameats_siameatsterp'
} */

if (process.env.NODE_ENV === "production") {
	config = {
		host: "localhost",
		user: 'siameats_terpdbadmin',
		password: 'terpdbadmin@1oct',
		database: 'siameats_terp'
	}
}

const connection = mysql.createConnection({
	namedPlaceholders: true,
	...config,
	timeout: "10000",
})

connection.connect((error) => {
	if (error) {
		console.log(error)
	} else {
		console.log("Database Connected Successfully")
	}
})

module.exports = connection
