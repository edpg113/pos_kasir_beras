const axios = require("axios");

const BASE_URL = "http://localhost:3000/api";

async function testPiutang() {
  try {
    console.log("🚀 Starting Piutang Integration Tests...");

    // 1. Create a "Kasbon" transaction
    console.log("\n1. Creating Kasbon transaction...");
    const trxRes = await axios.post(`${BASE_URL}/transaksi`, {
      pembeli: "Budi Santoso", // Assuming this customer exists
      total: 100000,
      bayar: 0,
      kembalian: 0,
      metode: "kasbon",
      items: [{ produk_id: 1, qty: 1, harga: 100000, subtotal: 100000 }],
    });
    console.log("✅ Transaction created:", trxRes.data.message);
    const trxId = trxRes.data.transaksi_id;

    // 2. Get list of piutang
    console.log("\n2. Fetching piutang list...");
    const listRes = await axios.get(`${BASE_URL}/piutang`);
    const myPiutang = listRes.data.find(
      (p) => p.nama_pelanggan === "Budi Santoso" && p.total == 100000
    );
    if (!myPiutang) throw new Error("Piutang not found in list");
    console.log("✅ Piutang found:", myPiutang.id, "Status:", myPiutang.status);
    const piutangId = myPiutang.id;

    // 3. Make a partial payment
    console.log("\n3. Making partial payment (40,000)...");
    const payRes1 = await axios.post(`${BASE_URL}/piutang/${piutangId}/bayar`, {
      jumlah: 40000,
      metode: "cash",
      keterangan: "Cicilan 1",
    });
    console.log(
      "✅ Partial payment response:",
      payRes1.data.message,
      "New Sisa:",
      payRes1.data.newSisa
    );

    // 4. Verify status is partial
    const detailRes1 = await axios.get(`${BASE_URL}/piutang/${piutangId}`);
    if (detailRes1.data.status !== "partial")
      throw new Error(`Expected partial status, got ${detailRes1.data.status}`);
    console.log("✅ Status verified as partial");

    // 5. Make full payment
    console.log("\n5. Making full payment (60,000)...");
    const payRes2 = await axios.post(`${BASE_URL}/piutang/${piutangId}/bayar`, {
      jumlah: 60000,
      metode: "transfer",
      keterangan: "Pelunasan",
    });
    console.log(
      "✅ Full payment response:",
      payRes2.data.message,
      "New Sisa:",
      payRes2.data.newSisa
    );

    // 6. Verify status is paid
    const detailRes2 = await axios.get(`${BASE_URL}/piutang/${piutangId}`);
    if (detailRes2.data.status !== "paid")
      throw new Error(`Expected paid status, got ${detailRes2.data.status}`);
    console.log("✅ Status verified as paid");
    console.log("✅ History item count:", detailRes2.data.history.length);

    console.log("\n🎉 All tests passed successfully!");
  } catch (error) {
    console.error("\n❌ Test failed!");
    if (error.response) {
      console.error("Response data:", error.response.data);
    } else {
      console.error("Error message:", error.message);
    }
  }
}

testPiutang();
