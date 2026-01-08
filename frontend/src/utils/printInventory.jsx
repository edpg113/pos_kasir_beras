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
    <div style={{ fontFamily: "Arial, sans-serif", fontSize: 12, color: "#222" }}>
      <div style={{ textAlign: "center", marginBottom: 8 }}>
        <div style={{ fontSize: 16, fontWeight: 700 }}>{namaToko}</div>
        <div style={{ fontSize: 12 }}>{alamat}</div>
        <div style={{ marginTop: 8, fontWeight: 700 }}>LAPORAN INVENTORY</div>
        <div style={{ fontSize: 11 }}>{`Tanggal: ${dateStr}`}</div>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
        <thead>
          <tr>
            <th style={{ border: "1px solid #ddd", padding: 6, textAlign: "left" }}>Produk</th>
            <th style={{ border: "1px solid #ddd", padding: 6, textAlign: "right" }}>Stok (kg)</th>
            <th style={{ border: "1px solid #ddd", padding: 6, textAlign: "right" }}>Harga/1kg</th>
            <th style={{ border: "1px solid #ddd", padding: 6, textAlign: "right" }}>Last Total</th>
            {/* <th style={{ border: "1px solid #ddd", padding: 6, textAlign: "right" }}>Min Stok</th> */}
            <th style={{ border: "1px solid #ddd", padding: 6, textAlign: "right" }}>Reorder</th>
            <th style={{ border: "1px solid #ddd", padding: 6, textAlign: "left" }}>Supplier</th>
          </tr>
        </thead>
        <tbody>
          {inventory.map((item, i) => (
            <tr key={i}>
              <td style={{ border: "1px solid #eee", padding: 6 }}>{item.produk}</td>
              <td style={{ border: "1px solid #eee", padding: 6, textAlign: "right" }}>{item.stok != null ? item.stok : "-"}</td>
              <td style={{ border: "1px solid #eee", padding: 6, textAlign: "right" }}>{item.harga_per_kg ? Number(item.harga_per_kg).toLocaleString('id-ID') : "-"}</td>
              <td style={{ border: "1px solid #eee", padding: 6, textAlign: "right" }}>{item.lastTotal ? Number(item.lastTotal).toLocaleString('id-ID') : (item.reorder && item.lastHargaBeli ? Number(item.reorder * item.lastHargaBeli).toLocaleString('id-ID') : "-")}</td>
              {/* <td style={{ border: "1px solid #eee", padding: 6, textAlign: "right" }}>{item.minStok != null ? item.minStok : "-"}</td> */}
              <td style={{ border: "1px solid #eee", padding: 6, textAlign: "right" }}>{item.reorder != null ? item.reorder : "-"}</td>
              <td style={{ border: "1px solid #eee", padding: 6 }}>{item.supplier || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: 12, fontSize: 11 }}>Laporan ini dihasilkan otomatis oleh sistem.</div>
    </div>
  );
};

export const printInventory = (storeSettings, inventory) => {
  if (!inventory || !Array.isArray(inventory)) {
    alert("Data inventory tidak tersedia untuk dicetak.");
    return;
  }

  const htmlContent = ReactDOMServer.renderToStaticMarkup(
    <InventoryTemplate storeSettings={storeSettings} inventory={inventory} />
  );

  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(`
      <html>
        <head>
          <title>Cetak Laporan Inventory</title>
          <style>
            body { margin: 10px; }
            @media print { @page { size: auto; margin: 10mm; } }
          </style>
        </head>
        <body>
          ${htmlContent}
          <script>
            window.onload = function() { setTimeout(() => { window.print(); }, 300); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }
};

export default printInventory;
