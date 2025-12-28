import React from "react";
import ReactDOMServer from "react-dom/server";
import "./printShipment.scss";

const ShipmentReportTemplate = ({ storeSettings, historyData, filterDate }) => {
  const { namaToko, alamat } = storeSettings;
  const today = new Date().toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const displayDate = filterDate
    ? new Date(filterDate).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "Semua Tanggal";

  return (
    <div className="shipment-report">
      <div className="header">
        <h1>Laporan Pengiriman Barang</h1>
        <div className="store-info">
          {namaToko} | {alamat}
        </div>
      </div>

      <div className="report-meta">
        <div className="meta-item">
          <span>Tanggal Laporan:</span> {today}
        </div>
        <div className="meta-item">
          <span>Filter Tanggal:</span> {displayDate}
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Waktu</th>
            <th>Nama Produk</th>
            <th className="qty-cell">Qty</th>
            <th>Tujuan</th>
            <th>Keterangan</th>
          </tr>
        </thead>
        <tbody>
          {historyData.map((item) => (
            <tr key={item.id}>
              <td>
                {new Date(item.tanggal).toLocaleTimeString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </td>
              <td style={{ fontWeight: 600 }}>{item.namaProduk}</td>
              <td className="qty-cell">{item.qty}</td>
              <td>{item.tujuan}</td>
              <td>{item.keterangan || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="footer">
        <div className="signature-box">
          <p>Dicetak pada: {today}</p>
          <div className="line" />
          <div className="name">Petugas Gudang</div>
        </div>
      </div>
    </div>
  );
};

export const printShipmentReport = (storeSettings, historyData, filterDate) => {
  const htmlContent = ReactDOMServer.renderToStaticMarkup(
    <ShipmentReportTemplate
      storeSettings={storeSettings}
      historyData={historyData}
      filterDate={filterDate}
    />
  );

  const styles = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap');
    body { font-family: 'Inter', sans-serif; margin: 0; padding: 0; }
  `;

  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(`
      <html>
        <head>
          <title>Cetak Laporan Pengiriman</title>
          <style>
             ${styles}
          </style>
        </head>
        <body>
          <div style="background-color: white; padding: 20px;">
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
