import React from "react";
import ReactDOMServer from "react-dom/server";
import styles from "./printReceipt.scss?inline";

/**
 * ReceiptTemplate Component
 * This component defines the structure of the receipt.
 * It is used for generating the HTML string for printing.
 */
const ReceiptTemplate = ({ storeSettings, transactionData }) => {
  const { namaToko, alamat, email, telepon } = storeSettings;
  const {
    pembeli,
    items,
    total,
    bayar,
    kembalian,
    tanggal,
    id,
    kasir,
    kode_transaksi,
  } = transactionData;

  const dateStr = new Date(tanggal || new Date()).toLocaleString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="receipt">
      <div className="header">
        <img src="/logo.png" alt="logo" />
        <p className="title">{namaToko}</p>

        <p className="small">{alamat}</p>
      </div>

      <div className="divider" />

      <div className="info">
        <p>Kasir : {kasir || "-"}</p>
        <p>No. Transaksi : {kode_transaksi || id}</p>
        <p>Tanggal : {dateStr}</p>
        <p>Customer : {pembeli || "-"}</p>
      </div>

      <div className="divider" />

      <div className="items">
        {items.map((item, i) => (
          <div className="row" key={i}>
            <span>
              {item.nama} x {item.qty}
            </span>
            <span>Rp. {item.harga.toLocaleString("id-ID")}</span>
          </div>
        ))}
      </div>

      <div className="divider" />

      <div className="summary">
        <p>Total : Rp. {total.toLocaleString("id-ID")}</p>
        <p>Bayar : Rp. {bayar.toLocaleString("id-ID")}</p>
        <p>Kembali : Rp. {kembalian.toLocaleString("id-ID")}</p>
      </div>

      <div className="divider" />

      <div className="footer">
        <p>Terima kasih telah berbelanja!</p>
        <p className="small">{email}</p>
        <p className="small">{telepon}</p>
      </div>
    </div>
  );
};

/**
 * printReceipt Utility Function
 * Opens a new window and prints the receipt.
 */
export const printReceipt = (storeSettings, transactionData) => {
  if (!transactionData || !storeSettings) {
    alert("Data transaksi atau setting toko belum siap cetak.");
    return;
  }

  // Render the component to static HTML markup
  const htmlContent = ReactDOMServer.renderToStaticMarkup(
    <ReceiptTemplate
      storeSettings={storeSettings}
      transactionData={transactionData}
    />
  );

  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(`
      <html>
        <head>
          <title>Cetak Struk</title>
          <style>
             body { 
               margin: 0; 
               padding: 0; 
               display: flex; 
               justify-content: center; 
               background-color: #f0f0f0;
             }
             @media print {
               body { background-color: white; }
               @page { margin: 0; }
             }
             ${styles}
          </style>
        </head>
        <body>
          <div style="background-color: white; padding: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); margin: 20px 0;">
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
