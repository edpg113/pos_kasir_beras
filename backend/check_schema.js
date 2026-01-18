const db = require("./db");

const tables = ["transaksi", "pelanggan", "piutang", "pembayaran_piutang"];

const checkTable = (tableName) => {
  return new Promise((resolve) => {
    db.query(`DESCRIBE ${tableName}`, (err, results) => {
      if (err) {
        console.log(`❌ Table ${tableName} error:`, err.message);
        resolve(null);
      } else {
        console.log(`\nTable: ${tableName}`);
        console.table(
          results.map((r) => ({
            Field: r.Field,
            Type: r.Type,
            Null: r.Null,
            Key: r.Key,
            Default: r.Default,
          }))
        );
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
