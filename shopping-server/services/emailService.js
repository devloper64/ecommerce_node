import  nodemailer from 'nodemailer';
import config from 'config';
import logger from '../logging/logger'
import * as _ from 'lodash';
const handlebars = require('handlebars');
const fs = require('fs');

// Set up the connection object
let emailConfig = {
    credentials: {
        host: process.env.VENIQA_NODEMAILER_HOST,
        port: process.env.VENIQA_NODEMAILER_PORT,
        auth: {
            user: process.env.VENIQA_NODEMAILER_USER,
            pass: process.env.VENIQA_NODEMAILER_PASSWORD
        },
        tls: {
            rejectUnauthorized: process.env.VENIQA_NODEMAILER_REJECT_UNAUTHORIZED
        }
    }
}

let transporter = nodemailer.createTransport(emailConfig.credentials)

// verify connection configuration
transporter.verify(function(error, success) {
    if (error) {
         logger.error("Error while connecting to email service", {meta: error});
    } else {
         logger.info('Email Service is up and ready to go');
    }
});

const readHTMLFile = function (path, callback) {
    fs.readFile(path, {encoding: 'utf-8'}, function (err, html) {
        if (err) {
            callback(err);
        } else {
            callback(null, html);
        }
    });
};

export default {
    emailEmailConfirmationInstructions(email, name, token) {
        // setup email data with unicode symbols
        let mailOptions = {
            from: '"Veniqa Support" <support@veniqa.com>', // sender address
            to: email, // list of receivers
            subject: 'Veniqa - Confirm Your Email', // Subject line
            html: '<b>Hi </b>' +  name + '<br>Please click the link below to confirm your email address<br><br><button><a href="' + config.get('frontend_urls.email_confirmation_base_url') + '/' + token + '">Confirm Your Email Address</a></button>'
        };

        // send mail with defined transport object
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return logger.error("Error while sending email", {meta: error});
            }
            logger.verbose('Email sent', {meta: info});
        });
    },

    emailPasswordResetInstructions(email, name, token) {
        // setup email data with unicode symbols
        let mailOptions = {
            from: '"Veniqa Support" <support@veniqa.com>', // sender address
            to: 'support@veniqa.com, ' + email, // list of receivers
            subject: 'Veniqa - Password Reset', // Subject line
            html: '<b>Hi </b>' +  name + '<br>Please click the link below to reset your password<br><br><button><a href="' + config.get('frontend_urls.password_reset_base_url') + '/' + token + '">Reset Password</a></button>'
        };

        // send mail with defined transport object
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return logger.error("Error while sending email", {meta: error});
            }
            logger.verbose('Email sent', {meta: info});
        });
    },

    emailPasswordResetConfirmation(email, name) {
        // setup email data with unicode symbols
        let mailOptions = {
            from: '"Veniqa Support" <support@veniqa.com>', // sender address
            to: 'support@veniqa.com, ' + email, // list of receivers
            subject: 'Veniqa - Password Reset Successful', // Subject line
            html: '<b>Hi </b>' +  name + '<br>Your password has been successfully reset.<br><br>'
        };

        // send mail with defined transport object
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return logger.error("Error while sending email", {meta: error});
            }
            logger.verbose('Email sent', {meta: info});
        });

    },

        emailOrderReceived(orderObj) {
        let condensedOrderObj = this.parseOrderDetailsForEmail(orderObj);
        // setup email data with unicode symbols

            readHTMLFile('/home/coder/Desktop/Veniqa-develop/shopping-server/views/email/order_received.html', function(err, html) {
                if (err) {
                    console.log('error reading file', err);
                    return;
                }
                console.log(condensedOrderObj)
                const template = handlebars.compile(html);
                const htmlToSend = template(condensedOrderObj);


                let mailOptions = {
                    from: '"Veniqa Support" <support@veniqa.com>', // sender address
                    to: condensedOrderObj.user_email, // list of receivers
                    subject: 'Veniqa - Order Received', // Subject line
                    html: htmlToSend,

                };

                transporter.sendMail(mailOptions, (error, result) => {
                    if (error) {
                        return logger.error("Error while sending email", {meta: error});
                    }
                    logger.verbose('Email sent', {meta: result});
                });
            });


    },



    parseOrderDetailsForEmail(orderObj) {

        // Extract only the applicable root nodes first
        orderObj = (({_id, overall_status, cart, user_email, mailing_address, payment_info}) => ({_id, overall_status, cart, user_email, mailing_address, payment_info}))(orderObj)
        console.log(orderObj)

        // This goes through the items array and only selects the given object keys no matter how deep in tree. also brings them on the same level in the process
        orderObj.cart.items = _.map(orderObj.cart.items, _.partialRight(_.pick, ['product.name', 'product.brand', 'product.store', 'product.price', 'counts', 'aggregatedPrice', 'customizations']));
        orderObj.payment_info = _.map(orderObj.payment_info, _.partialRight(_.pick, ['source', 'type', 'amount_in_payment_currency']))

        return orderObj;
    }

}