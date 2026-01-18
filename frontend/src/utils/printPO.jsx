import React from "react";
import ReactDOMServer from "react-dom/server";
const POReportTemplate = ({ storeSettings, historyData, filterDate }) => {
  const { namaToko, alamat } = storeSettings || {};
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
    <div className="po-report">
      <div className="header">
        <h1>Laporan PO Barang</h1>
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
      <div className="po-table">
        <table border="1" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th>Waktu</th>
              <th>Nama Produk</th>
              <th className="qty-cell">Qty</th>
              <th>Harga/1kg</th>
              <th>Modal/krg</th>
              <th>Total</th>
              <th>Supplier</th>
              <th>Keterangan</th>
            </tr>
          </thead>
          <tbody>
            {historyData &&
              historyData.map((item) => (
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
                      ? `Rp. ${Number(item.harga_per_kg).toLocaleString(
                          "id-ID",
                        )}`
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
        </div>
      </div>
    </div>
  );
};

export const printPOReport = (storeSettings, historyData, filterDate) => {
  const htmlContent = ReactDOMServer.renderToStaticMarkup(
    <POReportTemplate
      storeSettings={storeSettings}
      historyData={historyData}
      filterDate={filterDate}
    />,
  );

  const styles = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap');
    body { font-family: 'Inter', sans-serif; margin: 0; padding: 0; }
    .po-report {
      font-family: 'Inter', sans-serif;
      color: #333;
      line-height: 1.6;
      background-color: white;
      padding: 20px;
    }
    .po-report .header {
      text-align: center;
      margin-bottom: 20px;
      border-bottom: 2px solid #333;
      padding-bottom: 15px;
    }
    .po-report .header h1 {
      font-size: 20px;
      margin-bottom: 5px;
      font-weight: bold;
      margin-top: 0;
    }
    .po-report .store-info {
      font-size: 12px;
      color: #666;
    }
    .po-report .report-meta {
      display: flex;
      justify-content: space-between;
      margin: 20px 0;
      font-size: 12px;
    }
    .po-report .meta-item {
      padding: 5px 0;
    }
    .po-report .meta-item span {
      font-weight: bold;
    }
    .po-report .po-table {
      margin: 20px 0;
    }
    .po-report .po-table table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }
    .po-report .po-table th {
      background-color: #f0f0f0;
      padding: 10px;
      text-align: left;
      border: 1px solid #ddd;
      font-weight: bold;
    }
    .po-report .po-table td {
      padding: 10px;
      border: 1px solid #ddd;
      vertical-align: top;
    }
    .po-report .po-table td.qty-cell {
      text-align: center;
    }
    .po-report .po-table tr:nth-child(even) {
      background-color: #f9f9f9;
    }
    .po-report .footer {
      margin-top: 30px;
      border-top: 1px solid #ddd;
      padding-top: 15px;
      font-size: 12px;
      text-align: center;
      color: #666;
    }
    .po-report .footer p {
      margin: 5px 0;
    }
    @media print {
      .po-report .footer {
        page-break-inside: avoid;
      }
    }
  `;

  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(`
      <html>
        <head>
          <title>Cetak Laporan PO Barang</title>
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
