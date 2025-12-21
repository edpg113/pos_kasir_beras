import React, { useState } from 'react';
import './style/ChangePasswordModal.scss';

const ChangePasswordModal = ({ isOpen, onClose }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('Password baru tidak cocok.');
      return;
    }

    // TODO: Ganti dengan logika untuk mendapatkan ID user yang sedang login
    const userId = 'current_user_id'; // Placeholder

    try {
      // TODO: Ganti URL endpoint sesuai dengan API backend Anda
      const response = await fetch(`/api/user/${userId}/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Gagal mengubah password.');
      }

      setSuccess('Password berhasil diubah.');
      setTimeout(() => {
        onClose();
        setSuccess('');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }, 2000);
    } catch (err) {
      setError(err.message);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Ubah Password</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="currentPassword">Password Saat Ini</label>
            <input
              type="password"
              id="currentPassword"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="newPassword">Password Baru</label>
            <input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">Konfirmasi Password Baru</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="error-message">{error}</p>}
          {success && <p className="success-message">{success}</p>}
          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-cancel">Batal</button>
            <button type="submit" className="btn-submit">Simpan</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
