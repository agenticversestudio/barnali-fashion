import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Barnali Fashion ERP — Bridal & Occasion Studio",
    short_name: "Barnali ERP",
    description: "Rental operations, counter bookings, and godown rack management for Barnali Fashion, Bargarh.",
    start_url: "/erp/dashboard",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#FAF5EB",
    theme_color: "#4B1835",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
