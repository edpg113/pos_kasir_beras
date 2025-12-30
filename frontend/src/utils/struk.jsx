import React from "react";
import moment from "moment-timezone";
import "../style/struk.scss";
import Icon from "../assets/logo.png";
import { supabase } from "../../../../../supabase/supabaseClient";
import { useEffect, useState } from "react";

const Struk = ({ transaksiDetails }) => {
  const [displayName, setDisplayName] = useState("");
  const [customer, setCustomer] = useState("");

  if (!transaksiDetails) {
    return <p>Tidak ada data transaksi.</p>;
  }

  useEffect(() => {
    // setCustomer(""); // reset customer setiap transaksi baru
    getProfiles();
    // getCustomer();
  }, [transaksiDetails.id]);

  async function getProfiles() {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error("Error fetching user:", userError);
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .single();
    if (error) {
      console.error("Error fetching profile:", error);
    } else {
      setDisplayName(data.display_name);
    }
  }

  return (
    <div className="struk" style={{ maxWidth: "70mm", margin: "0 auto" }}>
      <div className="head">
        <img src={Icon} alt="" />
        <h2>Warjo ID</h2>
        <p>Jl. Pasir Muncang, Cikopo Selatan, Kab. Bogor</p>
      </div>
      <hr />
      <div className="info">
        <p>Kasir : {displayName}</p>
        <p>No. Transaksi: {transaksiDetails.id}</p>
        <p>
          Tanggal : {moment().tz("Asia/Jakarta").format("DD/MM/YYYY HH:mm")}
        </p>
        <p>Customer : {transaksiDetails.customer || "-"}</p>
      </div>
      <hr />
      <ul>
        {transaksiDetails.items.map((item, index) => (
          <li key={index}>
            <span>
              {item.namaProduk} x {item.qty}
            </span>
            <span>Rp. {item.hargaProduk.toLocaleString("id-ID")}</span>
          </li>
        ))}
      </ul>
      <hr />
      <div className="info">
        <p>Total : Rp. {transaksiDetails.total.toLocaleString("id-ID")}</p>
        <p>
          Bayar : Rp. {transaksiDetails.uangDibayarkan.toLocaleString("id-ID")}
        </p>
        <p>
          Kembali : Rp. {transaksiDetails.kembalian.toLocaleString("id-ID")}
        </p>
      </div>
      <hr />
      <div className="footer">
        <p>Terima kasih telah berbelanja!</p>
        <p>Instagram</p>
        <p>@warjoId</p>
      </div>
    </div>
  );
};

export default Struk;
