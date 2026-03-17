const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
require('dotenv').config();

async function inspectSheet() {
    const serviceAccountAuth = new JWT({
        email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, serviceAccountAuth);
    await doc.loadInfo();
    const sheet = doc.sheetsByTitle['AssociationFees'];
    if (!sheet) {
        console.log('Sheet not found');
        return;
    }
    const rows = await sheet.getRows();
    console.log('Headers:', sheet.headerValues);
    rows.forEach(row => {
        console.log('Row:', {
            id: row.get('id'),
            name: row.get('name'),
            paymentDate: row.get('paymentDate'),
            fromMonth: row.get('fromMonth'),
            toMonth: row.get('toMonth'),
            fromYear: row.get('fromYear'),
            toYear: row.get('toYear')
        });
    });
}

inspectSheet();
