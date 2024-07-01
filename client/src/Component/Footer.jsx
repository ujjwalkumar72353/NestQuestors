// eslint-disable-next-line no-unused-vars
import React from 'react';

const Footer = () => {
  return (
    <footer className="dark:bg-gray-900 dark:bg-opacity-100 text-slate-400 p-5 mt-auto">
      <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center">
        <div className="text-center md:text-left mb-4 md:mb-0">
          <h2 className="text-lg font-bold text-slate-300">Your Company</h2>
          <p className="text-sm">&copy; {new Date().getFullYear()} All rights reserved.</p>
        </div>
        <div className="flex space-x-6">
          <a href="/" className="hover:text-slate-500">Home</a>
          <a href="/about" className="hover:text-slate-500">About</a>
          <a href="/listings" className="hover:text-slate-500">Listings</a>
          <a href="/contact" className="hover:text-slate-500">Contact</a>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-4">
          <a href="#" className="hover:text-slate-500">Privacy Policy</a>
          <a href="#" className="hover:text-slate-500">Terms of Service</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
