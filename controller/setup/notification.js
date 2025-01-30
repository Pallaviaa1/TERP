const { db: db2 } = require("../../db/db2")

const addNotification = async (req, res) => {
    try {
        const { notification_name, notification_message, notify_on, client, consignee, user_id } = req.body;
        const [data] = await db2.execute(
            "INSERT INTO notification_messages (notification_name, notification_message) VALUES (?, ?)",
            [
                notification_name,
                notification_message
            ],
        )
        const [details] = await db2.execute(
            "INSERT INTO notification_details (notification_id, client, consignee, notify_on) VALUES (?, ?, ?, ?)",
            [
                data.insertId,
                client,
                consignee,
                notify_on
            ],
        )

        const executeQuery = async (notificationId, userId) => {
            try {
                const [results] = await db2.execute(
                    "INSERT INTO notifications (notification_id, user) VALUES (?, ?)",
                    [notificationId, userId]
                );
                return results;
            } catch (error) {
                console.error("Error inserting notification:", error);
                throw error; // Throw the error to handle it later
            }
        };


        // Use Promise.all to execute all queries concurrently
        await Promise.all(user_id.map(id => executeQuery(data.insertId, id)));

        res.status(200).send({
            success: true,
            message: "Notification Added Successfully",
        })
    } catch (error) {
        res.status(500).send({
            success: false,
            error: error.message,
            message: "error has occurred",
        })
    }
}

const GetNotificationList = async (req, res) => {
    try {
        const [rows] = await db2.query(
            `SELECT nm.*, nd.notification_id, nd.client, nd.consignee, nd.notify_on, 
                    cn.consignee_name, c.client_name, 
                    u.id as user_id, u.email, u.name, u.role, u.status
             FROM notification_messages nm
             LEFT JOIN notification_details nd ON nd.notification_id = nm.id
             LEFT JOIN clients c ON nd.client = c.client_id
             LEFT JOIN consignee cn ON cn.consignee_id = nd.consignee
             LEFT JOIN notifications n ON n.notification_id = nm.id
             LEFT JOIN users u ON u.id = n.user`
        );

        // Mapping of notify_on values to their descriptions
        const notifyOnMapping = {
            1: 'New Quotation Created',
            2: 'Quotation Adjusted',
            3: 'Request for Approval',
            4: 'Quotation Approved',
            5: 'Create Order from Approved Quotation',
            6: 'Quotation Expiry',
            7: 'Order Approved',
            8: 'Order Update Any Time',
            9: 'Order Update before set date',
            10: 'Order Deadline',
            11: 'Add Shipment'
        };

        // Process the results to group users by notification ID
        const notifications = {};

        rows.forEach(row => {
            const notificationId = row.notification_id;
            if (!notifications[notificationId]) {
                notifications[notificationId] = {
                    notification_id: notificationId,
                    notification_name: row.notification_name,
                    notification_message: row.notification_message,
                    client: row.client,
                    client_name: row.client_name,
                    consignee: row.consignee,
                    consignee_name: row.consignee_name,
                    notify_on: row.notify_on, // Include the notify_on number
                    notify_on_description: notifyOnMapping[row.notify_on] || 'Unknown', // Use the mapping here
                    users: []
                };
            }

            // Add user details to the notification
            if (row.user_id) {
                notifications[notificationId].users.push({
                    user_id: row.user_id,
                    name: row.name,
                    email: row.email,
                    role: row.role,
                    status: row.status
                });
            }
        });

        // Convert the notifications object to an array
        const notificationList = Object.values(notifications);

        res.status(200).send({
            success: true,
            data: notificationList,
        });
    } catch (error) {
        res.status(500).send({
            success: false,
            error: error.message,
            message: "An error has occurred",
        });
    }
};


const UpdateNotification = async (req, res) => {
    try {
        const { notification_id, notification_name, notification_message, notify_on, client, consignee, user_id } = req.body;

        // Update the notification messages
        await db2.execute(
            "UPDATE notification_messages SET notification_name = ?, notification_message = ? WHERE id = ?",
            [
                notification_name,
                notification_message,
                notification_id
            ],
        );

        // Update the notification details
        await db2.execute(
            "UPDATE notification_details SET client = ?, consignee = ?, notify_on = ? WHERE notification_id = ?",
            [
                client,
                consignee,
                notify_on,
                notification_id
            ],
        );

        // Delete existing user associations for the notification
        await db2.execute(
            "DELETE FROM notifications WHERE notification_id = ?",
            [notification_id],
        );

        // Define a function to execute the query asynchronously
        const executeQuery = async (notificationId, userId) => {
            try {
                const [results] = await db2.execute(
                    "INSERT INTO notifications (notification_id, user) VALUES (?, ?)",
                    [notificationId, userId]
                );

                return results;
            } catch (error) {
                console.error("Error inserting notification:", error);
                throw error; // Throw the error to handle it later
            }
        };

        // Use Promise.all to execute all queries concurrently
        await Promise.all(user_id.map(id => executeQuery(notification_id, id)));

        res.status(200).send({
            success: true,
            message: "Notification Updated Successfully",
        });
    } catch (error) {
        res.status(500).send({
            success: false,
            error: error.message,
            message: "An error has occurred",
        });
    }
};

const getUserNotification = async (req, res) => {
    try {
        const { user_id } = req.body;
        const [rows] = await db2.query(
            `SELECT * FROM notification_history WHERE user_id='${user_id}' and is_deleted='${0}' ORDER BY created_at DESC`
        );

        if (rows.length > 0) {
            let unseenCount = 0;
            let foundLastSeen = false;

            // Iterate through notifications in reverse order
            for (let i = rows.length - 1; i >= 0; i--) {
                const notification = rows[i];

                if (notification.is_seen === 1) {
                    foundLastSeen = true; // Mark the last seen notification
                    unseenCount = 0; // Reset unseenCount when a seen notification is found
                } else if (foundLastSeen) {
                    unseenCount++; // Count subsequent unseen notifications
                }
            }

            // If no is_seen=1 found, count all messages
            if (!foundLastSeen) {
                unseenCount = rows.length;
            }

            res.status(200).json({
                success: true,
                message: "All Notification",
                data: rows,
                unseenCount: unseenCount
            });
        } else {
            res.status(200).json({
                success: true,
                message: "No notification found",
                data: rows,
                unseenCount: 0
            });
        }

    } catch (error) {
        res.status(500).send({
            success: false,
            error: error.message,
            message: "An error has occurred",
        });
    }
}

const updateNotificationSeen = async (req, res) => {
    try {
        const { user_id } = req.body;
        if (!user_id) {
            res.status(400).send({
                success: false,
                message: "Please provide user id"
            });
            return; // Ensure we stop further execution
        }

        // Get the last notification for the user
        const querySelect = `
            SELECT id FROM notification_history 
            WHERE user_id = ? AND is_deleted = 0 
            ORDER BY created_at DESC LIMIT 1
        `;
        const [selectResults] = await db2.query(querySelect, [user_id]);

        if (selectResults.length === 0) {
            res.status(404).send({
                success: false,
                message: "No notifications found for the user"
            });
            return; // No notifications found
        }

        const lastInsertedNotificationId = selectResults[0].id;

        // Update the last notification's is_seen status
        const queryUpdate = `
            UPDATE notification_history 
            SET is_seen = 1 
            WHERE id = ?
        `;
        const [updateResults] = await db2.query(queryUpdate, [lastInsertedNotificationId]);

        if (updateResults.affectedRows > 0) {
            res.status(200).send({
                success: true,
                message: "Last notification marked as seen."
            });
        } else {
            res.status(400).send({
                success: false,
                message: "Failed to mark the last notification as seen."
            });
        }
    } catch (error) {
        console.error("Error in updateNotificationSeen:", error);
        res.status(500).send({
            success: false,
            message: error.message
        });
    }
};


//if gender male chenge to female if female chnege to male
// update_profile




module.exports = {
    addNotification, GetNotificationList, UpdateNotification, getUserNotification, updateNotificationSeen
}
