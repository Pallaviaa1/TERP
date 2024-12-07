const { log } = require("winston");
const { db } = require("../db/db2")
const sendMail = require('../helpers/sendMail');
const db2 = require("../db/db2");

const getALLOrder = async (req, res) => {
    try {
        const { role, userId } = req.query;

        // Define the base SQL query
        let sql = `
            SELECT orders.*,
                users.name AS created_by, 
                clients.client_name,
                clients.client_address,
                clients.client_tax_number,
                clients.client_email,
                clients.client_phone,
                setup_liner.liner_name AS Airline, 
                setup_liner.liner_code AS Airline_liner_code, 
                setup_ports.port_name AS Airport, 
                setup_ports.IATA_code AS Airport_IATA_code, 
                dropdown_currency.currency AS currency, 
                vendors.name AS clearance_name, 
                consignee.consignee_name,
                consignee.consignee_address,
                consignee.consignee_tax_number, 
                consignee.consignee_email,
                consignee.consignee_phone, 
                location.name AS location_name, 
                freight.Liner AS Freight_liner, 
                freight.journey_number AS Freight_journey_number, 
                freight.bl AS Freight_bl, 
                freight.Load_date AS Freight_load_date, 
                freight.Load_time AS Freight_load_time, 
                freight.Ship_date AS Freight_ship_date, 
                freight.ETD AS Freight_etd, 
                freight.Arrival_date AS Freight_arrival_date, 
                freight.ETA AS Freight_eta, 
                supplier.name AS supplier_name
            FROM orders
            INNER JOIN consignee ON orders.consignee_id = consignee.consignee_id
            INNER JOIN clients ON clients.client_id = orders.client_id
            INNER JOIN setup_ports ON setup_ports.port_id = orders.destination_port_id
            INNER JOIN setup_liner ON setup_liner.liner_id = orders.liner_id
            INNER JOIN vendors AS supplier ON orders.Freight_provider_ = supplier.vendor_id
            INNER JOIN setup_location AS location ON orders.loading_location = location.id
            INNER JOIN order_freight_details AS freight ON orders.order_id = freight.order_id
            INNER JOIN users ON users.id = orders.user
            INNER JOIN dropdown_currency ON dropdown_currency.currency_id = orders.fx_id
            INNER JOIN vendors ON vendors.vendor_id = orders.Clearance_provider
        `;

        // Add WHERE condition based on role
        if (role === 'client') {
            sql += ` WHERE orders.client_id = '${userId}'`;
        } else if (role === 'consignee') {
            sql += ` WHERE orders.consignee_id = '${userId}'`;
        }

        // Add ORDER BY clause
        sql += ` ORDER BY orders.Order_number DESC`;

        // Execute the query
        const [data] = await db.query(sql);

        res.status(200).json({ data });
    } catch (e) {
        res.status(500).json({ message: "Internal server error", error: e });
    }
};


const getQuotation = async (req, res) => {
    try {
        const { role, userId } = req.query; // Assuming role and userId are passed as query parameters

        // Define the base SQL query
        let sql = `
            SELECT quotations.*, 
                DATE_FORMAT(quotations.load_Before_date, '%Y-%m-%d') AS load_Before_date, 
                setup_ports.port_name, 
                setup_ports.IATA_code AS Airport_IATA_code,  
                dropdown_currency.currency AS currency, 
                vendors.name AS clearance_name,
                clients.client_name AS client_name, 
                clients.client_address AS client_address, 
                setup_location.name AS location_name, 
                consignee.consignee_name, 
                consignee.consignee_address,
                clients.client_tax_number, 
                clients.client_email,
                clients.client_phone, 
                consignee.consignee_tax_number, 
                consignee.consignee_email, 
                consignee.consignee_phone,
                users.name AS created_by,
                setup_liner.liner_name AS Airline, 
                setup_liner.liner_code AS Airline_liner_code
            FROM quotations
            INNER JOIN clients ON quotations.client_id = clients.client_id
            INNER JOIN setup_location ON quotations.loading_location = setup_location.id
            INNER JOIN consignee ON consignee.consignee_id = quotations.consignee_id
            INNER JOIN setup_ports ON setup_ports.port_id = quotations.destination_port_id
            INNER JOIN dropdown_currency ON dropdown_currency.currency_id = quotations.fx_id
            INNER JOIN vendors ON vendors.vendor_id = quotations.Clearance_provider
            INNER JOIN users ON users.id = quotations.user
            INNER JOIN setup_liner ON setup_liner.liner_id = quotations.liner_id
        `;

        // Add WHERE condition based on role
        if (role === 'client') {
            sql += ` WHERE quotations.client_id = '${userId}'`;
        } else if (role === 'consignee') {
            sql += ` WHERE quotations.consignee_id = '${userId}'`;
        }

        // Execute the query
        const [data] = await db2.query(sql);

        res.status(200).json({
            message: "All Quotation",
            data: data,
        });
    } catch (e) {
        res.status(400).json({
            message: "Error Occurred",
            error: e,
        });
    }
};


module.exports = {
    getALLOrder, getQuotation
}
