const db = require("./dbConnection")

const util = require("util")

const queryAsync = util.promisify(db.query).bind(db)

const dbQuery = async (sql, values) => {
	const results = await queryAsync(sql, values)
	return results
}

module.exports = dbQuery
