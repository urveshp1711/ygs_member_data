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

        const getMonthName = (idx) => new Date(2000, idx).toLocaleString('en-IN', { month: 'long' });

        if (aggregation[2026]) {
            aggregation[2026].months.forEach(m => {
                if (m.totalEntries > 0) {
                    console.log(`${getMonthName(m.month)}: ${m.totalEntries} entries`);
                }
            });
        } else {
            console.log('No data for 2026');
        }
    } catch (err) {
        console.error('Error:', err.message);
    }
}

checkAggregation();
