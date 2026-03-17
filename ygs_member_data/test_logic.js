const rows = [
  { amount: "100", fromMonth: "2", fromYear: "2026", toMonth: "2", toYear: "2026" },
  { amount: "100", fromMonth: "3", fromYear: "2026", toMonth: "3", toYear: "2026" },
  { amount: "100", fromMonth: "3", fromYear: "2026", toMonth: "3", toYear: "2026" },
  { amount: "100", fromMonth: "2", fromYear: "2026", toMonth: "2", toYear: "2026" },
  { amount: "100", fromMonth: "2", fromYear: "2026", toMonth: "2", toYear: "2026" },
  { amount: "100", fromMonth: "2", fromYear: "2026", toMonth: "2", toYear: "2026" },
  { amount: "700", fromMonth: "5", fromYear: "2026", toMonth: "11", toYear: "2026" }
];

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

aggregation[2026].months.forEach(m => {
    if (m.totalEntries > 0) {
        console.log(`${getMonthName(m.month)}: ${m.totalEntries} entries, total ${m.totalDonation}`);
    }
});
