const { Router } = require("express")
const multer = require("multer")
const path = require('path');

const { adminLogin, forgotPassword, VerifyOtp, ResetPassword } = require("../controller/admin/adminLogin")
const {
	CreateUser,
	getClientConsignee,
	getAllUsers,
	deleteUser,
	updateUser,
	UserReset,
	CheckIsActive

} = require("../controller/admin/createUser")
const {
	addClient,
	getAllClients,
	updateClientData,
	getClientAsOptions,
	clientShipTo,
	updateClientShipTo,
	getShipTo,
	updateClientStatus,
	updateShipToStatus,
	getClientStatistics,
	getClientStatement,
	insertClientPayment,
	MainStatisticsAll
} = require("../controller/clientManagement/client")
const {
	getEanDeatils,
	addEanDetails,
	updateEanDetails,
	createEan,
	EditEan,
	getEanDetailViews,
	createEanProducne,
	createEanPacking,
	Adjust_sorting_stock,
	CheckstartEndTime,
	getEANList
} = require("../controller/ean/ean")

const {
	addPackage,
	updatePackaging,
	getAllPackaging,
	addAirport,
	updateAirPort,
	updateAirportStatus,
	getAllAirports,
	addBank,
	updateBank,
	updateBankStatus,
	getBank,
	addClearance,
	updateclearance,
	updateClearanceStatus,
	getAllClearance,
	addTransPort,
	updateTransportation,
	getTransportation,
	getTransportRouteCost,
	EditTransportRouteCost,
	AddTransportRouteCost,
	AddTransportRoute,
	DeleteTransportRoute,
	DeleteTransportRouteCost,
	StatusChangeTransportRoute,
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
	addItf,
	getVendorList,
	getCurrency,
	getIft,
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
	ConsigneeStatisticsTopITF,
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
	updateItf,
} = require("../controller/setup/setup")

const {
	vendorUpdate,
	addVendor,
	getAllVendor,
	vendorStatusUpdate,
	getDropdownAddressProvinces,
	getDropdownAddressDistrict,
	getDropdownAddressSubDistrict,
	getDropdownPortType,
} = require("../controller/venderManagement/vender")
const {
	purchaseOrderDetails,
	purchaseOrderStatus,
	getDropdownType,
	newAddPurchaseOrder,
	getNewPurchaseOrder,
	newUpdatePurchaseOrder,
	addPurchaseOrderDetails,
	getPurchaseOrderDetails,
	deletePurchaseOrderDetails,
	updatePurchaseOrderDetails,
	purchaseOrderView,
	getArrayValues,
	LastPurchase,
	purchaseOrderPayment,
	purchaseOrderPaymentDetails,
	purchaseOrderListByVendor,
	PurchaseStatistics,
	getNewPurchaseOrderDetails,
	SuggestedPurchases,
	DeletePurchase,
	PurchaseVendorStatement,
	PurchaseTypeItemsList,
	purchaseOrderPdfDetails,
	expensePaymentSlip,
	InvoicePaymentSlip,
	PurchaseOrderPackagingPayable,
	RecordCommission
} = require("../controller/purchaseOrder/purchase")
const {
	getAirline,
	addAirline,
	updateAirline,
	updateAirlineStatus,
	getjourneyNumber,
	Addjourneydetails,
	getjourneyDetails,
	DeleteJourney
} = require("../controller/airline")
const {
	addItfEan,
	addItfPb,
	getItfEan,
	getItfPb,
	deleteItfEan,
	deleteItfPb,
	updateItfEan,
	updateItfPb,
	getItfDetails,
	updateItfDetails,
	addItfDetails,
} = require("../controller/itf/itf")
const { getAllWage, updateWage, addWage } = require("../controller/wage")
const {
	getAllReceving,
	getAllReceving_bp,
	getViewToReceving,
	addReceving,
} = require("../controller/receving")
const {
	getViewToSort,
	addsorting,
	getSorting,
	revertSorting,
	restoreEanPacking,
	restoreSorting,
	restorePackingCommon
} = require("../controller/sorting")

const { updatePrice, GetProduceName, updateFxRateHistory, GetFxRate, updateProduceAvailability, AslList, HPLList, updateCompanyAddress, getCompanyAddress, addCompanyAddress } = require("../controller/updatePrice")
const {
	getToPack,
	addPackingCommon,
	addPackingEan,
	getBrand,
	getPackingCommon,
} = require("../controller/pack")

const {
	getClaim, getClaimDetails, dropdownClaimReason, updateClaim, insertClaim, AddClaimDetails, DeleteClaim, getPurchaseClaimDetails
} = require("../controller/claim")
const {
	getConsignee,
	getConsigneeByID,
	createConsignee,
	updateConsignee,
	getConsigneeCustomization,
	createConsigneeCustomize,
	updateConsigneeCustomize,
	addContactDetails,
	DropdownContactType,
	getContactList,
	updateContactDetails,
	getConsigneeStatistics,
	getConsigneeStatement,
	getConsigneeByUser,
	MarginandPayments,
	DropdownDelivery,
	FXCorrection,
	updateMarginPaymentConsignee,
	updateConsigneeNotify,
	ConsigneeStatisticsAll,
	DeleteConsigneeCustomization,
	DeleteContactDetails
} = require("../controller/consignee")
const {
	getAllQuotation,
	addQuotation,
	addQuotationDetails,
	calculateQuotation,
	getQuotationSummary,
	getQuotationDetials,
	deleteQuotationDetials,
	updateQuotationDetails,
	updateQuotation,
	confirmQuotation,
	InsertQuotationDetails,
	getQuotationDetailsView,
	deleteQuotation,
	copyQuotation,
	QuotationConfirmation,
	quotation_proforma,
	RecalculateQuotation,
	quotation_delivery_terms,
	quotation_pdf_delivery_by,
	QuotationPDF,
	QuotationITFCHECK,
	ExpireQuotations,
	getoneQuotationData,
	NewItfDropDown,
	QuotationMarkup,
	QuotationCostModal,
	OrderCostModal,
	InvoiceCostModal
} = require("../controller/quotation")
const {
	getTransportation_Supplier,
	getFreight_Supplier,
	getdropdown_commission_type,
	getChartOfAccounts,
} = require("../controller/view")
const {
	getOrders,
	getOrdersPacking,
	createOrder,
	updateOrder,
	getOrdersDetails,
	getOrderPackingDetails,
	deleteOrderDetails,
	calculateOrder,
	doOrderPacking,
	newCalculateOrder,
	addOrderInput,
	getOrderSummary,
	deleteOrder,
	updateOrderFreight,
	aslWastage,
	RestoreOrderPacking,
	RecalculateOrder,
	getOrderPacking,
	CompanyAddress,
	invoiceDetailsList,
	getorderFreightDetails,
	GetOrderPdfDetails,
	OrderPdfDetails,
	InvoicePdfDetails,
	GenerateInvoiceTick,
	GetInvoicePdfDetails,
	GetinvoiceDetails,
	getInvoiceSummary,
	getInvoiceDeatilsTable,
	EditInvoiceDetails,
	orderPdfTable,
	getOrderFinancials,
	invoiceLoader,
	InvoiceAdjustWeight,
	InvoiceShipped,
	UploadPdf,
	ApproveOrder,
	InvoiceCalculatedPrice,
	ConsigneeITFdropdown,
	ConsigneeBrandDropdown,
	ProduceTrendGraph,
	getOrderById,
	getInvoiceById,
	RebateRecord,
	RebateReduceInvoice,
	CustomeInvoicePdfDetails,
	copyOrder,
	invoicePdfTable,
	InvoiceNotes,
	OrderNotes,
	cancle_invoice,
	invoice_procedure,
	proformaMain_Invoice,
	pdf_delivery_by,
	InvoiceDetails,
	order_delivery_terms,
	proformaMain_Order,
	insertInvoicePayment,
	getInvoiceByClientID,
	AccountingStatistics,
	PaymentChannela,
	InvoiceAWBReady,
	calculateInvoice
} = require("../controller/orders")
const { dashboardOpertation } = require("../controller/operation")
const {
	createUnit,
	updateUnit,
	getAllUnit,
	updateUnitStatus,
} = require("../controller/setup/unit")
const {
	addBoxes,
	editBoxes,
	getAllBoxes,
} = require("../controller/setup/boxes")
const {
	addNotification, GetNotificationList, UpdateNotification, getUserNotification, updateNotificationSeen
} = require("../controller/setup/notification")
const {
	createProduce,
	updateProduce,
	getAllProduceItem,
	getSelectProduceItemForEan,
	getDropdownProduceClassification,
	editAvailableProcedure
} = require("../controller/setup/produce")
const { getEanAvailable } = require("../controller/eanAvaiable")
const { getProduceAvailable } = require("../controller/produceAvailable")
const { getBoxesAvailable, StockAdjustmentPB } = require("../controller/boxesAvailable")
const { getPackagingAvailable } = require("../controller/packagingAvailable")
const {
	getAdjustEanStock,
	getAdjustEanStockById,
	doRepackEan,
	deleteAdjustEAN,
	AssignOrderDropDownList,
	dropDownAdjustEan,
	getAdjustEanView,
	chartOfAccounts,
	createChartOfAccount,
	updateChartOfAccount,
	deleteChartOfAccount,
	LedgerList,
	AccountWalletStatment,
	AccountTransfer,
	DeleteInvoicePayment,
	DeleteExpensePayment,
	LedgerListByUser,
	GetStatisticsDateSelection,
	StatisticsDATEComparision,
	StatisticsDATESelection2,
	statisticsDateSelection1,
	StatisticsDATEselection
} = require("../controller/ean")
const { ExportTest } = require("../controller/pdf/test")
const {
	getAllExpenseItems,
	createExpenseItems,
	updateExpenseItems,
} = require("../controller/expenseitem");
const { rollback } = require("../db/dbConnection");
const router = Router()

const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, "./public/image")
	},
	filename: (req, file, cb) => {
		cb(null, new Date().getTime() + path.extname(file.originalname))
	},
})


const imageFilter = (req, file, cb) => {
	if (
		file.mimetype == "image/png" ||
		file.mimetype == "image/jpg" ||
		file.mimetype == "image/jpeg" ||
		file.mimetype == "application/pdf"
	) {
		cb(null, true)
	} else {
		cb(null, false)
		return cb(new Error("Only .png, .jpg, .jpeg, .pdf formats are allowed!"))
	}
}

const upload = multer({
	storage: storage,
	fileFilter: imageFilter,
	limits: { fileSize: 1024 * 1024 * 10 },
})

const Newstorage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, './public/image');
	},
	filename: (req, file, cb) => {
		// Use the original file name
		cb(null, file.originalname);
	},
});

const uploads = multer({ storage: Newstorage });

router.post("/adminLogin", adminLogin)
router.post("/forgotPassword", forgotPassword)
router.post("/VerifyOtp", VerifyOtp)
router.post("/ResetPassword", ResetPassword)

router.post("/addClient", addClient)
router.get("/getAllClients", getAllClients)
router.post("/updateClientData", updateClientData)
router.get("/getClientDataAsOptions", getClientAsOptions)
router.post("/updateClientStatus", updateClientStatus)  // all done

router.post("/CreateUser", CreateUser)
router.post("/getClientConsignee", getClientConsignee)
router.get("/getAllUsers", getAllUsers);
router.post('/deleteUser', deleteUser);
router.post('/updateUser', updateUser)
router.post('/UserReset', UserReset)
router.post("/CheckIsActive", CheckIsActive)

router.post("/createUnit", createUnit)
router.post("/updateUnit", updateUnit)
router.get("/getAllUnit", getAllUnit)
router.post("/updateUnitStatus", updateUnitStatus)
router.post("/createProduce", upload.single('images'), createProduce)
router.post("/updateProduce", upload.single('images'), updateProduce)
router.get("/getAllProduceItem", getAllProduceItem)
router.post("/addBoxes", upload.single('images'), addBoxes)
router.post("/editBoxes", upload.single('images'), editBoxes)
router.get("/getAllBoxes", getAllBoxes)
router.post("/addNotification", addNotification)
router.get("/GetNotificationList", GetNotificationList)
router.post("/UpdateNotification", UpdateNotification)
router.post("/getUserNotification", getUserNotification)
router.post("/updateNotificationSeen", updateNotificationSeen)

router.post("/addPackage", addPackage)
router.post("/updatePackaging", updatePackaging)
router.get("/getAllPackaging", getAllPackaging)
router.post("/addVendor", addVendor)
router.post("/vendorUpdate", vendorUpdate)
router.get("/getAllVendor", getAllVendor)
router.post("/updateVendorStatus", vendorStatusUpdate)
router.post("/clientShipTo", clientShipTo)
router.post("/updateClientShipTo", updateClientShipTo)

router.get("/getShipTo", getShipTo)

router.post("/udpateShipToStatus", updateShipToStatus)
router.post("/getClientStatistics", getClientStatistics)
router.post("/getClientStatement", getClientStatement)
router.post("/insertClientPayment", insertClientPayment)
router.post("/MainStatisticsAll", MainStatisticsAll)

router.post("/getConsigneeStatement", getConsigneeStatement)
router.post("/getConsigneeByUser", getConsigneeByUser)
router.post("/MarginandPayments", MarginandPayments)
router.get("/DropdownDelivery", DropdownDelivery)
router.get("/FXCorrection", FXCorrection)
router.post("/updateMarginPaymentConsignee", updateMarginPaymentConsignee)
router.post("/updateConsigneeNotify", updateConsigneeNotify)
router.post("/ConsigneeStatisticsAll", ConsigneeStatisticsAll)
router.post("/DeleteConsigneeCustomization", DeleteConsigneeCustomization)
router.post("/DeleteContactDetails", DeleteContactDetails)

router.post("/addAirport", addAirport)
router.post("/updateAirPort", updateAirPort)
router.post("/updateAirportStatus", updateAirportStatus)
router.get("/getAllAirports", getAllAirports)
router.post("/addBank", addBank)
router.post("/updateBank", updateBank)
router.post("/updateBankStatus", updateBankStatus)
router.get("/getBank", getBank)
router.post("/addClearance", addClearance)
router.post("/updateClearance", updateclearance)
router.post("/updateClearanceStatus", updateClearanceStatus)
router.get("/getClearance", getAllClearance)
router.post("/addTransportation", addTransPort)
router.post("/updateTransportation", updateTransportation)
router.get("/getTransport", getTransportation)
router.post("/getTransportRouteCost", getTransportRouteCost)
router.post("/EditTransportRouteCost", EditTransportRouteCost)
router.post("/AddTransportRouteCost", AddTransportRouteCost)
router.post("/AddTransportRoute", AddTransportRoute)
router.post("/DeleteTransportRoute", DeleteTransportRoute)
router.post("/DeleteTransportRouteCost", DeleteTransportRouteCost)
router.post("/StatusChangeTransportRoute", StatusChangeTransportRoute)
router.post("/AddfreightRoute", AddfreightRoute)
router.post("/AddfreightRouteCost", AddfreightRouteCost)
router.post("/DeletefreightRoute", DeletefreightRoute)
router.post("/DeletefreightRouteCost", DeletefreightRouteCost)
router.post("/StatusChangeFreightRoute", StatusChangeFreightRoute)
router.post("/StatusChangeItf", StatusChangeItf)
// testing mode (working on later)
router.post("/addEan", addEan)
router.post("/updateEan", updateEan)
router.get("/getEan", getEanData)
router.post("/eanStatus", eanStatusUpdate)

router.get("/getProduceItemForEan", getSelectProduceItemForEan)
router.get("/getPackaginItemForEan", getSelectedPakagingForEan)
router.post("/createEan", upload.single('images'), createEan)
router.post("/addEanPackaging", upload.none([]), addEanPackaging)
router.post("/addEanProduce", upload.none([]), addEanProduce)
router.post("/getEanPackaging", getEanPackagingData)
router.post("/getEanProduce", getEanProduceData)
router.post("/editEanPackaging", upload.none([]), editEanPackaging)
router.post("/editEanProduce", upload.none([]), editEanProduce)
router.post("/deleteEanPackaging", deleteEanPackaging)
router.post("/deleteEanProduce", deleteEanProduce)
router.post("/editEan", upload.single('images'), EditEan)
router.post("/updateEanName", newUpdateEanName)
router.post("/Adjust_sorting_stock", Adjust_sorting_stock)
router.post("/CheckstartEndTime", CheckstartEndTime)
router.post("/getEANList", getEANList)

// testing mode (working on later)
router.post("/addPurchaseOrder", newAddPurchaseOrder)
router.get("/getPurchaseOrder", getNewPurchaseOrder)
router.post("/updatePurchaseOrder", newUpdatePurchaseOrder)
router.post("/getPurchaseDetails", purchaseOrderDetails)
router.post("/purchaseOrderView", purchaseOrderView)
router.post("/getArrayValues", getArrayValues)
router.get("/LastPurchase", LastPurchase)
router.post("/purchaseOrderPayment", purchaseOrderPayment)
router.post("/purchaseOrderPaymentDetails", purchaseOrderPaymentDetails)
router.post("/purchaseOrderListByVendor", purchaseOrderListByVendor)
router.get("/PurchaseStatistics", PurchaseStatistics)
router.post("/getNewPurchaseOrderDetails", getNewPurchaseOrderDetails)
router.get("/SuggestedPurchases", SuggestedPurchases)
router.post("/DeletePurchase", DeletePurchase)
router.post("/PurchaseVendorStatement", PurchaseVendorStatement)
router.post("/PurchaseTypeItemsList", PurchaseTypeItemsList)
router.post("/purchaseOrderPdfDetails", purchaseOrderPdfDetails)
router.post("/expensePaymentSlip", expensePaymentSlip)
router.post("/InvoicePaymentSlip", InvoicePaymentSlip)
router.get("/PurchaseOrderPackagingPayable", PurchaseOrderPackagingPayable)
router.post("/RecordCommission", RecordCommission)

router.post("/updatePodStatus", purchaseOrderStatus)
router.get("/getFreight", getFreight)
router.post("/GetfreightRouteCost", GetfreightRouteCost)
router.post("/EditfreightRouteCost", EditfreightRouteCost)
router.post("/addFreight", addFreight)
router.post("/updateFreight", updateFreight)
router.post("/addItf", upload.single('images'), addItf)
router.post("/updateItf", upload.single('images'), updateItf)
router.get("/getItf", getIft)
router.get("/getVendorList", getVendorList)
router.get("/getCurrency", getCurrency)
router.get("/getDropdownVendor", getDropdownVendor)
router.get("/getClearancedropdown", Clearancedropdown)
router.get("/getTransportationdropdown", Transportationdropdown)
router.get("/getLinerdropdown", Linerdropdown)
router.get("/Providerdropdown", Providerdropdown)
router.post("/DeleteBank", DeleteBank)
router.get("/WalletTotalAccounts", WalletTotalAccounts)
router.get("/getFxRateHistoryGraph", getFxRateHistoryGraph)
router.get("/statisticsDropdownGraphSelection", statisticsDropdownGraphSelection)
router.post("/ConsigneeStatisticsGraph", ConsigneeStatisticsGraph)
router.post("/ConsigneeStatisticsTopITF", ConsigneeStatisticsTopITF)
router.get("/getDropdownProduceClassification", getDropdownProduceClassification,
)
router.get("/getDropdownAddressProvinces", getDropdownAddressProvinces)
router.get("/getDropdownAddressDistrict", getDropdownAddressDistrict)
router.get("/getDropdownAddressSub-district", getDropdownAddressSubDistrict)
router.get("/getDropdownPortType", getDropdownPortType)
router.get("/getDropdownType", getDropdownType)

router.get("/getLocation", setupLocation)
router.post("/createLocation", createSetupLocation)
router.post("/updateLocation", updateSetupLocation)

router.get("/getLiner", getAirline)
router.post("/updateLiner", updateAirline)
router.post("/updateAirlineStatus", updateAirlineStatus)
router.post("/getjourneyNumber", getjourneyNumber)
router.post("/Addjourneydetails", Addjourneydetails)
router.get("/getjourneyDetails", getjourneyDetails)
router.post("/DeleteJourney", DeleteJourney)

// ITF

router.post("/addItfEan", addItfEan)
router.post("/addItfPb", addItfPb)
router.post("/getItfEan", getItfEan)
router.post("/getItfPb", getItfPb)
router.post("/deleteItfEan", deleteItfEan)
router.post("/deleteItfPb", deleteItfPb)
router.post("/updateItfEan", updateItfEan)
router.post("/updateItfPb", updateItfPb)

router.post("/addPurchaseOrderDetails", addPurchaseOrderDetails)
router.get("/getPurchaseOrderDetails", getPurchaseOrderDetails)
router.post("/deletePurchaseOrderDetails", deletePurchaseOrderDetails)
router.post("/updatePurchaseOrderDetails", updatePurchaseOrderDetails)

router.get("/getAllWage", getAllWage)
router.post("/updateWage", updateWage)
router.post("/addWage", addWage)

router.get("/getAllReceving", getAllReceving)
router.get("/getAllRecevingBp", getAllReceving_bp)
router.get("/getViewToReceving", getViewToReceving)
router.post("/addReceving", addReceving)

router.get("/getViewToSort", getViewToSort)
router.post("/addsorting", addsorting)
router.get("/getSorting", getSorting)
router.post("/revertSorting", revertSorting)
router.post("/restoreEanPacking", restoreEanPacking)  // new_added
router.post("/restoreSorting", restoreSorting)
router.post("/restorePackingCommon", restorePackingCommon)

router.post("/updatePrice", updatePrice)
router.get("/GetProduceName", GetProduceName)
router.post("/updateFxRateHistory", updateFxRateHistory)
router.get("/GetFxRate", GetFxRate)
router.post("/updateProduceAvailability", updateProduceAvailability)
router.get("/AslList", AslList)
router.get("/HPLList", HPLList)
router.post("/updateCompanyAddress", uploads.single('logo'), updateCompanyAddress)
router.get("/getCompanyAddress", getCompanyAddress)
router.post("/addCompanyAddress", uploads.single('logo'), addCompanyAddress)


router.get("/getToPack", getToPack)
router.post("/addPackingCommon", addPackingCommon)
router.post("/addPackingEan", addPackingEan)
router.get("/getBrand", getBrand)
router.post("/getPackingCommon", getPackingCommon)

router.get("/getEanDetails", getEanDeatils)
router.post("/getEanDetailViews", getEanDetailViews)
router.post("/addEanDetails", addEanDetails)
// router.post("/addEanDetails", upload.single('image'), addEanDetails)
router.post("/updateEanDetails", updateEanDetails)
router.post("/getItfDetails", getItfDetails)
router.post("/getItfDetails", getItfDetails)
router.post("/updateItfDetails", updateItfDetails)
router.post("/addItfDetails", addItfDetails)
router.post("/createEanProducne", createEanProducne)
router.post("/createEanPacking", createEanPacking)

router.get("/getConsignee", getConsignee)
router.get("/getConsigneeByID", getConsigneeByID)
router.post("/getConsigneeCustomization", getConsigneeCustomization)
router.post("/createConsigneeCustomize", createConsigneeCustomize)
router.post("/updateConsigneeCustomize", updateConsigneeCustomize)
router.post("/addContactDetails", addContactDetails)
router.get("/DropdownContactType", DropdownContactType)
router.post("/getContactList", getContactList)
router.post("/updateContactDetails", updateContactDetails)
router.post("/getConsigneeStatistics", getConsigneeStatistics)

router.get("/getAllQuotation", getAllQuotation)
router.post("/addQuotation", addQuotation)
router.post("/addQuotationDetails", addQuotationDetails)
router.post("/calculateQuotation", calculateQuotation)

router.get("/getTransportation_Supplier", getTransportation_Supplier)

router.get("/getQuotationDetials", getQuotationDetials)
router.get("/getQuotationSummary", getQuotationSummary)
router.post("/deleteQuotationDetials", deleteQuotationDetials)
router.post("/updateQuotationDetails", updateQuotationDetails)
router.post("/updateQuotation", updateQuotation)
router.post("/confirmQuotation", confirmQuotation)
router.post("/insertQuotationDetails", InsertQuotationDetails)
router.get("/getQuotationDetailsView", getQuotationDetailsView)
router.post("/getoneQuotationData", getoneQuotationData)
router.post("/NewItfDropDown", NewItfDropDown)
router.post("/QuotationMarkup", QuotationMarkup)
router.post("/QuotationCostModal", QuotationCostModal)
router.post("/OrderCostModal", OrderCostModal)
router.post("/InvoiceCostModal", InvoiceCostModal)
router.get("/getFreight_Supplier", getFreight_Supplier)

router.post("/deleteQuotation", deleteQuotation)
router.post("/copyQuotation", copyQuotation)
router.post("/QuotationConfirmation", QuotationConfirmation)


router.get("/getDropdownCommissionType", getdropdown_commission_type)
router.post("/createConsignee", createConsignee)
router.post("/updateConsignee", updateConsignee)


router.get("/dashboardOpertation", dashboardOpertation)


router.get("/getOrders", getOrders)
router.get("/getOrdersPacking", getOrdersPacking)
router.post("/createOrder", createOrder)
router.post("/updateOrder", updateOrder)
router.get("/getOrdersDetails", getOrdersDetails)
router.get("/getOrderPackingDetails", getOrderPackingDetails)
router.post("/deleteOrderDetails", deleteOrderDetails)
router.post("/calculateOrder", calculateOrder)
router.post("/doOrderPacking", doOrderPacking)
router.post("/addOrderInput", addOrderInput)
router.post("/newCalculateOrder", newCalculateOrder)

router.get("/getOrderSummary", getOrderSummary)
router.post("/deleteOrder", deleteOrder)
router.post("/updateOrderFreight", updateOrderFreight)
router.post("/aslWastage", aslWastage)

router.post("/RestoreOrderPacking", RestoreOrderPacking)
router.post("/RecalculateOrder", RecalculateOrder)
router.post("/getOrderPacking", getOrderPacking)
router.get("/CompanyAddress", CompanyAddress)
router.get("/invoiceDetailsList", invoiceDetailsList)
router.post("/getorderFreightDetails", getorderFreightDetails)
router.post("/GetOrderPdfDetails", GetOrderPdfDetails)
router.post("/OrderPdfDetails", OrderPdfDetails)

router.post('/InvoicePdfDetails', InvoicePdfDetails)
router.post('/GenerateInvoiceTick', GenerateInvoiceTick)
router.post('/GetInvoicePdfDetails', GetInvoicePdfDetails)
router.get("/GetinvoiceDetails", GetinvoiceDetails)
router.get("/getInvoiceSummary", getInvoiceSummary)
router.get("/getInvoiceDeatilsTable", getInvoiceDeatilsTable)
router.post("/EditInvoiceDetails", EditInvoiceDetails)
router.post("/orderPdfTable", orderPdfTable)

router.get("/getOrderFinancials", getOrderFinancials)
router.post("/invoiceLoader", invoiceLoader)
router.post("/InvoiceAdjustWeight", InvoiceAdjustWeight)
router.post("/InvoiceShipped", upload.single('document'), InvoiceShipped)
router.post("/CustomeInvoicePdfDetails", CustomeInvoicePdfDetails)
router.post("/copyOrder", copyOrder)
router.post("/invoicePdfTable", invoicePdfTable)
router.post("/InvoiceNotes", InvoiceNotes)
router.post("/OrderNotes", OrderNotes)
router.post("/UploadPdf", uploads.single('document'), UploadPdf)
router.post("/ApproveOrder", ApproveOrder)
router.post("/InvoiceCalculatedPrice", InvoiceCalculatedPrice)
router.post("/ConsigneeITFdropdown", ConsigneeITFdropdown)
router.post("/ConsigneeBrandDropdown", ConsigneeBrandDropdown)
router.post("/ProduceTrendGraph", ProduceTrendGraph)
router.get("/getOrderById", getOrderById)
router.get("/getInvoiceById", getInvoiceById)
router.post("/RebateRecord", RebateRecord)
router.post("/RebateReduceInvoice", RebateReduceInvoice)
router.post("/cancle_invoice", cancle_invoice)
router.post("/invoice_procedure", invoice_procedure)
router.get('/proformaMain_Invoice', proformaMain_Invoice)
router.post("/pdf_delivery_by", pdf_delivery_by)
router.post("/InvoiceDetails", InvoiceDetails)
router.post("/order_delivery_terms", order_delivery_terms)

router.get('/proformaMain_Order', proformaMain_Order)
router.post("/insertInvoicePayment", insertInvoicePayment)
router.post("/getInvoiceByClientID", getInvoiceByClientID)
router.get("/AccountingStatistics", AccountingStatistics)
router.get("/PaymentChannela", PaymentChannela)
router.post("/InvoiceAWBReady", InvoiceAWBReady)
router.post("/calculateInvoice", calculateInvoice)

router.post("/editAvailableProcedure", editAvailableProcedure)


router.get("/quotation_proforma", quotation_proforma)
router.post("/RecalculateQuotation", RecalculateQuotation)
router.post("/quotation_delivery_terms", quotation_delivery_terms)
router.post("/quotation_pdf_delivery_by", quotation_pdf_delivery_by)
router.post("/QuotationPDF", QuotationPDF)
router.post("/QuotationITFCHECK", QuotationITFCHECK)
router.post("/ExpireQuotations", ExpireQuotations)

router.get("/getEanAvailable", getEanAvailable)
router.get("/getProduceAvailable", getProduceAvailable)
router.get("/getBoxesAvailable", getBoxesAvailable)
router.post("/StockAdjustmentPB", StockAdjustmentPB)
router.get("/getPackagingAvailable", getPackagingAvailable)

router.get("/getAdjustEanStock", getAdjustEanStock)
router.get("/getAdjustEanStockById", getAdjustEanStockById)
router.post("/doRepackEan", doRepackEan)
router.post("/deleteAdjustEAN", deleteAdjustEAN)
router.post("/AssignOrderDropDownList", AssignOrderDropDownList)
router.post("/dropDownAdjustEan", dropDownAdjustEan)
router.post("/getAdjustEanView", getAdjustEanView)
router.get("/chartOfAccounts", chartOfAccounts)
router.post("/createChartOfAccount", createChartOfAccount)
router.post("/updateChartOfAccount", updateChartOfAccount)
router.post("/deleteChartOfAccount", deleteChartOfAccount)
router.get("/LedgerList", LedgerList)
router.post("/AccountWalletStatment", AccountWalletStatment)
router.post("/AccountTransfer", AccountTransfer)
router.post("/DeleteInvoicePayment", DeleteInvoicePayment)
router.post("/DeleteExpensePayment", DeleteExpensePayment)
router.post("/LedgerListByUser", LedgerListByUser)
router.get("/GetStatisticsDateSelection", GetStatisticsDateSelection)
router.post("/StatisticsDATEComparision", StatisticsDATEComparision)
router.get("/StatisticsDATESelection2", StatisticsDATESelection2)
router.get("/statisticsDateSelection1", statisticsDateSelection1)
router.post("/StatisticsDATEselection", StatisticsDATEselection)

router.get("/exportTest", ExportTest)

router.get("/getAllExpenseItems", getAllExpenseItems)
router.post("/createExpenseItems", createExpenseItems)
router.post("/updateExpenseItems", updateExpenseItems)
router.get("/getChartOfAccounts", getChartOfAccounts)


router.get("/getClaim", getClaim)
router.post("/getClaimDetails", getClaimDetails)
router.get("/dropdownClaimReason", dropdownClaimReason)
router.post("/updateClaim", updateClaim)
router.post("/insertClaimDetails", insertClaim)
router.post("/AddClaimDetails", AddClaimDetails)
router.post("/DeleteClaim", DeleteClaim)
router.post("/getPurchaseClaimDetails", getPurchaseClaimDetails)

module.exports = router
