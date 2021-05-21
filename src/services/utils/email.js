const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.sendgrid_key);
const appEmail = 'app.cogit@gmail.com';

function sendResetTokenMail(to, body) {
	sendMail(to, 'Cogit [New Pasword]', body);
}
function sendMail(to, subject, body) {
	sgMail
		.send({
			to,
			from: appEmail,
			subject: subject,
			text: body,
		})
		.then((data) => console.log(data))
		.catch((e) => console.log(e));
}

module.exports = {
	sendResetTokenMail,
};
