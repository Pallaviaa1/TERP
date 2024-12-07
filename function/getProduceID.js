const getProduceId = (produce_id = "", produce_classification_id = "") => {
	return [
		"TH",
		`${produce_id}`.padStart(4, "0"),
		`${produce_classification_id}`.padStart(4, 0),
		"BKK",
	].join("")
}

module.exports = { getProduceId }
