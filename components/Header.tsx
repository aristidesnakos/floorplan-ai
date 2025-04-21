'use client';

import React from 'react';

interface HeaderProps {
  title: string;
  className?: string;
}

const Header: React.FC<HeaderProps> = ({
  title,
  className = ''
}) => {
  return (
    <header className="glass-hero">
      <div className={`max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 ${className}`}>
        <h1 className="text-3xl font-bold text-white">{title}</h1>
      </div>
    </header>
  );
};

export default Header;
