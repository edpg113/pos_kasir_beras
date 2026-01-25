import React from "react";
import ReactDOMServer from "react-dom/server";

const PengeluaranTemplate = ({ storeSettings, history, totals, month }) => {
  const { namaToko, alamat } = storeSettings || {};
  const today = new Date().toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const [year, mon] = month.split("-");
  const monthNames = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];
  const periodeStr = `${monthNames[parseInt(mon) - 1]} ${year}`;

  return (
    <div className="print-pengeluaran">
      <div className="header">
        <h1>LAPORAN PENGELUARAN & KAS MASUK</h1>
        <div className="divider" />
        <p className="period">Periode: {periodeStr}</p>
      </div>

      <div className="store-info">
        <p>
          <strong>{namaToko}</strong>
        </p>
        <p>{alamat}</p>
      </div>
      <h2
        style={{
          "font-size": "18px",
          "margin-bottom": "15px",
          color: "#1e3a8a",
        }}
      >
        Ringkasan
      </h2>
      <div className="summary-grid">
        <div className="summary-card">
          <p className="label">Total Kas Masuk</p>
          <p className="value">
            Rp {Number(totals.modal).toLocaleString("id-ID")}
          </p>
        </div>
        <div className="summary-card">
          <p className="label">Total Pengeluaran</p>
          <p className="value">
            Rp {Number(totals.keluar).toLocaleString("id-ID")}
          </p>
        </div>
        <div className="summary-card">
          <p className="label">Sisa Kas</p>
          <p className="value">
            Rp {Number(totals.sisa).toLocaleString("id-ID")}
          </p>
        </div>
      </div>

      <div className="history-table">
        <h2>Riwayat Transaksi</h2>
        <table>
          <thead>
            <tr>
              <th>Tanggal/Jam</th>
              <th>Keterangan</th>
              <th className="text-right">Masuk</th>
              <th className="text-right">Keluar</th>
            </tr>
          </thead>
          <tbody>
            {history.map((record, index) => (
              <tr key={index}>
                <td>
                  {new Date(record.tanggal).toLocaleDateString("id-ID")}{" "}
                  {new Date(record.tanggal).toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
                <td>
                  {record.keterangan ||
                    (record.modal > 0 ? "Tambah Modal" : "-")}
                </td>
                <td className="text-right text-green">
                  {record.modal > 0
                    ? `+ Rp ${Number(record.modal).toLocaleString("id-ID")}`
                    : "-"}
                </td>
                <td className="text-right text-red">
                  {record.keluar > 0
                    ? `- Rp ${Number(record.keluar).toLocaleString("id-ID")}`
                    : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="footer">
        <p>Dicetak pada: {today}</p>
      </div>
    </div>
  );
};

export const printPengeluaran = (storeSettings, history, totals, month) => {
  const htmlContent = ReactDOMServer.renderToStaticMarkup(
    <PengeluaranTemplate
      storeSettings={storeSettings}
      history={history}
      totals={totals}
      month={month}
    />,
  );

  const styles = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
    
    // * { 
    //   margin: 0; 
    //   padding: 0; 
    //   box-sizing: border-box; 
    // }

    body { 
      font-family: 'Inter', sans-serif; 
      color: #1f2937; 
      margin: 0;
      padding: 0;
    }
    
    .print-pengeluaran { 
      width: 100%; 
      max-width: 210mm; 
      margin: 0 auto; 
      padding: 10mm;
    }
    
    .header { 
      text-align: center; 
      margin-bottom: 25px; 
    }

    .header h1 { 
      font-size: 22px; 
      color: #1e3a8a; 
      margin-bottom: 8px;
    }

    .header .divider { 
      height: 3px; 
      background: #c7d2fe; 
      margin: 12px 0; 
    }

    .header .period { 
      font-size: 14px; 
      color: #64748b; 
    }

    .store-info { 
      margin-bottom: 30px; 
      line-height: 1.5; 
      font-size: 14px; 
    }

    .summary-grid { 
    //   display: grid; 
    //   grid-template-columns: repeat(3, 1fr); 
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
      gap: 10px; 
      margin-bottom: 30px; 
    }

    .summary-card { 
      padding: 10px; 
      background: #f8fafc; 
      border-radius: 8px; 
      border: 1px solid #e2e8f0; 
      width: 100%;
      max-width: 200px;
    }

    .summary-card .label { 
      font-size: 12px; 
      color: #64748b; 
      margin-bottom: 5px; 
      font-weight: 600; 
    }

    .summary-card .value { 
      font-size: 16px; 
      font-weight: 700; 
      color: #1e3a8a; 
    }

    .history-table h2 { 
      font-size: 18px; 
      margin-bottom: 15px; 
      color: #1e3a8a; 
    }

    table { 
      width: 100%; 
      border-collapse: collapse; 
      margin-bottom: 30px; 
    }

    th { 
      background: #f1f5f9; 
      padding: 10px; 
      text-align: left; 
      font-size: 13px; 
      font-weight: 700; 
      border-bottom: 2px solid #e2e8f0; 
    }

    td { 
      padding: 10px; 
      font-size: 12px; 
      border-bottom: 1px solid #f1f5f9; 
      font-weight: 600;
    }
    
    // .text-right { text-align: right; }
    .text-green { color: #10b981; font-weight: 600; }
    .text-red { color: #ef4444; font-weight: 600; }

    .footer { 
      margin-top: 40px; 
      font-size: 12px; 
      color: #64748b; 
      border-top: 1px solid #e2e8f0; 
      padding-top: 10px; 
    }

    @media print {
      body { padding: 0; }
      .print-pengeluaran { max-width: 210mm; }
    }
  `;
  const printWindow = window.open("", "_blank");

  if (printWindow) {
    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="id">
        <head>
          <meta charset="UTF-8" />
          <title>Cetak Laporan Pengeluaran</title>
          <style>${styles}</style>
        </head>
        <body>
          <div class="print-container">
            ${htmlContent}
          </div>
          <script>
            window.onload = function() {
              setTimeout(() => {
                window.print();
                // window.close();
              }, 500);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }
};
