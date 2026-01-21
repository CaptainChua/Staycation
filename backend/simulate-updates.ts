import pool from './config/db';

const simulateUpdates = async () => {
  const client = await pool.connect();
  try {
    console.log('🔄 Starting simulation (Ctrl+C to stop)...');
    
    // Loop forever
    while (true) {
      // Fetch all properties
      const res = await client.query('SELECT * FROM properties');
      const properties = res.rows;

      if (properties.length > 0) {
        // Pick a random property
        const randomProp = properties[Math.floor(Math.random() * properties.length)];
        
        // Randomize available units (0 to total_units)
        const newAvailable = Math.floor(Math.random() * (randomProp.total_units + 1));
        
        await client.query(`
          UPDATE properties 
          SET available_units = $1, updated_at = NOW()
          WHERE id = $2
        `, [newAvailable, randomProp.id]);
        
        console.log(`Updated ${randomProp.name}: ${randomProp.available_units} -> ${newAvailable} units available`);
      }

      // Wait 5-10 seconds
      const delay = Math.floor(Math.random() * 5000) + 5000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }

  } catch (error) {
    console.error('❌ Simulation error:', error);
  } finally {
    client.release();
    pool.end();
  }
};

simulateUpdates();
