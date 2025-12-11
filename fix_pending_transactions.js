const mongoose = require('mongoose');
const Transaction = require('./models/Transaction');
require('dotenv').config();

async function checkAndFixTransactions() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB\n');

        // Find all instructor_payment transactions
        const allInstructorPayments = await Transaction.find({
            type: 'instructor_payment'
        });

        console.log(`Found ${allInstructorPayments.length} instructor payment transactions:\n`);

        allInstructorPayments.forEach((txn, index) => {
            console.log(`${index + 1}. Status: ${txn.status} | Amount: ৳${txn.amount}`);
        });

        // Count by status
        const pending = allInstructorPayments.filter(t => t.status === 'pending').length;
        const completed = allInstructorPayments.filter(t => t.status === 'completed').length;
        const validated = allInstructorPayments.filter(t => t.status === 'validated').length;

        console.log(`\nSummary:`);
        console.log(`- Pending: ${pending}`);
        console.log(`- Completed: ${completed}`);
        console.log(`- Validated: ${validated}`);

        if (pending > 0 || validated > 0) {
            console.log(`\n🔧 Fixing transactions...`);

            // Update pending and validated to completed
            const result = await Transaction.updateMany(
                {
                    type: 'instructor_payment',
                    status: { $in: ['pending', 'validated'] }
                },
                {
                    $set: { status: 'completed' }
                }
            );

            console.log(`✅ Updated ${result.modifiedCount} transactions to 'completed' status`);
        } else {
            console.log(`\n✅ All transactions already have correct status!`);
        }

        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkAndFixTransactions();
