'use client';

import React from 'react';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="crm-footer">
      <p>© {year} PhoneCRM — Phone Buy & Sell Shop Management System. All rights reserved.</p>
    </footer>
  );
}
