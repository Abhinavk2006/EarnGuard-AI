const PDFDocument = require('pdfkit');

/**
 * TRANSACTION & BILLING MANAGEMENT
 * Generates structured bills and comprehensive financial statements in PDF format.
 */

// Format generic bill metadata (JSON Fallback/Structure)
function generateBill(transaction, user, policy) {
    return {
        brand: "EARNGUARD AI - Financial Protection Framework",
        date: new Date().toISOString(),
        billReceiptNo: `REC-${Date.now()}`,
        transactionContext: {
            transactionId: transaction.id,
            status: transaction.status,
            type: transaction.type === 'Premium_Payment' ? 'Policy Premium' : 'Claim Settlement Payout'
        },
        userDetails: {
            workerName: user.name,
            workerPhone: user.phone,
            workerZone: user.zoneId,
            linkedPolicy: policy ? policy.policyId : 'N/A'
        },
        financialSummary: {
            amountProcessed: `INR ${transaction.amount}`,
            walletBalanceAfterTx: `INR ${user.walletBalance}`
        },
        authenticityToken: "Secured & Verified By EarnGuard Autonomous Ledger"
    };
}

// Generate an official PDF Bill
function generatePDFBill(transaction, user, policy, res) {
    const doc = new PDFDocument({ margin: 50 });
    
    // Pipe PDF to the HTTP response stream directly
    doc.pipe(res);
    
    doc.fontSize(20).text('EarnGuard AI', { align: 'center' });
    doc.fontSize(12).fillColor('gray').text('Official Financial Receipt', { align: 'center' });
    doc.moveDown();

    doc.fillColor('black').fontSize(14).text(`Receipt No: REC-${Date.now()}`);
    doc.fontSize(12).text(`Date: ${new Date().toLocaleString()}`);
    doc.moveDown();

    doc.fontSize(14).text('User Details');
    doc.fontSize(12).text(`Name: ${user.name}`);
    doc.text(`Phone: ${user.phone}`);
    doc.text(`Active Policy ID: ${policy ? policy.policyId : 'N/A'}`);
    doc.moveDown();

    doc.fontSize(14).text('Transaction Details');
    doc.fontSize(12).text(`Transaction ID: ${transaction.id}`);
    doc.text(`Type: ${transaction.type === 'Premium_Payment' ? 'Premium Payment' : 'Claim Payout'}`);
    doc.text(`Status: ${transaction.status}`);
    doc.moveDown();

    doc.fontSize(16).fillColor(transaction.type === 'Premium_Payment' ? 'red' : 'green')
       .text(`Amount: INR ${transaction.amount}`, { bold: true });
    
    doc.moveDown(2);
    doc.fontSize(10).fillColor('gray').text('Secured & Verified By EarnGuard Autonomous Ledger', { align: 'center' });

    doc.end();
}

// Generate Official PDF Statement
function generatePDFStatement(userTransactions, user, res) {
    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);

    doc.fontSize(20).text('EarnGuard AI', { align: 'center' });
    doc.fontSize(12).fillColor('gray').text('Account Financial Statement', { align: 'center' });
    doc.moveDown();

    doc.fillColor('black').fontSize(12).text(`Account Holder: ${user.name}`);
    doc.text(`Date Generated: ${new Date().toLocaleString()}`);
    doc.moveDown(2);

    let totalIn = 0;
    let totalOut = 0;

    // Table Header
    doc.fontSize(10).text('Date', 50, doc.y, { continued: true })
       .text('Transaction ID', 150, doc.y, { continued: true })
       .text('Type', 300, doc.y, { continued: true })
       .text('Amount', 450, doc.y);
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);

    // Table Rows
    if (!userTransactions || userTransactions.length === 0) {
        doc.text('No transactions found on this account.', { align: 'center' });
    } else {
        userTransactions.forEach(tx => {
            const dateStr = new Date(tx.timestamp).toLocaleDateString();
            const txType = tx.type === 'Premium_Payment' ? 'Premium' : 'Payout';
            
            doc.text(dateStr, 50, doc.y, { continued: true, width: 100 })
               .text(tx.id, 150, doc.y, { continued: true, width: 150 })
               .text(txType, 300, doc.y, { continued: true, width: 150 })
               .text(`INR ${tx.amount}`, 450, doc.y);
            doc.moveDown(0.5);

            if (tx.type === 'Claim_Payout' && tx.status === 'Success') totalIn += tx.amount;
            if (tx.type === 'Premium_Payment' && tx.status === 'Success') totalOut += tx.amount;
        });
    }

    doc.moveDown(2);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    // Summary
    doc.fontSize(12).text(`Total Premium Paid: INR ${totalOut}`);
    doc.text(`Total Claims Received: INR ${totalIn}`);
    
    const netBalance = totalIn - totalOut;
    const netColor = netBalance >= 0 ? 'green' : 'red';
    doc.fillColor(netColor).text(`Net Financial Retention: INR ${netBalance}`);

    doc.end();
}

module.exports = { generateBill, generatePDFBill, generatePDFStatement };
