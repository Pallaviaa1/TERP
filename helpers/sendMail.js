const nodemailer = require('nodemailer');

const SMTP_MAIL = "mobappssolutions174@gmail.com"
const SMTP_PASSWORD = "mrzxxodbaboizbmo"

// const SMTP_MAIL = "no_reply@siameats.com"
// const SMTP_PASSWORD = "qKz18)GfU"


const sendMail = async (email, mailSubject, content, attachments = []) => {
    try {
       const transport= nodemailer.createTransport({
            host:'smtp.gmail.com',
            port:587,
            secure:false,
            requireTLS:true,
            auth:
            {
                user:SMTP_MAIL,
                pass:SMTP_PASSWORD
            }
        })
    
        const mailOptions={
            from:`Siameats<${SMTP_MAIL}>`,
            to:email,
            subject:mailSubject,
            html:content,
            attachments: attachments.length > 0 ? attachments : undefined,
        }
    
        transport.sendMail(mailOptions)
        
    } catch (error) {
        console.log(error.message);
    }
    // try {
    //     const transport = nodemailer.createTransport({
    //         host: 'mail-246.thaidata.cloud',
    //         port: 465, // or 465 for SSL
    //         secure: true,
    //         //requireTLS: true,
    //         auth:
    //         {
    //             user: SMTP_MAIL,
    //             pass: SMTP_PASSWORD
    //         },
    //         tls: {
    //             rejectUnauthorized: false
    //         },
    //     })
    //     transport.verify(function (error, success) {
    //         if (error) {
    //             console.log('Error: ', error);
    //         } else {
    //             console.log('SMTP details are correct.');
    //         }
    //     });
    //     const mailOptions = {
    //         from: `Siameats<${SMTP_MAIL}>`,
    //         to: email,
    //         subject: mailSubject,
    //         html: content,
    //         attachments: attachments.length > 0 ? attachments : undefined,
    //     }

    //     transport.sendMail(mailOptions)

    // } catch (error) {
    //     console.log(error.message);
    // }
}

module.exports = sendMail;


/* const nodemailer = require('nodemailer');

const SMTP_MAIL = "no_reply@siameats.com"
const SMTP_PASSWORD = "qKz18)GfU"

const sendMail = async (email, mailSubject, content, attachments = []) => {
    try {
        const transport = nodemailer.createTransport({
            host: 'mail-246.thaidata.cloud',
            port: 465,
            secure: true,
            auth:
            {
                user: SMTP_MAIL,
                pass: SMTP_PASSWORD
            },
            tls: {
                rejectUnauthorized: false
            },
        })
        transport.verify(function (error, success) {
            if (error) {
                console.log('Error: ', error);
            } else {
                console.log('SMTP details are correct.');
            }
        });
        const mailOptions = {
            from: `Siameats<${SMTP_MAIL}>`,
            to: email,
            subject: mailSubject,
            html: content,
            attachments: attachments.length > 0 ? attachments : undefined,
        }

        const info = await transport.sendMail(mailOptions);
        console.log('Email sent:', info.messageId);

    } catch (error) {
        console.log(error.message);
    }
}

module.exports = sendMail; */