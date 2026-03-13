const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/sugamya_bharat').then(async () => {
  const result = await mongoose.connection.collection('locations').updateMany(
    { status: 'pending' },
    { $set: { status: 'approved' } }
  );
  console.log('Updated:', result.modifiedCount, 'locations');
  process.exit();
});
