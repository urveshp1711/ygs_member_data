const googleSheets = require('./googleSheets');
require('dotenv').config();

const SHEETS = {
    ASSOCIATION_FEES: 'AssociationFees',
};

async function checkAggregation() {
    try {
        const rows = await googleSheets.getRows(SHEETS.ASSOCIATION_FEES);
        const aggregation = {};

        rows.forEach(row => {
            const amount = parseFloat(row.amount) || 0;
            const fromMonth = parseInt(row.fromMonth);
            const fromYear = parseInt(row.fromYear);
            const toMonth = parseInt(row.toMonth);
            const toYear = parseInt(row.toYear);

            if (isNaN(fromMonth) || isNaN(fromYear) || isNaN(toMonth) || isNaN(toYear)) return;

            const startDate = new Date(fromYear, fromMonth, 1);
            const endDate = new Date(toYear, toMonth, 1);
            
            let current = new Date(startDate);
            const monthCount = (toYear - fromYear) * 12 + (toMonth - fromMonth) + 1;
            const amountPerMonth = amount / monthCount;

            while (current <= endDate) {
                const y = current.getFullYear();
                const m = current.getMonth();

                if (!aggregation[y]) {
                    aggregation[y] = { 
                        year: y, 
                        months: Array.from({ length: 12 }, (_, i) => ({
                            month: i,
                            totalEntries: 0,
                            totalDonation: 0
                        }))
                    };
                }
                
                aggregation[y].months[m].totalEntries += 1;
                aggregation[y].months[m].totalDonation += amountPerMonth;
                current.setMonth(current.getMonth() + 1);
            }
        });

        console.log(JSON.stringify(aggregation[2026], null, 2));
    } catch (err) {
        console.error('Error:', err.message);
    }
}

checkAggregation();
