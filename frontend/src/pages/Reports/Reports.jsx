import React, { useState } from 'react'
import Sidebar from '../../components/Sidebar'
import './style/Reports.scss'
import Navbar from '../../components/Navbar'

export default function Reports({ onLogout, user }) {
  const [reportPeriod, setReportPeriod] = useState('Desember 2025')

  const monthlySales = [
    { bulan: 'Oktober', total: 1800000, qty: 180 },
    { bulan: 'November', total: 2100000, qty: 210 },
    { bulan: 'Desember', total: 2450000, qty: 245 }
  ]

  const topProducts = [
    { produk: 'Beras Putih Premium', penjualan: 500000, qty: 55 },
    { produk: 'Beras Jasmine', penjualan: 450000, qty: 50 },
    { produk: 'Beras Merah Organik', penjualan: 400000, qty: 38 },
    { produk: 'Beras Putih Standar', penjualan: 350000, qty: 47 }
  ]

  const customerStats = [
    { kategori: 'Pelanggan Setia', jumlah: 45, persentase: '52%' },
    { kategori: 'Pelanggan Baru', jumlah: 28, persentase: '32%' },
    { kategori: 'Pelanggan Pasif', jumlah: 14, persentase: '16%' }
  ]

  const totalSales = monthlySales.reduce((sum, item) => sum + item.total, 0)
  const totalQty = monthlySales.reduce((sum, item) => sum + item.qty, 0)

  return (
    <div className="reports-container">
      <Sidebar onLogout={onLogout} user={user} />
      <div className="reports-content-wrapper">
       <Navbar title="Laporan" onLogout={onLogout} user={user} />

        <div className="reports-page-content">
          <div className="reports-page-header">
            <h1>Laporan & Analitik</h1>
            <p>Analisis penjualan dan performa bisnis Anda</p>
          </div>

          <div className="reports-filter-bar">
            <select 
              value={reportPeriod}
              onChange={(e) => setReportPeriod(e.target.value)}
            >
              <option>Desember 2025</option>
              <option>November 2025</option>
              <option>Oktober 2025</option>
            </select>
            <button className="btn btn-primary" style={{ width: 'auto' }}>📥 Export</button>
          </div>

          <div className="reports-stats-grid">
            <div className="reports-stat-card">
              <h3>Total Penjualan</h3>
              <div className="value">{totalSales.toLocaleString('id-ID')}</div>
              <div className="unit">Rp</div>
            </div>
            <div className="reports-stat-card">
              <h3>Total Terjual</h3>
              <div className="value">{totalQty}</div>
              <div className="unit">kg</div>
            </div>
            <div className="reports-stat-card">
              <h3>Rata-rata Hari</h3>
              <div className="value">{Math.round(totalSales / 30).toLocaleString('id-ID')}</div>
              <div className="unit">Rp/hari</div>
            </div>
            <div className="reports-stat-card">
              <h3>Total Pelanggan</h3>
              <div className="value">87</div>
              <div className="unit">orang</div>
            </div>
          </div>

          <div className="reports-grid-2">
            <div className="reports-card">
              <h2>Penjualan Bulanan</h2>
              <div className="reports-table-container">
                <table className="reports-table">
                  <thead>
                    <tr>
                      <th>Bulan</th>
                      <th>Total Penjualan</th>
                      <th>Jumlah (kg)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlySales.map((item, index) => (
                      <tr key={index}>
                        <td>{item.bulan}</td>
                        <td><strong>{item.total.toLocaleString('id-ID')}</strong></td>
                        <td>{item.qty} kg</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="reports-card">
              <h2>Produk Terlaris</h2>
              <div className="reports-table-container">
                <table className="reports-table">
                  <thead>
                    <tr>
                      <th>Produk</th>
                      <th>Penjualan</th>
                      <th>Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topProducts.map((item, index) => (
                      <tr key={index}>
                        <td>{item.produk}</td>
                        <td><strong>{item.penjualan.toLocaleString('id-ID')}</strong></td>
                        <td>{item.qty} kg</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="reports-card">
            <h2>Statistik Pelanggan</h2>
            <div className="reports-table-container">
              <table className="reports-table">
                <thead>
                  <tr>
                    <th>Kategori</th>
                    <th>Jumlah</th>
                    <th>Persentase</th>
                  </tr>
                </thead>
                <tbody>
                  {customerStats.map((item, index) => (
                    <tr key={index}>
                      <td><strong>{item.kategori}</strong></td>
                      <td>{item.jumlah} orang</td>
                      <td>{item.persentase}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
