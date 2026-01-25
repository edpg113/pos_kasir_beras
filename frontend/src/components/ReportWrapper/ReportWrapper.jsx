import React from "react";
import "../../styles/globalPrint.css";

/**
 * ReportWrapper - Standard A4 Wrapper for Reports
 * Didesain khusus untuk Electron.webContents.print()
 */
const ReportWrapper = ({ children, title, storeSettings, date }) => {
  const { namaToko, alamat } = storeSettings || {};
  const today =
    date ||
    new Date().toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

  return (
    <div className="a4-report-wrapper">
      <div className="report-header">
        <h1>{title || "Laporan"}</h1>
        {namaToko && <p className="font-bold">{namaToko}</p>}
        {alamat && <p>{alamat}</p>}
        <p>Tanggal Cetak: {today}</p>
      </div>

      <div className="report-content">{children}</div>

      <div className="report-footer">
        <div className="signature-block">
          <p>Dicetak pada: {new Date().toLocaleDateString("id-ID")}</p>
          <div className="signature-space"></div>
          <p className="font-bold">( ____________________ )</p>
          <p>Admin/Kasir</p>
        </div>
      </div>
    </div>
  );
};

export default ReportWrapper;
