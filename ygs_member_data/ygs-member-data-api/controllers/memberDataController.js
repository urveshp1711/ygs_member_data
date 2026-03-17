const googleSheets = require('../googleSheets');
const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer');
const ExcelJS = require('exceljs');

// Helper to format Date (consistent with previous implementation)
const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return '';
        return d.toISOString().slice(0, 10);
    } catch (e) {
        return '';
    }
};

// Helper for unique values (replaces SELECT DISTINCT)
const getUniqueValues = (rows, column) => {
    const values = rows.map(row => row[column]).filter(v => v && v !== '');
    return [...new Set(values)].sort().map(v => ({ [column]: v }));
};

const SHEETS = {
    MEMBERS: 'Members',
    ASSOCIATION_FEES: 'AssociationFees',
    CONFIG: 'configuration'
};

const ensureAssociationFeesSheet = async () => {
    try {
        await googleSheets.createSheetIfNotExists(SHEETS.ASSOCIATION_FEES);
        // We use sheets API directly to check/set headers if needed, 
        // but getRows already handles basic check.
        const rows = await googleSheets.getRows(SHEETS.ASSOCIATION_FEES).catch(() => []);
        if (rows.length === 0) {
            const headers = [['id', 'memberId', 'name', 'mobile', 'amount', 'paymentType', 'paymentNo', 'paymentDate', 'fromMonth', 'fromYear', 'toMonth', 'toYear', 'city']];
            await googleSheets.updateEntireSheet(SHEETS.ASSOCIATION_FEES, headers);
        }
    } catch (e) {
        console.warn('Initialization of AssociationFees sheet failed:', e.message);
    }
};

// GET: api/MemberData
exports.getAllMembers = async (req, res) => {
    try {
        let isActive = true;
        try {
            const configRows = await googleSheets.getRows(SHEETS.CONFIG);
            isActive = configRows.find(c => c.key === 'active')?.value?.toLowerCase() !== 'false';
        } catch (e) {
            console.warn(`Configuration sheet "${SHEETS.CONFIG}" not found or error fetching. Defaulting to ACTIVE.`);
        }

        if (!isActive) return res.json([]);

        const rows = await googleSheets.getRows(SHEETS.MEMBERS);
        // Map to expected format and sort
        const formattedRows = rows.map(row => ({
            "Id": row._id || row['House no.'],
            "Member Id": row['House no.'] || '',
            "Name": row['Name'] || '',
            "Name - Gujarati": row['Name-Guj'] || '',
            "Gender": row['Gender'] || '',
            "Date Of Birth": row['Date Of Birth'] || '',
            "Birth Date": row['Date Of Birth'] || '',
            "Profession": row['Profession'] || '',
            "Mobile": row['Mobile'] || '',
            "Married": row['Married'] || '',
            "Company": row['Company'] || '',
            "Blood Group": row['Blood Group'] || ''
        })).sort((a, b) => {
            const idA = parseInt(a["Member Id"]) || 0;
            const idB = parseInt(b["Member Id"]) || 0;
            return idA - idB;
        });

        res.json(formattedRows);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// GET: api/MemberData/:id
exports.getMemberById = async (req, res) => {
    try {
        const id = req.params.id;
        const rows = await googleSheets.getRows(SHEETS.MEMBERS);
        const member = rows.find(r => r._id === id);

        if (!member) return res.status(404).json({ message: "Not found" });

        // Lead calculation (Self member with same memberId)
        const leadMember = rows.find(r => r['House no.'] === member['House no.']);

        const result = {
            "Lead": '',
            "Address": member['Address'] || '',
            "Id": member._id || member['House no.'],
            "Member Id": member['House no.'] || '',
            "Name": member['Name'] || '',
            "Name - Gujarati": member['Name-Guj'] || '',
            "Date Of Birth": member['Date Of Birth'] || '',
            "Birth Date": member['Date Of Birth'] || '',
            "Blood Group": member['Blood Group'] || '',
            "City": member['City'] || '',
            "Married": member['Married'] || '',
            "Profession": member['Profession'] || '',
            "Designation": member['Designation'] || '',
            "Company": member['Company'] || '',
            "Mobile": member['Mobile'] || '',
            "Gender": member['Gender'] || ''
        };
        res.json(result);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// GET: api/MemberData/fetchByMemberId/:memberId
exports.getMemberByMemberId = async (req, res) => {
    try {
        const memberId = req.params.memberId;
        const rows = await googleSheets.getRows(SHEETS.MEMBERS);
        const member = rows.find(r => r['House no.'] === memberId);

        if (!member) return res.status(404).json({ message: "Member not found" });

        res.json({
            "Name": member['Name'] || '',
            "City": member['City'] || '',
            "Mobile": member['Mobile'] || ''
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Master Data Endpoints
exports.getBloodGroups = async (req, res) => {
    try {
        const rows = await googleSheets.getRows(SHEETS.MEMBERS);
        res.json(getUniqueValues(rows, 'Blood Group'));
    } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getRelations = async (req, res) => {
    try {
        const rows = await googleSheets.getRows(SHEETS.MEMBERS);
        res.json(getUniqueValues(rows, 'Relation'));
    } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getProfessions = async (req, res) => {
    try {
        const rows = await googleSheets.getRows(SHEETS.MEMBERS);
        res.json(getUniqueValues(rows, 'Profession'));
    } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getMarriageStatuses = async (req, res) => {
    try {
        const rows = await googleSheets.getRows(SHEETS.MEMBERS);
        res.json(getUniqueValues(rows, 'Married'));
    } catch (err) { res.status(500).json({ message: err.message }); }
};

// Donation Aggregation
exports.getTotalDonation = async (req, res) => {
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

            // Helper to get number of months between dates
            const startDate = new Date(fromYear, fromMonth, 1);
            const endDate = new Date(toYear, toMonth, 1);
            
            // Generate all months in between inclusive
            let current = new Date(startDate);
            const monthCount = (toYear - fromYear) * 12 + (toMonth - fromMonth) + 1;
            const amountPerMonth = amount / monthCount;

            while (current <= endDate) {
                const y = current.getFullYear();
                const m = current.getMonth();

                if (!aggregation[y]) {
                    aggregation[y] = { 
                        year: y, 
                        avgDonation: 0, 
                        totalEntries: 0, 
                        totalDonation: 0,
                        months: Array.from({ length: 12 }, (_, i) => ({
                            month: i,
                            totalEntries: 0,
                            totalDonation: 0
                        }))
                    };
                }

                // If this is the FIRST month of the payment record, we count it as an "entry" for the year summary
                // to avoid double counting entries in the main stat cards, but we track amount in all months.
                // Or better: an entry is a payment record. So totalEntries = rows.length. 
                // But for the month breakdown, we show how many payments covers that month.
                
                aggregation[y].months[m].totalEntries += 1;
                aggregation[y].months[m].totalDonation += amountPerMonth;
                
                // Move to next month
                current.setMonth(current.getMonth() + 1);
            }

            // Group level aggregation (Total Entries is count of records, Total Donation is sum of amounts)
            // Note: A payment spanning years will contribute to multiple year aggregations if we do it here.
            // Simplified: Re-calculated below from month data or just use row data.
        });

        const finalResult = Object.values(aggregation).map(item => {
            // Recalculate group totals from month data
            const yearTotalDonation = item.months.reduce((sum, m) => sum + m.totalDonation, 0);
            const yearTotalEntries = item.months.reduce((sum, m) => sum + m.totalEntries, 0); // This is "month-level entries"
            
            // To get original record count for that year, we need to track which records touched this year
            return {
                ...item,
                totalDonation: yearTotalDonation,
                // We keep totalEntries as "How many payments touched this year"
                // Actually, let's just use the month sum for consistency in the report
                totalEntries: yearTotalEntries,
                avgDonation: yearTotalEntries > 0 ? yearTotalDonation / yearTotalEntries : 0
            };
        }).sort((a, b) => b.year - a.year);

        res.json(finalResult);
    } catch (err) { res.status(500).json({ message: err.message }); }
};

// Donation List
exports.getDonationData = async (req, res) => {
    try {
        const { year } = req.query;
        let rows = await googleSheets.getRows(SHEETS.ASSOCIATION_FEES);

        if (year) {
            const requestedYear = parseInt(year);
            rows = rows.filter(row => {
                const fromYear = parseInt(row.fromYear);
                const toYear = parseInt(row.toYear);
                
                // If period is missing, fallback to paymentDate (compatibility)
                if (isNaN(fromYear) || isNaN(toYear)) {
                    const date = new Date(row.paymentDate);
                    return !isNaN(date.getTime()) && date.getFullYear() === requestedYear;
                }

                // Check if the requested year is within the year range inclusive
                return requestedYear >= fromYear && requestedYear <= toYear;
            });
        }

        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const formattedRows = rows.map(row => {
            const fromMonth = (row.fromMonth !== undefined && row.fromMonth !== '') ? parseInt(row.fromMonth) : null;
            const fromYear = (row.fromYear !== undefined && row.fromYear !== '') ? parseInt(row.fromYear) : null;
            const toMonth = (row.toMonth !== undefined && row.toMonth !== '') ? parseInt(row.toMonth) : null;
            const toYear = (row.toYear !== undefined && row.toYear !== '') ? parseInt(row.toYear) : null;

            const fromP = fromMonth !== null ? `${monthNames[fromMonth]} ${fromYear}` : '';
            const toP = toMonth !== null ? `${monthNames[toMonth]} ${toYear}` : '';
            
            return {
                id: row.id,
                "Member Id": row.memberId,
                "Name": row.name,
                "City": row.city,
                "Mobile": row.mobile,
                "Amount": parseFloat(row.amount) || 0,
                "PaymentType": row.paymentType,
                "PaymentNo": row.paymentNo,
                "PaymentDate": row.paymentDate,
                "FeePeriod": fromP === toP ? fromP : `${fromP} - ${toP}`,
                fromMonth,
                fromYear,
                toMonth,
                toYear
            };
        }).sort((a, b) => new Date(b.PaymentDate) - new Date(a.PaymentDate));

        res.json(formattedRows);
    } catch (err) { res.status(500).json({ message: err.message }); }
};

// Download Donation Data (Excel)
exports.downloadDonationData = async (req, res) => {
    try {
        const rows = await googleSheets.getRows(SHEETS.ASSOCIATION_FEES);
        const data = rows.map(row => ({
            receiptNo: row.id,
            memberId: row.memberId,
            name: row.name,
            city: row.city,
            mobile: row.mobile,
            amount: row.amount,
            paymentType: row.paymentType,
            paymentNo: row.paymentNo,
            paymentDate: row.paymentDate,
            fromMonth: row.fromMonth,
            fromYear: row.fromYear,
            toMonth: row.toMonth,
            toYear: row.toYear
        }));

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Donations');

        if (data.length > 0) {
            worksheet.columns = Object.keys(data[0]).map(key => ({ header: key, key: key }));
            worksheet.addRows(data);
        }

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=donation_data.xlsx');

        await workbook.xlsx.write(res);
        res.end();
    } catch (err) { res.status(500).json({ message: err.message }); }
};

// POST: api/MemberData (Add Member)
exports.addMember = async (req, res) => {
    try {
        const value = req.body;
        const rows = await googleSheets.getRows(SHEETS.MEMBERS);

        let newMemberId = value.MemberId;
        let isNew = false;

        if (!newMemberId) {
            const maxId = rows.reduce((max, row) => Math.max(max, parseInt(row['House no.']) || 0), 0);
            newMemberId = maxId + 1;
            isNew = true;
        }

        const dob = formatDate(value.DateOfBirth);
        // Generate a simple _id if not provided (Sheets doesn't auto-increment)
        const _id = Date.now().toString();

        const newRow = {
            "House no.": newMemberId.toString(),
            "Name": value.name || value.Name || '',
            "Name-Guj": value.nameGujarati || value['Name - Gujarati'] || '',
            "Gender": value.gender || value.Gender || '',
            "Date Of Birth": dob,
            "Profession": value.profession || value.Profession || '',
            "Mobile": value.mobile || value.Mobile || '',
            "Married": value.marriageStatus || value.marriagestatus || value.Married || '',
            "Company": value.company || value.Company || '',
            "Blood Group": value.bloodGroup || value.BloodGroup || ''
        };

        await googleSheets.addRow(SHEETS.MEMBERS, newRow);

        if (isNew) {
            res.json({ message: `Record added successfully! Your New member id is ${newMemberId}` });
        } else {
            res.json({ message: "Record added successfully!" });
        }
    } catch (err) { res.status(500).json({ message: err.message }); }
};

// PUT: api/MemberData/:id (Update Member)
exports.updateMember = async (req, res) => {
    try {
        const id = req.params.id; // This is the _id
        const value = req.body;

        const rows = await googleSheets.getRows(SHEETS.MEMBERS);
        const oldMember = rows.find(r => (r['House no.'] || r._id) === value.Id?.toString());
        
        if (!oldMember) return res.status(404).json({ message: "Member not found" });

        const dob = formatDate(value.DateOfBirth);
        // We preserve the existing House no. by taking it from oldMember
        const updatedData = {
            "House no.": oldMember['House no.'] || oldMember._id,
            "Name": value.name || value.Name || '',
            "Name-Guj": value.nameGujarati || value['Name-Guj'] || value['Name - Gujarati'] || '',
            "Gender": value.gender || value.Gender || '',
            "Date Of Birth": dob,
            "Profession": value.profession || value.Profession || '',
            "Mobile": value.mobile || value.Mobile || '',
            "Married": value.marriageStatus || value.marriagestatus || value.Married || '',
            "Company": value.company || value.Company || '',
            "Blood Group": value.bloodGroup || value.BloodGroup || ''
        };

        if (!value.Id) return res.status(400).json({ message: "Id is required" });

        await googleSheets.updateRow(SHEETS.MEMBERS, 'House no.', value.Id.toString(), updatedData);
        
        res.json({ message: "Record updated successfully!" });
    } catch (err) { res.status(500).json({ message: err.message }); }
};

// DELETE: api/MemberData/:id
exports.deleteMember = async (req, res) => {
    try {
        await googleSheets.deleteRow(SHEETS.MEMBERS, 'House no.', req.params.id);
        res.json({ message: "Record deleted successfully from Member list!" });
    } catch (err) { res.status(500).json({ message: err.message }); }
};

// DELETE: api/MemberData/donation/:id
exports.deleteDonation = async (req, res) => {
    try {
        await googleSheets.deleteRow(SHEETS.ASSOCIATION_FEES, 'id', req.params.id);
        res.json({ message: "Association Fee record deleted successfully!" });
    } catch (err) { res.status(500).json({ message: err.message }); }
};

// POST: api/MemberData/donation
exports.createDonation = async (req, res) => {
    try {
        await ensureAssociationFeesSheet();
        const value = req.body;
        let maxId = "-";

        const generateOnly = value.GenerateOnly !== undefined ? value.GenerateOnly : value.generateOnly;
        const paymentTypeStr = value.PaymentType || value.paymentType;
        const memberId = value.MemberId || value.memberId;
        const amount = value.Amount || value.amount;
        const name = value.Name || value.name;
        const mobile = value.Mobile || value.mobile;
        const paymentNo = value.PaymentNo || value.paymentNo;
        const city = value.City || value.city;
        const fromMonth = value.fromMonth;
        const fromYear = value.fromYear;
        const toMonth = value.toMonth;
        const toYear = value.toYear;

        if (!generateOnly) {
            const donationRows = await googleSheets.getRows(SHEETS.ASSOCIATION_FEES);

            // Validation: Check for existing overlapping periods for this member
            const memberIdStr = memberId ? memberId.toString() : '';
            const newStart = parseInt(fromYear) * 12 + parseInt(fromMonth);
            const newEnd = parseInt(toYear) * 12 + parseInt(toMonth);

            const duplicate = donationRows.find(row => {
                if (row.memberId !== memberIdStr) return false;
                
                const existingStart = parseInt(row.fromYear) * 12 + parseInt(row.fromMonth);
                const existingEnd = parseInt(row.toYear) * 12 + parseInt(row.toMonth);

                // Overlap check
                return (newStart <= existingEnd) && (existingStart <= newEnd);
            });

            if (duplicate) {
                const monthsNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                const startLabel = `${monthsNames[duplicate.fromMonth]} ${duplicate.fromYear}`;
                const endLabel = `${monthsNames[duplicate.toMonth]} ${duplicate.toYear}`;
                
                return res.status(400).json({ 
                    message: `Fee already paid for period: ${startLabel} to ${endLabel}` 
                });
            }

            const nextId = donationRows.reduce((max, row) => Math.max(max, parseInt(row.id) || 0), 0) + 1;

            const paymentType = paymentTypeStr === "રોકડા" ? "cash" : (paymentTypeStr === "UPI" ? "upi" : (paymentTypeStr === "ચેક" ? "cheque" : null));
            const now = new Date().toISOString().slice(0, 10);

            const newDonation = {
                id: nextId.toString(),
                memberId: memberId ? memberId.toString() : '',
                amount: amount.toString(),
                name: name,
                mobile: mobile,
                paymentType: paymentType,
                paymentNo: paymentNo || '',
                paymentDate: now,
                city: city,
                fromMonth: fromMonth !== undefined ? fromMonth.toString() : '',
                fromYear: fromYear !== undefined ? fromYear.toString() : '',
                toMonth: toMonth !== undefined ? toMonth.toString() : '',
                toYear: toYear !== undefined ? toYear.toString() : ''
            };

            await googleSheets.addRow(SHEETS.ASSOCIATION_FEES, newDonation);
            maxId = nextId;
        }

        // Generate PDF (Same as before)
        const templatePath = path.join(__dirname, '..', 'template', 'Invoice.html');
        let htmlContent = fs.readFileSync(templatePath, 'utf8');

        const nowFormatted = new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });

        htmlContent = htmlContent
            .replace("#name#", name || (memberId ? memberId.toString() : "-"))
            .replace("#paid-date#", nowFormatted)
            .replace("#city#", city || "-")
            .replace("#amount#", amount ? amount.toString() : "-")
            .replace("#memberId#", memberId || "-")
            .replace("#mobile#", mobile || "-")
            .replace("#paymentType#", paymentTypeStr === "રોકડા" ? paymentTypeStr : paymentTypeStr + " દ્વારા ")
            .replace("#paymentType-1#", !paymentTypeStr ? "-" : (paymentTypeStr === "રોકડા" ? "" : paymentTypeStr + " નંબર: "))
            .replace("#paymentNo#", !paymentNo ? (paymentTypeStr === "રોકડા" ? "" : "-") : paymentNo)
            .replace("#receiptNo#", maxId);

        const browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
        await page.setViewport({ width: 800, height: 1100, deviceScaleFactor: 2 });

        const imageBuffer = await page.screenshot({
            type: 'jpeg',
            quality: 95,
            fullPage: true
        });
        await browser.close();

        const safeName = (name || "receipt").replace(/[^a-zA-Z0-9]/g, '_');
        const encodedName = encodeURIComponent(name || "receipt");

        res.set({
            'Content-Type': 'image/jpeg',
            'Content-Disposition': `attachment; filename="${safeName}.jpg"; filename*=UTF-8''${encodedName}.jpg`,
            'Content-Length': imageBuffer.length
        });
        res.send(imageBuffer);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};
