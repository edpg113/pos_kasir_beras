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
    : "-";

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
              <th>Produk</th>
              <th className="qty-cell">Qty</th>
              <th>Harga Beli</th>
              <th>Harga/1kg</th>
              <th>Subtotal</th>
              <th>Kuli</th>
              <th>Sopir</th>
              <th>DP</th>
              <th>Total (Net)</th>
              <th>Supplier</th>
            </tr>
          </thead>
          <tbody>
            {historyData &&
              historyData.map((item) => (
                <tr key={item.id}>
                  <td style={{ fontWeight: 600 }}>{item.namaProduk}</td>
                  <td className="qty-cell">{item.qty}</td>
                  <td>
                    {item.total_harga_produk
                      ? Number(item.total_harga_produk).toLocaleString("id-ID")
                      : item.modal
                        ? Number(item.modal).toLocaleString("id-ID")
                        : "-"}
                  </td>
                  <td>
                    {item.harga_per_kg
                      ? Number(item.harga_per_kg).toLocaleString("id-ID")
                      : "-"}
                  </td>
                  <td>
                    {item.subtotal
                      ? Number(item.subtotal).toLocaleString("id-ID")
                      : item.total_harga_produk && item.qty
                        ? Number(
                            item.total_harga_produk * item.qty,
                          ).toLocaleString("id-ID")
                        : "-"}
                  </td>
                  <td>
                    {item.biaya_kuli
                      ? Number(item.biaya_kuli).toLocaleString("id-ID")
                      : "0"}
                  </td>
                  <td>
                    {item.biaya_sopir
                      ? Number(item.biaya_sopir).toLocaleString("id-ID")
                      : "0"}
                  </td>
                  <td>
                    {item.dp ? Number(item.dp).toLocaleString("id-ID") : "0"}
                  </td>
                  <td>
                    {item.total
                      ? Number(item.total).toLocaleString("id-ID")
                      : "-"}
                  </td>
                  <td>{item.tujuan}</td>
                </tr>
              ))}
          </tbody>
          <tfoot>
            <tr>
              <td
                colSpan={1}
                style={{ textAlign: "right", fontWeight: "bold" }}
              >
                Total Qty:
              </td>
              <td className="qty-cell" style={{ fontWeight: "bold" }}>
                {totalQty}
              </td>
              <td
                colSpan={6}
                style={{ textAlign: "right", fontWeight: "bold" }}
              >
                Total Bayar (Net):
              </td>
              <td style={{ fontWeight: "bold" }}>
                {Number(totalModal).toLocaleString("id-ID")}
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
    * {
      box-sizing: border-box;
    }
    body { font-family: 'Inter', sans-serif; margin: 0; padding: 0; }
    .po-report {
      font-family: 'Inter', sans-serif;
      color: #333;
      line-height: 1.6;
      background-color: white;
      padding: 0;
      max-width: 210mm;
      margin: 0 auto;
      width: 100%;
    }
    .po-report .header {
      text-align: center;
      margin-bottom: 20px;
      border-bottom: 2px solid #3498db;
      padding-bottom: 15px;
    }
    .po-report .header h1 {
      font-size: 20px;
      margin-bottom: 5px;
      font-weight: bold;
      margin-top: 0;
      text-transform: uppercase;
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
      font-size: 10px;
    }
      .po-report .po-table tr {
      page-break-inside: avoid;
    }
    .po-report .po-table th {
      font-size: 10px;
      font-weight: 600;
      background-color: #f0f0f0;
      padding: 4px;
      text-align: left;
      border: 1px solid #ddd;
    }
    .po-report .po-table td {
      padding: 4px;
      border: 1px solid #ddd;
      vertical-align: top;
      font-size: 10px;
    }
    .po-report .po-table td.qty-cell {
      text-align: center;
    }
    .po-report .po-table tr:nth-child(even) {
      background-color: #f9f9f9;
    }
    .po-report .footer {
      margin-top: 15px;
      font-size: 11px;
      text-align: center;
    }
    .po-report .footer p {
      margin: 5px 0;
    }
    @media print {
    body {
    margin:0;
    }
      .po-report { padding: 20px; max-width: 210mm; }
      .po-report .footer {
        page-break-inside: avoid;
      }
        table {
          font-size: 10px;
        }
          th, td {
          padding: 4px;
          }
          tr {
            page-break-inside: avoid;
          }
      @page {
        size: A4;
        margin: 10mm;
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
