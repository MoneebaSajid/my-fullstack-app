const bcrypt = require('bcryptjs');
const db = require('./config/db');

const hashAllPasswords = async () => {
  try {
    console.log('🔄 Starting password hashing...');

    // ===== ADMIN =====
    const [admins] = await db.query('SELECT admin_id, password FROM Admin');
    for (const admin of admins) {
      const hashed = await bcrypt.hash(admin.password, 10);
      await db.query('UPDATE Admin SET password = ? WHERE admin_id = ?', 
        [hashed, admin.admin_id]);
    }
    console.log(`✅ ${admins.length} Admin passwords hashed!`);

    // ===== PASSENGER =====
    const [passengers] = await db.query('SELECT passenger_id, password FROM Passenger');
    for (const passenger of passengers) {
      const hashed = await bcrypt.hash(passenger.password, 10);
      await db.query('UPDATE Passenger SET password = ? WHERE passenger_id = ?', 
        [hashed, passenger.passenger_id]);
    }
    console.log(`✅ ${passengers.length} Passenger passwords hashed!`);

    // ===== OWNER =====
    const [owners] = await db.query('SELECT owner_id, password FROM Owner');
    for (const owner of owners) {
      const hashed = await bcrypt.hash(owner.password, 10);
      await db.query('UPDATE Owner SET password = ? WHERE owner_id = ?', 
        [hashed, owner.owner_id]);
    }
    console.log(`✅ ${owners.length} Owner passwords hashed!`);

    console.log('🎉 All passwords hashed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

hashAllPasswords();