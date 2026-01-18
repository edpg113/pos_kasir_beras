import React from "react";
import ReactDOMServer from "react-dom/server";

const InventoryTemplate = ({ storeSettings, inventory }) => {
  const { namaToko, alamat } = storeSettings || {
    namaToko: "POS Kasir Beras",
    alamat: "-",
  };

  const dateStr = new Date().toLocaleString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="inventory-report">
      <div className="header">
        <h1>{namaToko}</h1>
        <p>{alamat}</p>
        <h2 style={{ marginTop: "10px", textTransform: "uppercase" }}>
          LAPORAN INVENTORY
        </h2>
        <p>Tanggal: {dateStr}</p>
      </div>

      <table className="inventory-table">
        <thead>
          <tr>
            <th>Produk</th>
            <th className="text-right">Stok (kg)</th>
            <th className="text-right">Harga/1kg</th>
            <th className="text-right">Total Modal Produk</th>
            <th className="text-right">Total Bayar (Setelah Potongan)</th>
            <th className="text-right">Reorder</th>
            <th>Supplier</th>
          </tr>
        </thead>
        <tbody>
          {inventory.map((item, i) => (
            <tr key={i}>
              <td>
                <div style={{ fontWeight: "bold" }}>{item.produk}</div>
                {(item.lastBiayaKuli > 0 ||
                  item.lastBiayaSopir > 0 ||
                  item.lastDP > 0) && (
                  <div className="cost-details">
                    {item.lastBiayaKuli > 0 && (
                      <span>
                        Kuli: Rp
                        {Number(item.lastBiayaKuli).toLocaleString(
                          "id-ID",
                        )}{" "}
                      </span>
                    )}
                    {item.lastBiayaSopir > 0 && (
                      <span>
                        Sopir: Rp
                        {Number(item.lastBiayaSopir).toLocaleString(
                          "id-ID",
                        )}{" "}
                      </span>
                    )}
                    {item.lastDP > 0 && (
                      <span>
                        DP: Rp{Number(item.lastDP).toLocaleString("id-ID")}
                      </span>
                    )}
                  </div>
                )}
              </td>
              <td className="text-right">
                {item.stok != null ? item.stok : "-"}
              </td>
              <td className="text-right">
                {item.harga_per_kg
                  ? Number(item.harga_per_kg).toLocaleString("id-ID")
                  : "-"}
              </td>
              <td className="text-right">
                {item.lastTotalProduk
                  ? Number(item.lastTotalProduk).toLocaleString("id-ID")
                  : "-"}
              </td>
              <td className="text-right" style={{ fontWeight: "bold" }}>
                {item.lastTotal
                  ? Number(item.lastTotal).toLocaleString("id-ID")
                  : "-"}
              </td>
              <td className="text-right">
                {item.reorder != null ? item.reorder : "-"}
              </td>
              <td>{item.supplier || "-"}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={{ background: "#f9f9f9", fontWeight: "bold" }}>
            <td colSpan="1" style={{ textAlign: "right", padding: "10px" }}>
              TOTAL STOK:
            </td>
            <td style={{ textAlign: "right", padding: "10px" }}>
              {inventory
                .reduce((sum, item) => sum + (Number(item.stok) || 0), 0)
                .toLocaleString("id-ID")}{" "}
              kg
            </td>
            <td colSpan="1"></td>
            <td style={{ textAlign: "right", padding: "10px" }}>
              Total Modal Produk: Rp{" "}
              {inventory
                .reduce(
                  (sum, item) => sum + (Number(item.lastTotalProduk) || 0),
                  0,
                )
                .toLocaleString("id-ID")}
            </td>
            <td style={{ textAlign: "right", padding: "10px" }}>
              Total Bayar: Rp {""}
              {inventory
                .reduce((sum, item) => sum + (Number(item.lastTotal) || 0), 0)
                .toLocaleString("id-ID")}
            </td>
            <td style={{ textAlign: "right", padding: "10px" }}>
              Total Reorder:{" "}
              {inventory
                .reduce((sum, item) => sum + (Number(item.reorder) || 0), 0)
                .toLocaleString("id-ID")}
            </td>
          </tr>
        </tfoot>
      </table>

      <div className="footer">
        <p>Laporan ini dihasilkan otomatis oleh sistem.</p>
      </div>
    </div>
  );
};

export const printInventory = (storeSettings, inventory) => {
  if (!inventory || !Array.isArray(inventory)) {
    alert("Data inventory tidak tersedia untuk dicetak.");
    return;
  }

  const htmlContent = ReactDOMServer.renderToStaticMarkup(
    <InventoryTemplate storeSettings={storeSettings} inventory={inventory} />,
  );

  const inventoryStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap');
    body { font-family: 'Inter', sans-serif; margin: 0; padding: 0; background-color: white; color: #333; }
    .inventory-report { padding: 20px; }
    .inventory-report .header { text-align: center; margin-bottom: 20px; }
    .inventory-report .header h1 { margin: 0; font-size: 20px; }
    .inventory-report .header h2 { margin: 5px 0; font-size: 16px; border-top: 1px solid #333; padding-top: 10px; }
    .inventory-report .header p { margin: 2px 0; font-size: 12px; }
    .inventory-report .inventory-table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 15px; }
    .inventory-report .inventory-table th { background-color: #f0f0f0; padding: 8px; border: 1px solid #ddd; text-align: left; }
    .inventory-report .inventory-table td { padding: 8px; border: 1px solid #eee; vertical-align: top; }
    .inventory-report .inventory-table .text-right { text-align: right; }
    .inventory-report .inventory-table .cost-details { font-size: 9px; color: #666; margin-top: 4px; }
    .inventory-report .footer { margin-top: 20px; font-size: 11px; text-align: center; color: #999; }
    @media print {
      body { background-color: white !important; }
      @page { margin: 10mm; }
      .inventory-report .inventory-table th { background-color: #f0f0f0 !important; -webkit-print-color-adjust: exact; }
    }
  `;

  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(`
      <html>
        <head>
          <title>Cetak Laporan Inventory</title>
          <style>
             ${inventoryStyles}
          </style>
        </head>
        <body>
          ${htmlContent}
          <script>
            window.onload = function() { setTimeout(() => { window.print(); }, 500); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }
};

export default printInventory;
