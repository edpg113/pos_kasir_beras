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
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="a4-report-wrapper">
      <div className="report-header">
        <h1>LAPORAN TAMBAH STOK</h1>
        <p className="font-bold">{namaToko}</p>
        <p>{alamat}</p>
      </div>

      <div className="report-meta">
        <table
          style={{ width: "100%", fontSize: "10pt", marginBottom: "15px" }}
        >
          <tbody>
            <tr>
              <td style={{ width: "15%" }}>Supplier</td>
              <td style={{ width: "2%" }}>:</td>
              <td>{supplier || "-"}</td>
              <td style={{ width: "15%", textAlign: "right" }}>Waktu</td>
              <td style={{ width: "2%", textAlign: "right" }}>:</td>
              <td style={{ width: "25%", textAlign: "right" }}>{dateStr}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <table className="report-table">
        <thead>
          <tr>
            <th style={{ width: "5%" }}>No</th>
            <th>Nama Produk</th>
            <th style={{ width: "10%" }}>Qty</th>
            <th style={{ width: "18%" }}>Harga Beli</th>
            <th style={{ width: "10%" }}>Kuli</th>
            <th style={{ width: "10%" }}>Sopir</th>
            <th style={{ width: "10%" }}>DP</th>
            <th style={{ width: "18%" }}>Total Net</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i}>
              <td className="text-center">{i + 1}</td>
              <td className="font-bold">{item.produk}</td>
              <td className="text-center">{item.quantity}</td>
              <td className="text-right">
                Rp {Number(item.hargaBeli).toLocaleString("id-ID")}
              </td>
              <td className="text-right">
                {Number(item.biayaKuli || 0).toLocaleString("id-ID")}
              </td>
              <td className="text-right">
                {Number(item.biayaSopir || 0).toLocaleString("id-ID")}
              </td>
              <td className="text-right">
                {Number(item.dp || 0).toLocaleString("id-ID")}
              </td>
              <td className="text-right">
                Rp {Number(item.total).toLocaleString("id-ID")}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="font-bold" style={{ backgroundColor: "#f9f9f9" }}>
            <td colSpan={2} className="text-right">
              TOTAL
            </td>
            <td className="text-center">{grandTotalQty}</td>
            <td className="text-right">
              Rp {grandTotalGross.toLocaleString("id-ID")}
            </td>
            <td className="text-right">
              {totalBiayaKuli.toLocaleString("id-ID")}
            </td>
            <td className="text-right">
              {totalBiayaSopir.toLocaleString("id-ID")}
            </td>
            <td className="text-right">{totalDP.toLocaleString("id-ID")}</td>
            <td className="text-right">
              Rp {grandTotalNet.toLocaleString("id-ID")}
            </td>
          </tr>
        </tfoot>
      </table>

      <div
        className="report-footer"
        style={{
          marginTop: "40px",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <div style={{ textAlign: "center", width: "200px" }}>
          <p>Diterima Oleh,</p>
          <div style={{ height: "60px" }}></div>
          <p className="font-bold">( ____________________ )</p>
        </div>
        <div style={{ textAlign: "center", width: "200px" }}>
          <p>Supplier,</p>
          <div style={{ height: "60px" }}></div>
          <p className="font-bold">( {supplier || "____________________"} )</p>
        </div>
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
    
    @page {
      size: A4;
      margin: 0;
    }

    body { 
      margin: 0; 
      padding: 0; 
      background-color: #fff;
      font-family: 'Inter', sans-serif;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    .a4-report-wrapper {
      box-sizing: border-box;
      width: 210mm;
      min-height: 297mm;
      padding: 15mm 12mm;
      margin: 0 auto;
      background: #fff;
    }

    .report-header {
      text-align: center;
      margin-bottom: 20px;
      border-bottom: 2px solid #000;
      padding-bottom: 10px;
    }

    .report-header h1 {
      font-size: 18pt;
      margin: 0 0 5px 0;
      text-transform: uppercase;
    }

    .report-header p {
      font-size: 10pt;
      margin: 2px 0;
    }

    .report-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 15px;
      font-size: 9pt;
    }

    .report-table th {
      background-color: #f2f2f2 !important;
      border: 1px solid #000;
      padding: 8px 4px;
      font-weight: bold;
      text-align: center;
    }

    .report-table td {
      border: 1px solid #000;
      padding: 6px 4px;
      vertical-align: middle;
    }

    .text-right { text-align: right !important; }
    .text-center { text-align: center !important; }
    .font-bold { font-weight: bold !important; }

    @media print {
      .a4-report-wrapper { padding: 15mm 12mm; }
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
