import React from "react";
import ReactDOMServer from "react-dom/server";
import styles from "./printStockEntry.scss?inline";

/**
 * StockEntryTemplate Component
 */
const StockEntryTemplate = ({ storeSettings, stockData }) => {
  const { namaToko, alamat, email, telepon } = storeSettings || {
    namaToko: "POS Kasir Beras",
    alamat: "-",
    email: "-",
    telepon: "-",
  };
  const { supplier, items, tanggal } = stockData;

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
          <span style={{ textAlign: "right" }}>Qty</span>
        </div>
        {items.map((item, i) => (
          <div className="row" key={i}>
            <span>{item.produk}</span>
            <span>{item.quantity} kg</span>
          </div>
        ))}
      </div>

      <div className="divider" />

      <div className="footer">
        <p>Laporan ini dihasilkan secara otomatis oleh sistem.</p>
        <p className="small">
          {email} | {telepon}
        </p>
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
    <StockEntryTemplate storeSettings={storeSettings} stockData={stockData} />
  );

  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(`
      <html>
        <head>
          <title>Cetak Laporan Tambah Stok</title>
          <style>
             body { margin: 0; padding: 0; display: flex; justify-content: center; background-color: #f0f0f0; }
             @media print {
               body { background-color: white; }
               @page { margin: 0; }
             }
             ${styles}
          </style>
        </head>
        <body>
          <div style="background-color: white; padding: 0px; box-shadow: 0 0 10px rgba(0,0,0,0.1); margin: 20px 0;">
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
