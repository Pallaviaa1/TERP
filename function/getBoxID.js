const getBoxId = (box_id = "", Brand = "") => {
	return [
		"TH",
		(`${box_id}` || "").padStart(4, "0"),
		(`${Brand}` || "").padStart(4, "0"),
		"BOX",
	].join("")
}

module.exports = getBoxId
