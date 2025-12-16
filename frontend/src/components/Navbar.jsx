import React from "react";

export default function Navbar({title, onLogout, user}) {
  return (
    <div>
      <div className="dashboard-navbar">
        <h2>{title}</h2>
        <div className="navbar-user">
          <span>👋 Halo, {user?.name}!</span>
          <button className="btn-logout" onClick={onLogout}>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
