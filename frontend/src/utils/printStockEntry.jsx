import React from "react";
import ReactDOMServer from "react-dom/server";
const StockEntryTemplate = ({ storeSettings, stockData }) => {
  const { namaToko, alamat, email, telepon } = storeSettings || {
    namaToko: "POS Kasir Beras",
    alamat: "-",
    email: "-",
    telepon: "-",
  };
  const { supplier, items, tanggal } = stockData;

  const grandTotalNet = items.reduce(
    (sum, item) => sum + (Number(item.total) || 0),
    0,
  );

  const grandTotalGross = items.reduce(
    (sum, item) =>
      sum + Number(item.quantity || 0) * Number(item.hargaBeli || 0),
    0,
  );

  const grandTotalQty = items.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0),
    0,
  );

  const totalBiayaKuli = items.reduce(
    (sum, item) => sum + Number(item.biayaKuli || 0),
    0,
  );
  const totalBiayaSopir = items.reduce(
    (sum, item) => sum + Number(item.biayaSopir || 0),
    0,
  );
  const totalDP = items.reduce((sum, item) => sum + Number(item.dp || 0), 0);

  const dateStr = new Date(tanggal || new Date()).toLocaleString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="stock-entry-receipt">
      <div className="header">
        <p className="title">{namaToko}</p>
        <p className="small">{alamat}</p>
        <p style={{ marginTop: "10px", fontWeight: "bold" }}>
          LAPORAN TAMBAH STOK
        </p>
      </div>

      <div className="divider" />

      <div className="info">
        <p>
          <span>Tanggal:</span>
          <span>{dateStr}</span>
        </p>
        <p>
          <span>Supplier:</span>
          <span>{supplier || "-"}</span>
        </p>
      </div>

      <div className="divider" />

      <div className="items">
        <div className="item-header">
          <span>Produk</span>
          <span style={{ textAlign: "center" }}>Qty</span>
          <span style={{ textAlign: "right" }}>Total</span>
        </div>
        {items.map((item, i) => (
          <div className="row" key={i}>
            <span>{item.produk}</span>
            <span style={{ textAlign: "center" }}>{item.quantity} kg</span>
            <span>
              Rp.
              {Number(
                Number(item.quantity) * Number(item.hargaBeli),
              ).toLocaleString("id-ID")}
            </span>
          </div>
        ))}
      </div>

      <div className="divider" />

      <div className="totals">
        <p>
          <span>Total Produk:</span>
          <span>Rp.{grandTotalGross.toLocaleString("id-ID")}</span>
        </p>
        <p>
          <span>Total Qty:</span>
          <span>{grandTotalQty.toLocaleString("id-ID")} kg</span>
        </p>
        {totalBiayaKuli > 0 && (
          <p>
            <span>Biaya Kuli:</span>
            <span>- Rp.{totalBiayaKuli.toLocaleString("id-ID")}</span>
          </p>
        )}
        {totalBiayaSopir > 0 && (
          <p>
            <span>Biaya Sopir:</span>
            <span>- Rp.{totalBiayaSopir.toLocaleString("id-ID")}</span>
          </p>
        )}
        {totalDP > 0 && (
          <p>
            <span>DP:</span>
            <span>- Rp.{totalDP.toLocaleString("id-ID")}</span>
          </p>
        )}
        <p
          style={{
            fontSize: "14px",
            marginTop: "5px",
            borderTop: "1px dashed #eee",
            paddingTop: "5px",
            fontWeight: "bold",
          }}
        >
          <span>Total Bayar:</span>
          <span>Rp.{grandTotalNet.toLocaleString("id-ID")}</span>
        </p>
      </div>

      <div className="divider" />

      <div className="footer">
        <p>Laporan ini dihasilkan secara otomatis oleh sistem.</p>
      </div>
    </div>
  );
};

/**
 * printStockEntry Utility Function
 */
export const printStockEntry = (storeSettings, stockData) => {
  if (!stockData) {
    alert("Data stok tidak tersedia.");
    return;
  }

  const htmlContent = ReactDOMServer.renderToStaticMarkup(
    <StockEntryTemplate storeSettings={storeSettings} stockData={stockData} />,
  );

  const stockEntryStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap');
    body { margin: 0; padding: 0; display: flex; justify-content: center; background-color: #f0f0f0; }
    .stock-entry-receipt {
      width: 100%;
      max-width: 58mm;
      margin: 0 auto;
      background-color: white;
      color: #333;
      font-family: 'Inter', sans-serif;
      font-size: 13px;
      padding: 10px;
    }
    .stock-entry-receipt .header {
      text-align: center;
      margin-bottom: 20px;
    }
    .stock-entry-receipt .header .title {
      font-size: 18px;
      font-weight: bold;
      text-transform: uppercase;
      margin: 5px 0;
    }
    .stock-entry-receipt .header p {
      margin: 2px 0;
    }
    .stock-entry-receipt .header .small {
      font-size: 12px;
      font-weight: 400;
    }
    .stock-entry-receipt .divider {
      border-top: 1px dashed #ccc;
      margin: 10px 0;
    }
    .stock-entry-receipt .info {
      margin: 15px 0;
      font-weight: bold;
    }
    .stock-entry-receipt .info p {
      margin: 4px 0;
      display: flex;
      justify-content: space-between;
    }
    .stock-entry-receipt .items {
      margin: 15px 0;
    }
    .stock-entry-receipt .items .item-header {
      font-weight: bold;
      display: flex;
      justify-content: space-between;
      margin-bottom: 5px;
      border-bottom: 1px solid #eee;
      padding-bottom: 5px;
    }
    .stock-entry-receipt .items .row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 5px;
    }
    .stock-entry-receipt .items .row span {
      flex: 1;
      font-weight: 700;
    }
    .stock-entry-receipt .items .row span:last-child {
      text-align: right;
    }
    .stock-entry-receipt .totals {
      margin: 10px 0;
    }
    .stock-entry-receipt .totals p {
      margin: 4px 0;
      display: flex;
      justify-content: space-between;
      font-weight: bold;
      font-size: 13px;
    }
    .stock-entry-receipt .totals p span:last-child {
      text-align: right;
    }
    .stock-entry-receipt .footer {
      text-align: center;
      margin-top: 20px;
      font-size: 12px;
      color: #888;
    }
    .stock-entry-receipt .footer p {
      margin: 2px 0;
    }
    @media print {
      body { background-color: white !important; }
      @page { margin: 0; }
      .stock-entry-receipt { padding: 0; }
    }
  `;

  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(`
      <html>
        <head>
          <title>Cetak Laporan Tambah Stok</title>
          <style>
             ${stockEntryStyles}
          </style>
        </head>
        <body>
          <div style="background-color: white; padding: 0px; margin: 20px 0;">
            ${htmlContent}
          </div>
          <script>
            window.onload = function() { 
              setTimeout(() => {
                window.print();
              }, 500);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }
};
