const nodemailer = require("nodemailer");

function sendConfirmationEmail(recipient) {

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'kobbyenos.770@gmail.com',
            pass: 'thermodynamics'
        }
    });
    const mailOptions = {
        from: 'kobbyenos.770@gmail.com',
        to: recipient,
        subject: 'Confirm email',
        text: 'Email confirmed'
        
    };
    transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
            console.log()
        }else {
            console.log('Email sent: ' + info.response);
        }
    });

}

sendConfirmationEmail('gilbertenos770@yahoo.com');
//module.exports.sendConfirmationEmail = sendConfirmationEmail;