const googleSheets = require('./googleSheets');
require('dotenv').config();

const SHEETS = {
    ASSOCIATION_FEES: 'AssociationFees',
};

async function inspectSheet() {
    try {
        const rows = await googleSheets.getRows(SHEETS.ASSOCIATION_FEES);
        console.log('Total Rows:', rows.length);
        rows.forEach((row, index) => {
            console.log(`Row ${index}:`, JSON.stringify(row, null, 2));
        });
    } catch (err) {
        console.error('Error:', err.message);
    }
}

inspectSheet();
