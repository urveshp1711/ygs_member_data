const googleSheets = require('./googleSheets');
require('dotenv').config();

async function checkDetailedDistribution() {
    try {
        const rows = await googleSheets.getRows('AssociationFees');
        rows.forEach(row => {
            const fromMonth = parseInt(row.fromMonth);
            const fromYear = parseInt(row.fromYear);
            const toMonth = parseInt(row.toMonth);
            const toYear = parseInt(row.toYear);

            if (isNaN(fromMonth)) return;

            const startDate = new Date(fromYear, fromMonth, 1);
            const endDate = new Date(toYear, toMonth, 1);
            
            let months = [];
            let current = new Date(startDate);
            while (current <= endDate) {
                months.push(current.toLocaleString('en-IN', { month: 'long' }));
                current.setMonth(current.getMonth() + 1);
            }
            console.log(`Record ${row.id} (${row.name}): Paid for ${months.join(', ')}`);
        });
    } catch (err) {
        console.error(err);
    }
}

checkDetailedDistribution();
