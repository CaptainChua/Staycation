import pool from './config/db';

const setupPropertiesTable = async () => {
  const client = await pool.connect();
  try {
    console.log('🔌 Connected to database...');

    // Create table
    await client.query(`
      CREATE TABLE IF NOT EXISTS properties (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name TEXT NOT NULL,
        total_units INT DEFAULT 0,
        available_units INT DEFAULT 0,
        latitude DOUBLE PRECISION,
        longitude DOUBLE PRECISION,
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ properties table checked/created.');

    // Check if empty
    const res = await client.query('SELECT COUNT(*) FROM properties');
    const count = parseInt(res.rows[0].count);

    if (count === 0) {
      console.log('🌱 Seeding properties...');
      const buildings = [
        { 
          name: "Building A", 
          total_units: 15, 
          available_units: 10, 
          latitude: 14.5547, 
          longitude: 121.0244 
        },
        { 
          name: "Building B", 
          total_units: 12, 
          available_units: 3, 
          latitude: 14.5515, 
          longitude: 121.0256 
        },
        { 
          name: "Building C", 
          total_units: 10, 
          available_units: 0, 
          latitude: 14.5535, 
          longitude: 121.0270 
        },
      ];

      for (const b of buildings) {
        await client.query(`
          INSERT INTO properties (name, total_units, available_units, latitude, longitude)
          VALUES ($1, $2, $3, $4, $5)
        `, [b.name, b.total_units, b.available_units, b.latitude, b.longitude]);
      }
      console.log('✅ Seeded initial properties.');
    } else {
      console.log('ℹ️ Properties table already has data. Skipping seed.');
    }

  } catch (error) {
    console.error('❌ Error setting up properties table:', error);
  } finally {
    client.release();
    pool.end();
  }
};

setupPropertiesTable();
