const db = require("./db");

const month = "2026-01";
console.log(`Testing query for month: ${month}`);

const query1 =
  "SELECT * FROM pengeluaran WHERE DATE_FORMAT(tanggal, '%Y-%m') = ?";
db.query(query1, [month], (err, res) => {
  if (err) {
    console.error("Query Error:", err);
  } else {
    console.log(`Found ${res.length} records.`);
    console.log(JSON.stringify(res, null, 2));
  }
  process.exit();
});
