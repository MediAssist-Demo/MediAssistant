/**
  *
  * main() will be run when you invoke this action
  *
  * @param Cloud Functions actions accept a single parameter, which must be a JSON object.
  *
  * @return The output of this action, which must be a JSON object.
  *
  */
function main(params) {
    
'use strict';
var async = require('async');
var Cloudant = require('@cloudant/cloudant');
const nodemailer = require('nodemailer');


//cloudant db url and dbname(provide your cloudant url(url: "<paste your cloudant URL>"))
var cloudant = Cloudant({url: ""});
var dbname = '';//enter your database name
var db = null;

var Name=params.Name;
var MobileNumber=params.MobileNumber;
var Email;
var City=params.City;
var BookDate=params.bookdate;
if(BookDate!=null)
{
var BookDatestr=BookDate.toString();
//Email=params.Email.slice(0,-1);
//Email=params.Email.replace('|','').replace('>','');
Email=params.Email.replace(/[&\/\\#, +()|$~%'":*?<>{}]/g, '');

}
var BookingNumber=params.BookingNumber;
var cancel_mailid;


//connecting to cloudant db
db = cloudant.db.use(dbname);

var randomint=getRndInteger(1, 1000) ;
var randomintstr=randomint.toString();

//To make a new medical appointment
if(BookingNumber==null)
{

//log
console.log('Create a new appointment has started successfully');
return createDocument(db,Name,MobileNumber,City,BookDatestr,Email,randomintstr)
.then(function(result){
//log
console.log('Appointment creation successful');    
//creating the nessary mail details to be sent through smtp
const param = {
"payload": {
"id": "",//from mail id(enter your from email id)
"password": "",//password for the above mail id
"receiver":Email,//params.Email, 
"subject": "Appointment Confirmation",
"body": "Greetings from MediAssist Team, Your appointment on "+BookDate+" is confirmed. Appointment Number:"+result.id
}
}

var transporter = nodemailer.createTransport({
service: 'Gmail',
auth: {
user: param.payload.id,
pass: param.payload.password
}
});

const mail = {
from: '"MediAssist" <' + param.payload.id + '>',
to: param.payload.receiver,
subject: param.payload.subject,
text: 'Hello World',
html: param.payload.body
}


return(new Promise(function(resolve, reject) {
    //if document creation is success send the mail to the user 
transporter.sendMail(mail, function (err, info) {
if (!err) {
           resolve(result);
           //log
           console.log('Appointment Creation Mail sent to the user successfully');
          } 
         else
          {
                 console.log('sending mail to the user failed');
             reject(err);
          }
transporter.close();

})}));
});
}
else
{
//cancel an appointment
//getting the mailid and other necessary details(_rev id) to delete the particular booking number document
return  readDocument(db,BookingNumber)
.then(function(result){
    //log
    console.log('Details fetched successfully');
 cancel_mailid=result.EMailId;
 console.log(cancel_mailid);
    
return new Promise(function(resolve,reject)
        {
        
    db.destroy(result._id,result._rev ,function(err, data) 
    {
        if (!err) 
            {
              resolve(data);
              //log
              console.log('Appointment cancelled successfully');
            } 
            else 
            {
                console.log('Appointment cancellation failed');
                reject(err);
            }
  
  });
        }); 
    
   
}).then(function(result){
//if document deletion is successful, then send mail notification to the user
    
      
const param1 = {
"payload": {
"id": "",//enter your from mailid
"password": "",//password for the above mailid
"receiver": cancel_mailid,
"subject": "Appointment Cancellation",
"body": "Greetings from MediAssist Team, Your appointment number "+params.BookingNumber+" has been cancelled successfully."
}
}

var transporter1 = nodemailer.createTransport({
service: 'Gmail',
auth: {
user: param1.payload.id,
pass: param1.payload.password
}
});

const mail1 = {
from: '"MediAssist" <' + param1.payload.id + '>',
to: param1.payload.receiver,
subject: param1.payload.subject,
text: 'Hello World',
html: param1.payload.body
}
      
 return (new Promise(function(resolve,reject)
        {
             transporter1.sendMail(mail1, function (err, info) 
             {
                if (!err) 
                {
               resolve(result);
               //log
               console.log('Appointment cancel notification mail sent successfully');
                } 
               else 
                {
                    console.log('Appointment cancel notification mail failed');
               reject(err);
                }
transporter1.close();

})}));

});
}
}




function getRndInteger(min, max) {
  return Math.floor(Math.random() * (max - min) ) + min;
}

//get appointment details based on the Booking number(i.e) _id
function readDocument(db,BookingNumber)
{
        var BookingNumberStr=BookingNumber.toString();
        return new Promise(function(resolve,reject)
        {
        db.get(BookingNumberStr, function(err, data) 
        {
        if (!err) 
            {
               resolve(data);
            } else 
            {
                
                reject(err);
            }
    
   
        });
        });
    
}

//create a new document 
function createDocument(db,Name,MobileNumber,City,BookDatestr,Email,randomintstr) {
    return new Promise(function (resolve, reject) {
     
      
        db.insert({ _id:randomintstr, Name: Name,MobileNumber:MobileNumber,CityName:City,AppointmentDate:BookDatestr,EMailId:Email}, function (error, response) {
            if (!error) {
               
                resolve(response);
            } else {
      
                reject(error);
            }
        });
    });
}































