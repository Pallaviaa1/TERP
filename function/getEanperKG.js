const getEanPerKg = (data = []) => {
	return (
		1000 /
		data
			.filter((v) => +v.detail_type == 3)
			.reduce((acc, cur) => acc + +(cur.quantity_per_ean || "0"), 0)
	)
}

module.exports = { getEanPerKg }
