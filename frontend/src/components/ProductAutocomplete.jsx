import React, { useState, useEffect, useRef } from "react";
import "./style/ProductAutocomplete.scss";

const ProductAutocomplete = ({
  products,
  value,
  onChange,
  placeholder = "Cari produk...",
}) => {
  // Find initial product if value exists
  const initialProduct = products.find((p) => p.id === value);
  const [inputValue, setInputValue] = useState(
    initialProduct ? initialProduct.namaProduk : ""
  );
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const wrapperRef = useRef(null);

  useEffect(() => {
    // Sync input value if external value changes (e.g. reset form)
    if (!value) {
      setInputValue("");
    } else {
      const p = products.find((p) => p.id === value);
      if (p) setInputValue(p.namaProduk);
    }
  }, [value, products]);

  // Handle outside click to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowDropdown(false);
        // If nothing selected and input doesn't match a product, keep input as is or reset?
        // Typically for selection, we might want to reset if invalid, but let's just leave it for now
        // Or strictly enforce selection:
        const exactMatch = products.find(
          (p) => p.namaProduk.toLowerCase() === inputValue.toLowerCase()
        );
        if (!exactMatch && inputValue !== "") {
          // Optional: clear if invalid? Let's just keep text but not select ID
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef, inputValue, products]);

  const handleInputChange = (e) => {
    const text = e.target.value;
    setInputValue(text);
    setShowDropdown(true);

    if (text.trim() === "") {
      setFilteredProducts([]);
      onChange(null); // Clear selection
      return;
    }

    const filtered = products.filter((product) =>
      product.namaProduk.toLowerCase().includes(text.toLowerCase())
    );
    setFilteredProducts(filtered);
  };

  const handleSelect = (product) => {
    setInputValue(product.namaProduk);
    onChange(product);
    setShowDropdown(false);
  };

  return (
    <div className="product-autocomplete-wrapper" ref={wrapperRef}>
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => {
          if (inputValue.trim() !== "") {
            const filtered = products.filter((product) =>
              product.namaProduk
                .toLowerCase()
                .includes(inputValue.toLowerCase())
            );
            setFilteredProducts(filtered);
          } else {
            // Show all or partial? Maybe top 10 if empty?
            // Let's show all if array is small, or limit to 10
            setFilteredProducts(products.slice(0, 10));
          }
          setShowDropdown(true);
        }}
        placeholder={placeholder}
      />

      {showDropdown && (
        <div className="autocomplete-dropdown">
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
              <div
                key={product.id}
                className="autocomplete-item"
                onClick={() => handleSelect(product)}
              >
                <span className="item-name">{product.namaProduk}</span>
                {/* <span className="item-price">
                  Rp {product.harga.toLocaleString("id-ID")}
                </span> */}
              </div>
            ))
          ) : (
            <div className="no-results">Produk tidak ditemukan</div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductAutocomplete;
