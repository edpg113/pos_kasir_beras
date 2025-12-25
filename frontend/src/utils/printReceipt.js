export const printReceipt = (storeSettings, transactionData) => {
  if (!transactionData || !storeSettings) {
    alert("Data transaksi atau setting toko belum siap cetak.");
    return;
  }

  const { namaToko, alamat, telepon } = storeSettings;
  const { pembeli, items, total, bayar, kembalian, tanggal } = transactionData;

  const printWindow = window.open("", "_blank");
  printWindow.document.write(`
      <html>
        <head>
          <title>Cetak Struk</title>
          <style>
            body { font-family: 'Courier New', monospace; font-size: 12px; width: 300px; margin: 0; padding: 10px; }
            .header { text-align: center; margin-bottom: 10px; border-bottom: 1px dashed #000; padding-bottom: 5px; }
            .header h2 { margin: 0; font-size: 16px; }
            .header p { margin: 2px 0; font-size: 10px; }
            .info { margin-bottom: 10px; font-size: 10px; }
            .items { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
            .items th { text-align: left; border-bottom: 1px dashed #000; }
            .items td { padding: 5px 0; vertical-align: top; }
            .text-right { text-align: right; }
            .totals { border-top: 1px dashed #000; padding-top: 5px; }
            .totals .row { display: flex; justify-content: space-between; margin-bottom: 2px; }
            .footer { margin-top: 15px; text-align: center; font-size: 10px; }
            @media print {
                @page { margin: 0; size: auto; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>${namaToko}</h2>
            <p>${alamat}</p>
            <p>Telp: ${telepon}</p>
          </div>
          <div class="info">
            <p>Tgl: ${new Date(tanggal).toLocaleString("id-ID")}</p>
            <p>Plg: ${pembeli || "Umum"}</p>
          </div>
          <table class="items">
            <thead>
                <tr>
                    <th>Item</th>
                    <th class="text-right">Qty</th>
                    <th class="text-right">Total</th>
                </tr>
            </thead>
            <tbody>
                ${items
                  .map(
                    (item) => `
                    <tr>
                        <td>${item.nama}</td>
                        <td class="text-right">${item.qty}</td>
                        <td class="text-right">${item.subtotal.toLocaleString(
                          "id-ID"
                        )}</td>
                    </tr>
                `
                  )
                  .join("")}
            </tbody>
          </table>
          <div class="totals">
            <div class="row"><span>Total:</span> <span>Rp ${total.toLocaleString(
              "id-ID"
            )}</span></div>
            <div class="row"><span>Bayar:</span> <span>Rp ${bayar.toLocaleString(
              "id-ID"
            )}</span></div>
            <div class="row"><span>Kembali:</span> <span>Rp ${kembalian.toLocaleString(
              "id-ID"
            )}</span></div>
          </div>
          <div class="footer">
            <p>Terima Kasih!</p>
          </div>
          <script>
            window.onload = function() { window.print(); }
            window.onafterprint = function() { window.close(); }
          </script>
        </body>
      </html>
    `);
  printWindow.document.close();
};
