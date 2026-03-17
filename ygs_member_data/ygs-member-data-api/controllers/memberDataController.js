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
    DONATION: 'donation',
    CONFIG: 'configuration'
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
        const leadMember = rows.find(r => r.memberId === member.memberId && r.relation === 'Self');

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
        const member = rows.find(r => r.memberId === memberId && r.relation === 'Self');

        if (!member) return res.status(404).json({ message: "Member not found" });

        res.json({
            "Name": member.name,
            "City": member.city,
            "Mobile": member.mobile
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Master Data Endpoints
exports.getBloodGroups = async (req, res) => {
    try {
        const rows = await googleSheets.getRows(SHEETS.MEMBERS);
        res.json(getUniqueValues(rows, 'bloodGroup'));
    } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getRelations = async (req, res) => {
    try {
        const rows = await googleSheets.getRows(SHEETS.MEMBERS);
        res.json(getUniqueValues(rows, 'relation'));
    } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getProfessions = async (req, res) => {
    try {
        const rows = await googleSheets.getRows(SHEETS.MEMBERS);
        res.json(getUniqueValues(rows, 'profession'));
    } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getMarriageStatuses = async (req, res) => {
    try {
        const rows = await googleSheets.getRows(SHEETS.MEMBERS);
        res.json(getUniqueValues(rows, 'marriagestatus'));
    } catch (err) { res.status(500).json({ message: err.message }); }
};

// Donation Aggregation
exports.getTotalDonation = async (req, res) => {
    try {
        const rows = await googleSheets.getRows(SHEETS.DONATION);
        const aggregation = {};

        rows.forEach(row => {
            const date = new Date(row.paymentDate);
            if (isNaN(date.getTime())) return;
            const year = date.getFullYear();
            const amount = parseFloat(row.amount) || 0;

            if (!aggregation[year]) {
                aggregation[year] = { year, avgDonation: 0, totalEntries: 0, totalDonation: 0 };
            }
            aggregation[year].totalEntries += 1;
            aggregation[year].totalDonation += amount;
        });

        const result = Object.values(aggregation).map(item => ({
            ...item,
            avgDonation: item.totalDonation / item.totalEntries
        }));

        res.json(result);
    } catch (err) { res.status(500).json({ message: err.message }); }
};

// Donation List
exports.getDonationData = async (req, res) => {
    try {
        const { year } = req.query;
        let rows = await googleSheets.getRows(SHEETS.DONATION);

        if (year) {
            rows = rows.filter(row => {
                const date = new Date(row.paymentDate);
                return !isNaN(date.getTime()) && date.getFullYear().toString() === year;
            });
        }

        const formattedRows = rows.map(row => ({
            id: row.id,
            "Member Id": row.memberId,
            "Name": row.name,
            "City": row.city,
            "Mobile": row.mobile,
            "Amount": row.amount,
            "PaymentType": row.paymentType,
            "PaymentNo": row.paymentNo,
            "PaymentDate": row.paymentDate
        })).sort((a, b) => new Date(b.PaymentDate) - new Date(a.PaymentDate));

        res.json(formattedRows);
    } catch (err) { res.status(500).json({ message: err.message }); }
};

// Download Donation Data (Excel)
exports.downloadDonationData = async (req, res) => {
    try {
        const rows = await googleSheets.getRows(SHEETS.DONATION);
        const data = rows.map(row => ({
            receiptNo: row.id,
            memberId: row.memberId,
            name: row.name,
            city: row.city,
            mobile: row.mobile,
            amount: row.amount,
            paymentType: row.paymentType,
            paymentNo: row.paymentNo,
            paymentDate: row.paymentDate
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
            const maxId = rows.reduce((max, row) => Math.max(max, parseInt(row.memberId) || 0), 0);
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
        await googleSheets.deleteRow(SHEETS.DONATION, 'id', req.params.id);
        res.json({ message: "Donation record deleted successfully!" });
    } catch (err) { res.status(500).json({ message: err.message }); }
};

// POST: api/MemberData/donation
exports.createDonation = async (req, res) => {
    try {
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

        if (!generateOnly) {
            const donationRows = await googleSheets.getRows(SHEETS.DONATION);
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
                city: city
            };

            await googleSheets.addRow(SHEETS.DONATION, newDonation);
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
