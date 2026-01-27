import React from "react";
import ReactDOMServer from "react-dom/server";

const ReportTemplate = ({ storeSettings, reportData, startDate, endDate }) => {
  const { namaToko, alamat } = storeSettings || {};
  const today = new Date().toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const {
    salesDetails = [],
    newPiutang = [],
    payments = [],
    overallPiutang = 0,
  } = reportData || {};

  // Calculate totals
  const totalPenjualan = salesDetails.reduce(
    (sum, row) => sum + (Number(row.subtotal) || 0),
    0,
  );
  const totalUntung = salesDetails.reduce(
    (sum, row) => sum + (Number(row.keuntungan) || 0),
    0,
  );
  const totalPiutangBaru = newPiutang.reduce(
    (sum, row) => sum + (Number(row.total) || 0),
    0,
  );
  const totalBayarPiutang = payments.reduce(
    (sum, row) => sum + (Number(row.jumlah) || 0),
    0,
  );

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const displayPeriod =
    startDate === endDate
      ? formatDate(startDate)
      : `${formatDate(startDate)} - ${formatDate(endDate)}`;

  return (
    <div className="report-document">
      <div className="report-header">
        <h1>Laporan Penjualan dan Piutang</h1>
        <div className="divider" />
        <div className="date-info">Tanggal: {displayPeriod}</div>
      </div>

      <div className="store-info-section">
        <div className="store-name">
          {namaToko},
          <br />
          {alamat}
        </div>
      </div>

      {/* Ringkasan */}
      <div className="summary-section">
        <h2>Ringkasan</h2>
        <div className="summary-grid">
          <div className="summary-row">
            <div className="summary-item">
              <span className="label">Total Penjualan:</span>
              <span className="value">
                Rp {totalPenjualan.toLocaleString("id-ID")}
              </span>
            </div>
            <div className="summary-item">
              <span className="label">Total keuntungan:</span>
              <span className="value">
                Rp {totalUntung.toLocaleString("id-ID")}
              </span>
            </div>
          </div>
          <div className="summary-row">
            <div className="summary-item">
              <span className="label">Pembayaran Piutang:</span>
              <span className="value">
                Rp {totalBayarPiutang.toLocaleString("id-ID")}
              </span>
            </div>
            <div className="summary-item">
              <span className="label">Piutang Baru:</span>
              <span className="value">
                Rp {totalPiutangBaru.toLocaleString("id-ID")}
              </span>
            </div>
          </div>
          <div className="summary-row full-width">
            <div className="summary-item total">
              <span className="label">Saldo Piutang Akhir:</span>
              <span className="value">
                Rp {Number(overallPiutang).toLocaleString("id-ID")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Rincian Penjualan Hari Ini */}
      <div className="report-section">
        <h2>Rincian Penjualan</h2>
        <table className="report-table">
          <thead>
            <tr>
              <th>Produk</th>
              <th>Jumlah Terjual</th>
              <th>Total Penjualan</th>
              <th>Keuntungan</th>
            </tr>
          </thead>
          <tbody>
            {salesDetails.length > 0 ? (
              <>
                {salesDetails.map((row, idx) => (
                  <tr key={idx}>
                    <td>{row.namaProduk}</td>
                    <td className="text-center">{row.qty} karung</td>
                    <td className="text-right">
                      Rp {Number(row.subtotal).toLocaleString("id-ID")}
                    </td>
                    <td className="text-right">
                      Rp {Number(row.keuntungan).toLocaleString("id-ID")}
                    </td>
                  </tr>
                ))}
                <tr className="total-row">
                  <td colSpan={1}>
                    <strong>Total</strong>
                  </td>
                  <td className="text-center">
                    <strong>
                      {salesDetails.reduce(
                        (sum, row) => sum + Number(row.qty),
                        0,
                      )}{" "}
                      karung
                    </strong>
                  </td>
                  <td className="text-right">
                    <strong>Rp {totalPenjualan.toLocaleString("id-ID")}</strong>
                  </td>
                  <td className="text-right">
                    <strong>Rp {totalUntung.toLocaleString("id-ID")}</strong>
                  </td>
                </tr>
              </>
            ) : (
              <tr>
                <td colSpan="3" className="text-center">
                  Tidak ada penjualan
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Piutang Baru Hari Ini */}
      <div className="report-section">
        <h2>Piutang Baru</h2>
        <table className="report-table">
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>Pelanggan</th>
              <th>Produk Diutang</th>
              <th>Total Piutang</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {newPiutang.length > 0 ? (
              newPiutang.map((row, idx) => (
                <tr key={idx}>
                  <td>{new Date(row.tanggal).toLocaleDateString("id-ID")}</td>
                  <td>{row.nama_pelanggan}</td>
                  <td>{row.produk}</td>
                  <td className="text-right">
                    Rp {Number(row.total).toLocaleString("id-ID")}
                  </td>
                  <td className="text-center">{row.status}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center">
                  Tidak ada piutang baru
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pembayaran Piutang Hari Ini */}
      <div className="report-section">
        <h2>Pembayaran Piutang</h2>
        <table className="report-table">
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>Pelanggan</th>
              <th>Jumlah Dibayar</th>
              <th>Metode Pembayaran</th>
            </tr>
          </thead>
          <tbody>
            {payments.length > 0 ? (
              payments.map((row, idx) => (
                <tr key={idx}>
                  <td>{new Date(row.tanggal).toLocaleDateString("id-ID")}</td>
                  <td>{row.nama_pelanggan}</td>
                  <td className="text-right">
                    Rp {Number(row.jumlah).toLocaleString("id-ID")}
                  </td>
                  <td className="text-center">{row.metode}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" className="text-center">
                  Tidak ada pembayaran piutang
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const printReport = (storeSettings, reportData, startDate, endDate) => {
  if (!reportData || !storeSettings) {
    alert("Data laporan atau setting toko belum siap cetak.");
    return;
  }

  const htmlContent = ReactDOMServer.renderToStaticMarkup(
    <ReportTemplate
      storeSettings={storeSettings}
      reportData={reportData}
      startDate={startDate}
      endDate={endDate}
    />,
  );

  const styles = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', sans-serif;
      background: #f9fafb;
    }
    
    .report-document {
      max-width: 900px;
      margin: 0 auto;
      background: white;
      padding: 30px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      color: #1f2937;
      font-size: 13px;
    }
    
    /* ================= HEADER ================= */
    .report-header {
      text-align: center;
      margin-bottom: 12px;
    }
    
    .report-header h1 {
      font-size: 22px;
      font-weight: 700;
      color: #1e3a8a;
      margin-bottom: 6px;
    }
    
    .report-header .divider {
      height: 2px;
      background: #c7d2fe;
      margin: 6px 0;
    }
    
    .report-header .date-info {
      font-size: 13px;
      color: #374151;
    }
    
    /* ================= STORE INFO ================= */
    .store-info-section {
      margin: 14px 0 18px;
      line-height: 1.5;
    }
    
    .store-info-section .store-name {
      font-weight: 600;
    }
    
    /* ================= SECTION TITLE ================= */
    h2 {
      font-size: 16px;
      font-weight: 700;
      color: #1e3a8a;
      margin: 20px 0 10px;
      border-bottom: 2px solid #c7d2fe;
      padding-bottom: 4px;
    }
    
    /* ================= SUMMARY ================= */
    .summary-section {
      margin-top: 10px;
    }
    
    .summary-grid {
      border: 1px solid #c7d2fe;
      border-radius: 6px;
      overflow: hidden;
    }
    
    .summary-row {
      display: flex;
      border-bottom: 1px solid #e5e7eb;
    }
    
    .summary-row:last-child {
      border-bottom: none;
    }
    
    .summary-row.full-width {
      background: #eff6ff;
    }
    
    .summary-item {
      flex: 1;
      padding: 10px 14px;
      display: flex;
      justify-content: space-between;
      font-weight: 600;
    }
    
    .summary-item .label {
      color: #374151;
    }
    
    .summary-item .value {
      color: #1e3a8a;
    }
    
    .summary-item.total {
      font-size: 14px;
    }
    
    /* ================= TABLE ================= */
    .report-section {
      margin-top: 18px;
    }
    
    .report-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 6px;
      font-size: 13px;
    }

    .report-table tr {
      page-break-inside: avoid;
    }
    
    .report-table th {
      background: #1e3a8a;
      color: #ffffff;
      padding: 8px;
      text-align: center;
      font-weight: 600;
      border: 1px solid #1e40af;
    }
    
    .report-table td {
      border: 1px solid #e5e7eb;
      padding: 8px;
    }
    
    .report-table tr:nth-child(even) {
      background: #f9fafb;
    }
    
    .report-table .total-row {
      background: #eff6ff;
      font-weight: 700;
    }
    
    /* ================= ALIGN ================= */
    .text-center {
      text-align: center;
    }
    
    .text-right {
      text-align: right;
    }
    
    /* ================= PRINT ================= */
    @media print {
      body {
        background: white;
        padding: 0;
      }
    
      
      @page {
        size: A4;
        margin: 15mm;
      }
    }
  `;

  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(`
      <html>
        <head>
          <title>Cetak Laporan Kasir</title>
          <style>
             ${styles}
          </style>
        </head>
        <body>
          ${htmlContent}
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
