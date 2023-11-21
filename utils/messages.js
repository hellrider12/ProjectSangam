const moment = require('moment');

//function which return the message in formated form
function formatMessage(username, text) {
    return {
        username,
        text,
        time: moment().format('h:mm a')
    }
} 

module.exports = formatMessage; //Export the function