// import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import './App.scss'
import Login from './pages/Login/Login'
import Register from './pages/Login/Register'
import Dashboard from './pages/Dashboard/Dashboard'
import Products from './pages/Products/Products'
import Sales from './pages/Sales/Sales'
import Inventory from './pages/Inventory/Inventory'
import Reports from './pages/Reports/Reports'
import Settings from './pages/Settings/Settings'

export default function App() {
  // const [isAuthenticated, setIsAuthenticated] = useState(false)
  // const [user, setUser] = useState(null)

  // const handleLogin = (userData) => {
  //   setIsAuthenticated(true)
  //   setUser(userData)
  // }

  // const handleLogout = () => {
  //   setIsAuthenticated(false)
  //   setUser(null)
  // }

  return (
    <Router>
      <Routes>
        <Route 
          // path="/login" 
          element={<Login />} 
          index
        />
        <Route 
          path="/register" 
          element={<Register />} 
        />
        <Route 
          path="/dashboard" 
          element={<Dashboard />} 
        />
        <Route 
          path="/products" 
          element={<Products />}
        />
        <Route 
          path="/sales" 
          element={<Sales />} 
        />
        <Route 
          path="/inventory" 
          element={<Inventory />} 
        />
        <Route 
          path="/reports" 
          element={<Reports />} 
        />
        <Route 
          path="/settings" 
          element={<Settings />} 
        />
      </Routes>
    </Router>
  )
}
