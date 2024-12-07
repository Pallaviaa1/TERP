const getInventoryID = (
	packaging_id = "",
	type_id = "",
	packaging_inventory_type_id = "",
) => {
	return [
		"TH",
		(`${packaging_id}` || "").padStart(4, "0"),
		(`${type_id}` || "").padStart(2, "0"),
		(`${packaging_inventory_type_id}` || "").padEnd(2, "0"),
		"PKG",
	].join("")
}

module.exports = getInventoryID
