const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const importData = async () => {
  try {
    const uniqueNames = new Set();
    const csvFilePath = path.join(__dirname, '../public/India Medicines and Drug Info Dataset.csv');
    
    console.log('Parsing CSV...');
    
    let count = 0;
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (data) => {
        const name = data['Medicine Name'];
        if (name && typeof name === 'string') {
          const trimmedName = name.trim();
          if (trimmedName && !uniqueNames.has(trimmedName)) {
            uniqueNames.add(trimmedName);
          }
        }
        count++;
        if (count % 50000 === 0) {
          console.log(`Parsed ${count} rows...`);
        }
      })
      .on('end', async () => {
        console.log(`Finished parsing. Found ${uniqueNames.size} unique medicines.`);
        
        const uniqueArray = Array.from(uniqueNames).map(name => ({
          name
        }));

        console.log('Sending to API in chunks of 1000...');
        const CHUNK_SIZE = 1000;
        let insertedCount = 0;

        for (let i = 0; i < uniqueArray.length; i += CHUNK_SIZE) {
          const chunk = uniqueArray.slice(i, i + CHUNK_SIZE);
          try {
            const res = await fetch('http://localhost:3000/api/medicines', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(chunk)
            });
            
            if (res.ok) {
              insertedCount += chunk.length;
              console.log(`Successfully sent chunk ${i / CHUNK_SIZE + 1} / ${Math.ceil(uniqueArray.length / CHUNK_SIZE)}`);
            } else {
              console.error(`Error in chunk ${i / CHUNK_SIZE + 1}: ${res.statusText}`);
            }
          } catch (err) {
            console.error(`Network error sending chunk ${i / CHUNK_SIZE + 1}:`, err.message);
          }
        }

        console.log('Import process complete!');
      });
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
};

importData();
