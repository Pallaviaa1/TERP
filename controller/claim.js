const { db } = require("../db/db2")

const getClaim = async (req, res) => {
    try {
        const { user_id, role } = req.query; // assuming user_id and role are available from query parameters

        let query = `SELECT Claim.*, consignee.consignee_name, consignee.consignee_address,
                        consignee.consignee_tax_number, consignee.consignee_email,
                        consignee.consignee_phone, clients.client_name, clients.client_address,
                        clients.client_tax_number, order_freight_details.bl AS awb,
                        clients.client_email, order_freight_details.Ship_date,
                        clients.client_phone, Invoices.Shipment_ref, Invoices.order_id, Invoices.Client_reference, Invoices.Invoice_number, 
                        dropdown_currency.currency AS fx_currency
                    FROM Claim
                    INNER JOIN consignee ON Claim.Consignee_ID = consignee.consignee_id
                    INNER JOIN clients ON Claim.Client_ID = clients.client_id
                    INNER JOIN Invoices ON Claim.Invoice_ID = Invoices.Invoice_id
                    INNER JOIN dropdown_currency ON Claim.FX_ID = dropdown_currency.currency_id
                    INNER JOIN order_freight_details ON order_freight_details.order_id = Invoices.order_id`;

        // Modify query based on role and user_id
        if (role && user_id) {
            query += ' WHERE';
            if (role === 'Client') {
                query += ' Claim.Client_ID = ?';
            } else if (role === 'Consignee') {
                query += ' Claim.Consignee_ID = ?';
            } else {
                return res.status(403).json({
                    message: "Forbidden: Invalid role",
                });
            }
        }
        query += ' ORDER BY Claim.Claim_Number DESC';
        // Execute query with appropriate parameters
        const [result] = await db.query(query, role && user_id ? [user_id] : []);

        res.status(200).json({
            message: "Filtered Claims",
            data: result
        });
    } catch (err) {
        res.status(400).json({
            message: "Error Occurred",
            error: err,
        });
    }
};


const getClaimDetails = async (req, res) => {
    try {
        const { claim_id } = req.body;

        const [CompanyAddress] = await db.execute(
            "SELECT * FROM `Company_Address` WHERE `ID` = ?",
            [3],
        )
        const Company_Address = CompanyAddress[0];
        const [rebateCheck] = await db.query(`
            SELECT * FROM Claim 
            WHERE Claim_id = ? AND REBATE = 1
        `, [claim_id]);

        if (rebateCheck.length > 0) {
            return res.status(200).json({
                message: "Claim Details",
                data: [
                    {
                        Claim_Details_id: '',
                        Claim_id: '',
                        ID_ID: '',
                        Claim_reason: '',
                        ITF: '',
                        QTY: '',
                        Unit: '',
                        Claimed_amount: rebateCheck[0].Claimed_amount,
                        created: '',
                        itf_name_en: 'REBATE',
                        unit_name_en: '',
                    },
                ],
                Company_Address: Company_Address
            })
        }
        const [result] = await db.query(`SELECT Claim_Details.*, itf.itf_name_en, dropdown_unit_count.unit_name_en FROM Claim_Details
            INNER JOIN 
     itf ON itf.itf_id = Claim_Details.ITF
     INNER JOIN 
     dropdown_unit_count ON dropdown_unit_count.unit_id = Claim_Details.Unit
             where Claim_id='${claim_id}'`)
        res.status(200).json({
            message: "Claim Details",
            data: result,
            Company_Address: Company_Address
        })
    } catch (err) {
        res.status(400).json({
            message: "Error Occured",
            error: err,
        })
    }
}

const dropdownClaimReason = async (req, res) => {
    try {
        const [result] = await db.query("SELECT * FROM dropdown_claim_reason")
        res.status(200).json({
            message: "All Claims Reason",
            data: result
        })
    } catch (err) {
        res.status(400).json({
            message: "Error Occured",
            error: err,
        })
    }
}


const updateClaim = async (req, res) => {
    try {
        const { claim_id } = req.body;
        // Execute the stored procedure
        const [data] = await db.execute("CALL NEW_CLAIM(?)", [claim_id]);

        res.status(200).json({
            success: true,
            data: data
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

const insertClaim = async (req, res) => {
    try {
        const { Claim_date, Client_ID, Consignee_ID, Invoice_ID, FX_ID, User_id } = req.body;

        // Assuming you're using some database library like Sequelize or Knex.js
        const [result] = await db.execute(
            `INSERT INTO Claim (Claim_date, Client_ID, Consignee_ID, Invoice_ID, FX_ID, User_id) VALUES (?, ?, ?, ?, ?, ?)`,
            [Claim_date, Client_ID, Consignee_ID, Invoice_ID, FX_ID, User_id]
        );

        res.status(200).json({
            message: "Claim details inserted successfully",
            data: result.insertId
        });


    } catch (err) {
        res.status(400).json({
            message: "Error occurred while inserting claim details",
            error: err.message,
        });
    }
};

const AddClaimDetails = async (req, res) => {
    try {
        const { datas } = req.body;

        if (!Array.isArray(datas) || datas.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid input data. Expecting an array of data.'
            });
        }


        for (const data of datas) {
            const { Claim_id, id_id, ITF, QTY, Unit, Claimed_amount } = data;

            // Call the stored procedure
            const [result] = await db.execute(
                `INSERT INTO Claim_Details (Claim_id, ID_ID, ITF, QTY, Unit, Claimed_amount) VALUES (?, ?, ?, ?, ?, ?)`,
                [Claim_id, id_id, ITF, QTY, Unit, Claimed_amount]
            );
        }
        const [data] = await db.execute("CALL NEW_CLAIM(?)", [datas[0].Claim_id]);
        // Send a success response
        res.status(200).json({
            success: true,
            message: 'Claim inserted successfully',
        });
    } catch (error) {
        // Handle any errors
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

const DeleteClaim = async (req, res) => {
    try {
        const { claim_id } = req.body;

        // Call the stored procedure
        await db.execute("CALL Delete_Claim(?, @Message_EN, @Message_TH)", [claim_id]);

        // Retrieve the output messages
        const [messagesResult] = await db.execute("SELECT @Message_EN AS Message_EN, @Message_TH AS Message_TH");

        // Access the output messages
        const messageEN = messagesResult[0]?.Message_EN;
        const messageTH = messagesResult[0]?.Message_TH;

        res.status(200).json({
            success: true,
            messageEN: messageEN,
            messageTH: messageTH
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};


const getPurchaseClaimDetails = async (req, res) => {
    try {
        const { purchase_id } = req.body;

        const [result] = await db.query(`SELECT *, pod_name(purchase_order_details.pod_code) AS pod_name,
    pod_unit_name_pod(purchase_order_details.pod_code) AS pod_unit
     FROM purchase_order_details
             where po_id ='${purchase_id}'`)
        res.status(200).json({
            message: "Claim Details",
            data: result
        })
    } catch (err) {
        res.status(400).json({
            message: "Error Occured",
            error: err.message,
        })
    }
}


module.exports = {
    getClaim, getClaimDetails, dropdownClaimReason, updateClaim, insertClaim, AddClaimDetails, DeleteClaim, getPurchaseClaimDetails
}
