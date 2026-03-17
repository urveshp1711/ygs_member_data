const googleSheets = require('./googleSheets');
require('dotenv').config();

async function checkHeaders() {
    try {
        const response = await googleSheets.sheets.spreadsheets.values.get({
            spreadsheetId: googleSheets.spreadsheetId,
            range: 'AssociationFees!1:1',
        });
        console.log('Actual Headers in Sheet:', response.data.values[0]);
    } catch (err) {
        console.error(err);
    }
}

checkHeaders();
