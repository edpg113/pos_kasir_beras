import React from "react";
import ReactDOMServer from "react-dom/server";
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

  const totalQty = historyData
    ? historyData.reduce((sum, item) => sum + (Number(item.qty) || 0), 0)
    : 0;

  const totalModal = historyData
    ? historyData.reduce((sum, item) => sum + (Number(item.total) || 0), 0)
    : 0;

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
      <div className="shipment-table">
        <table border="1" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th>Waktu</th>
              <th>Nama Produk</th>
              <th className="qty-cell">Qty</th>
              <th>Harga/1kg</th>
              <th>Modal/krg</th>
              <th>Total</th>
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
                <td>
                  {item.harga_per_kg
                    ? `Rp. ${Number(item.harga_per_kg).toLocaleString("id-ID")}`
                    : "-"}
                </td>
                <td>
                  {item.modal
                    ? `Rp. ${Number(item.modal).toLocaleString("id-ID")}`
                    : "-"}
                </td>
                <td>
                  {item.total
                    ? `Rp. ${Number(item.total).toLocaleString("id-ID")}`
                    : "-"}
                </td>
                <td>{item.tujuan}</td>
                <td>{item.keterangan || "-"}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td
                colSpan={2}
                style={{ textAlign: "right", fontWeight: "bold" }}
              >
                Total Qty:
              </td>
              <td className="qty-cell" style={{ fontWeight: "bold" }}>
                {totalQty}
              </td>
              <td
                colSpan={2}
                style={{ textAlign: "right", fontWeight: "bold" }}
              >
                Total Modal:
              </td>
              <td style={{ fontWeight: "bold" }}>
                {`Rp. ${Number(totalModal).toLocaleString("id-ID")}`}
              </td>
              <td colSpan={2}></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="footer">
        <div className="signature-box">
          <p>Dicetak pada: {today}</p>
          <div className="line" />
          {/* <div className="name">Petugas Gudang</div> */}
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
    />,
  );

  const styles = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap');
    body { font-family: 'Inter', sans-serif; margin: 0; padding: 0; background-color: white; }
    .shipment-report {
      width: 100%;
      max-width: 800px;
      margin: 0 auto;
      padding: 30px;
      background-color: white;
      color: #333;
    }
    .shipment-report .header {
      text-align: center;
      margin-bottom: 30px;
      border-bottom: 2px solid #3498db;
      padding-bottom: 20px;
    }
    .shipment-report .header h1 {
      margin: 0;
      color: #2c3e50;
      font-size: 24px;
      text-transform: uppercase;
    }
    .shipment-report .header .store-info {
      margin-top: 5px;
      font-size: 14px;
      color: #7f8c8d;
    }
    .shipment-report .report-meta {
      display: flex;
      justify-content: space-between;
      margin-bottom: 40px;
      font-size: 14px;
    }
    .shipment-report .meta-item span {
      font-weight: 600;
      color: #2c3e50;
    }
    .shipment-report .shipment-table {
      margin-bottom: 30px;
    }
    .shipment-report .shipment-table table {
      width: 100%;
      border-collapse: collapse;
    }
    .shipment-report .shipment-table th {
      background-color: #f8f9fa;
      color: #2c3e50;
      font-weight: 600;
      text-align: left;
      padding: 12px;
      border-bottom: 2px solid #dee2e6;
    }
    .shipment-report .shipment-table td {
      padding: 12px 16px;
      border-bottom: 1px solid #eee;
      font-size: 14px;
    }
    .shipment-report .shipment-table .qty-cell {
      text-align: center;
    }
    .shipment-report .footer {
      margin-top: 50px;
      display: flex;
      justify-content: flex-end;
    }
    .shipment-report .signature-box {
      text-align: center;
      width: 200px;
    }
    .shipment-report .signature-box p {
      margin-bottom: 60px;
      font-size: 14px;
    }
    .shipment-report .signature-box .line {
      border-top: 1px solid #333;
      width: 100%;
    }
    @media print {
      body { background-color: white !important; }
      .shipment-report { padding: 20px; max-width: 100%; }
    }
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
