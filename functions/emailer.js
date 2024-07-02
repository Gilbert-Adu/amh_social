const nodemailer = require("nodemailer");

const fs = require('fs');
const path = require('path');
const ejs = require('ejs');

require('dotenv').config();


//send confirmation email
function sendConfirmationEmail(user) {

    const emailTemplatePath = path.join(__dirname, '..', 'views', 'confirmEmail.ejs');
const emailTemplate = fs.readFileSync(emailTemplatePath, 'utf8');


const htmlContent = ejs.render(emailTemplate, {user: user})




var transporter = nodemailer.createTransport({
    name: 'mail.amharaunity.com',
    host: 'mail.amharaunity.com',
    port: 465,
    secure: true, 
    auth: {
      user: 'admin@amharaunity.com',
      pass: process.env.EMAIL_PASSWORD
    },
    tls: {
      rejectUnauthorized: false
    }
  });
  

var mailOptions = {
  from: 'admin@amharaunity.com',
  to: user.email,
  subject: 'VERIFY EMAIL',
  text: '',
  html: htmlContent
};

transporter.sendMail(mailOptions, function(error, info){
  if (error) {
    console.log(error);
  } else {
    console.log('Email sent: ' + info.response);
  }
});  
  
}

//reset email
function resetPassword(user) {

  const emailTemplatePath = path.join(__dirname, '..', 'views', 'resetPwd.ejs');
const emailTemplate = fs.readFileSync(emailTemplatePath, 'utf8');


const htmlContent = ejs.render(emailTemplate, {user: user})


var transporter = nodemailer.createTransport({
  name: 'mail.amharaunity.com',
  host: 'mail.amharaunity.com',
  port: 465,
  secure: true,
  auth: {
    user: 'admin@amharaunity.com',
    pass: process.env.EMAIL_PASSWORD
  },
  tls: {
    rejectUnauthorized: false
  }
});


var mailOptions = {
from: 'admin@amharaunity.com',
to: user.email,
subject: 'RESET PASSWORD LINK',
text: '',
html: htmlContent
};

transporter.sendMail(mailOptions, function(error, info){
if (error) {
  console.log(error);
} else {
  console.log('Email sent: ' + info.response);
}
});  

}




//sendConfirmationEmail('gilbertenos770@yahoo.com');
module.exports.sendConfirmationEmail = sendConfirmationEmail;
module.exports.resetPassword = resetPassword;