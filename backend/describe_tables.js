const db = require("./db");

const tables = ["produk", "po_barang"];

const checkTable = (tableName) => {
  return new Promise((resolve) => {
    db.query(`DESCRIBE ${tableName}`, (err, results) => {
      if (err) {
        console.log(`❌ Table ${tableName} error:`, err.message);
        resolve(null);
      } else {
        console.log(`\nTable: ${tableName}`);
        console.log(JSON.stringify(results, null, 2));
        resolve(results);
      }
    });
  });
};

async function run() {
  for (const table of tables) {
    await checkTable(table);
  }
  process.exit();
}

run();
