///import the necessary modules for ses

const { SESSlient, SendEmailCommand, SES, SESClient } = require('@aws-sdk/client-ses');
///Load environment variables from a .env file into process.env
require('dotenv').config();

//initialize the SES client using the environment variables
const client = new SESClient({
    region: process.env.AWS_REGION,// AWS region to send the email from
    credentials:{
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }

});

//fuction to generate simple html content for welcome email

const generateOtpEmailHtml = (otp) => {
    return `
    <html>
      <body>
        <h1>Welcome to ${process.env.APP_NAME}</h1>
        <p> Your One-time password (OTP) for email verification is: </p>
        <p>${otp}</p>
        <p>Please enter this otp to verfiy your email address. This code is valid for the next 10 minutes.</p>
        <p>If you did not request this, please ignore this email or contact our support team immediately.</p>
        </body>
    </html>
    `
};
///function to send welcome email to the provided email address
const sendOtpEmail = async (email, otp) =>{
    ///define the parameters for SES email message
    const params ={
        Source: process.env.EMAIL_FROM,//the sender's email adddress
        ReplyToAddress :  [process.env.EMAIL_TO],//the reply-to email address
        //destination
        Destination:{
            ToAddresses: [email],// the recipient's email address

        },

        Message:{
            Body:{
                Html: {
                    Charset: "UTF-8",//Ensure the email body is in UTF-8  char encoding
                    Data: generateOtpEmailHtml(otp),//generate fron the function above
                }
            },
            Subject:{
                Charset: "UTF-8", //Ensure the email body is in UTF-8 char encoding
                Data: `Store Email Verification`,//the subject of the email
            },
        },
    };

    ///create a new SendEmailCommand with the parameters defined above
    const command = new SendEmailCommand(params);
    try{
        //send the email using SES client and await the response
        const data = await client.send(command);
        return data;
    }catch(e){
        console.log("Error Sending email", e);
        throw e;
    }
};

module.exports = sendOtpEmail;