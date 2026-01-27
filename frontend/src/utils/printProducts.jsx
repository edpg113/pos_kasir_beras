import React from "react";
import ReactDOMServer from "react-dom/server";
const ProductsTemplate = ({ storeSettings, products }) => {
  const { namaToko, alamat } = storeSettings || {};

  const dateStr = new Date().toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  // Helper to compute harga per kg from modal and kategori
  const computeHargaPerKg = (modalVal, kategoriVal) => {
    const hb = parseFloat(modalVal || 0);
    if (!kategoriVal) return "";
    const m = String(kategoriVal).match(/(\d+(?:\.\d+)?)/);
    const qty = m ? parseFloat(m[0]) : NaN;
    const divisor = !isNaN(qty) && qty > 0 ? qty : 1;
    if (hb === 0) return "";
    return Math.round((hb / divisor) * 100) / 100;
  };

  // Calculate grand totals
  const grandTotalStok = products.reduce(
    (sum, product) => sum + (Number(product.stok) || 0),
    0,
  );
  const grandTotalModal = products.reduce(
    (sum, product) =>
      sum + (Number(product.modal) || 0) * (Number(product.stok) || 0),
    0,
  );

  return (
    <div className="products-print">
      <div className="header">
        <h1 style={{ marginTop: "10px", fontWeight: "bold" }}>
          LAPORAN PRODUK, STOK DAN MODAL
        </h1>
        <p className="title">{namaToko}</p>
        <p className="small">{alamat}</p>
        <p className="small">Tanggal: {dateStr}</p>
      </div>

      <div className="table-container">
        <table className="products-table">
          <thead>
            <tr>
              <th style={{ width: "20%" }}>Nama Produk</th>
              <th style={{ width: "7%" }}>Satuan</th>
              <th className="text-right" style={{ width: "12%" }}>
                Modal/krg
              </th>
              <th className="text-right" style={{ width: "12%" }}>
                Harga Jual/krg
              </th>
              <th className="text-right" style={{ width: "12%" }}>
                Harga/1kg
              </th>
              <th className="text-right" style={{ width: "8%" }}>
                Stok
              </th>
              <th className="text-right" style={{ width: "15%" }}>
                Total Modal
              </th>
            </tr>
          </thead>
          <tbody>
            {products.map((product, index) => {
              const hargaPerKg = computeHargaPerKg(
                product.modal,
                product.kategori,
              );
              const totalModal =
                (Number(product.modal) || 0) * (Number(product.stok) || 0);

              return (
                <tr key={index}>
                  <td>{product.namaProduk}</td>
                  <td>{product.kategori}</td>
                  <td className="text-right">
                    {product.modal
                      ? `Rp.${Number(product.modal).toLocaleString("id-ID")}`
                      : "-"}
                  </td>
                  <td className="text-right">
                    {product.harga
                      ? `Rp.${Number(product.harga).toLocaleString("id-ID")}`
                      : "-"}
                  </td>
                  <td className="text-right">
                    {hargaPerKg
                      ? `Rp.${Number(hargaPerKg).toLocaleString("id-ID")}`
                      : "-"}
                  </td>
                  <td className="text-right">{product.stok || "-"}</td>
                  <td className="text-right">
                    {totalModal > 0
                      ? `Rp.${totalModal.toLocaleString("id-ID")}`
                      : "-"}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="total-row">
              <td colSpan="5" className="text-right">
                <strong>Total Stok dan Modal :</strong>
              </td>
              <td className="text-right">
                <strong>{grandTotalStok}</strong>
              </td>
              <td className="text-right">
                <strong>Rp.{grandTotalModal.toLocaleString("id-ID")}</strong>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="footer">
        <p>Laporan ini dihasilkan secara otomatis oleh sistem.</p>
      </div>
    </div>
  );
};

/**
 * printProducts Utility Function
 */
export const printProducts = (storeSettings, products) => {
  if (!products || products.length === 0) {
    alert("Data produk tidak tersedia.");
    return;
  }

  const htmlContent = ReactDOMServer.renderToStaticMarkup(
    <ProductsTemplate storeSettings={storeSettings} products={products} />,
  );

  const printStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap');
    * {
    box-sizing: border-box;
    }
    body { font-family: 'Inter', sans-serif; margin: 0; padding: 0; }
    .products-print {
      width: 100%;
      margin: 0 auto;
      background-color: white;
      color: #333;
      font-size: 12px;
      padding: 0;
      max-width: 210mm;
    }
    .products-print .header {
      text-align: center;
      margin-bottom: 20px;
    }
    .products-print .header .title {
      font-weight: 700;
      text-transform: uppercase;
      margin: 5px 0;
    }
    .products-print .header p {
      margin: 2px 0;
    }
    .products-print .header .small {
      font-size: 12px;
      font-weight: 700;
    }
    .products-print .divider {
      border-top: 1px dashed #ccc;
      margin: 15px 0;
    }
    .products-print .table-container {
      margin: 10px 0;
    }
    .products-print .products-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
      table-layout: fixed;
    }
    .products-print .products-table thead {
      background-color: #f5f5f5;
    }
    .products-print .products-table th {
      padding: 8px 10px;
      text-align: left;
      font-weight: bold;
      border-bottom: 2px solid #ddd;
    }
    .products-print .products-table td {
      padding: 8px 10px;
      vertical-align: middle;
      border-bottom: 1px solid #eee;
      font-size: 12px;
    }
    .products-print .products-table tfoot .total-row {
      border-top: 2px solid #333;
      background-color: #f5f5f5;
    }
    .products-print .products-table tfoot td {
      padding: 12px 6px;
      font-weight: 700;
    }
    
    .products-print .products-table td, 
    .products-print .products-table th {
      word-wrap: break-word;
      overflow-wrap: break-word;
    }
    .products-print .footer {
      text-align: center;
      margin-top: 20px;
      font-size: 12px;
      color: #888;
    }
    @media print {
      body { background-color: white !important; }
      @page { size: A4; margin: 10mm; }
      .products-print .divider {
        border-top: 1px solid #ccc;
      }
      .products-print .products-table thead {
        background-color: #f0f0f0 !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .products-print .products-table tfoot .total-row {
        background-color: #f0f0f0 !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

    }
  `;

  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(`
      <html>
        <head>
          <title>Cetak Laporan Produk</title>
          <style>
             ${printStyles}
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
