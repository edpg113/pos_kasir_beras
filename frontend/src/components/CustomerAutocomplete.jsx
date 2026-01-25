import React, { useState, useEffect, useRef } from "react";
import "./style/ProductAutocomplete.scss"; // Reusing the same styling

const CustomerAutocomplete = ({
  customers,
  value,
  onChange,
  placeholder = "Nama pembeli...",
}) => {
  const [inputValue, setInputValue] = useState(value || "");
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const wrapperRef = useRef(null);

  useEffect(() => {
    setInputValue(value || "");
  }, [value]);

  // Handle outside click to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const handleInputChange = (e) => {
    const text = e.target.value;
    setInputValue(text);
    onChange(text); // For customers, we typically use the name string
    setShowDropdown(true);

    if (text.trim() === "") {
      setFilteredCustomers([]);
      return;
    }

    const filtered = customers.filter((customer) =>
      customer.nama.toLowerCase().includes(text.toLowerCase()),
    );
    setFilteredCustomers(filtered);
  };

  const handleSelect = (customer) => {
    setInputValue(customer.nama);
    onChange(customer.nama);
    setShowDropdown(false);
  };

  return (
    <div className="product-autocomplete-wrapper" ref={wrapperRef}>
      <input
        type="text"
        className="form-control"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => {
          if (inputValue.trim() !== "") {
            const filtered = customers.filter((customer) =>
              customer.nama.toLowerCase().includes(inputValue.toLowerCase()),
            );
            setFilteredCustomers(filtered);
          } else {
            setFilteredCustomers(customers.slice(0, 10));
          }
          setShowDropdown(true);
        }}
        placeholder={placeholder}
      />

      {showDropdown && filteredCustomers.length > 0 && (
        <div className="autocomplete-dropdown" style={{ width: "100%" }}>
          {filteredCustomers.map((customer) => (
            <div
              key={customer.id}
              className="autocomplete-item"
              onClick={() => handleSelect(customer)}
            >
              <span className="item-name">{customer.nama}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomerAutocomplete;
