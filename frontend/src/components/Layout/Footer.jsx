import React from 'react';
import { Shield, Twitter, Github, Linkedin, BellRingIcon } from 'lucide-react';

const Footer = () => {
  const socialLinks = [
    {
      name: 'Twitter',
      icon: Twitter,
      url: 'https://twitter.com/YourProfile',
    },
    {
      name: 'GitHub',
      icon: Github,
      url: 'https://github.com/YourRepo',
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      url: 'https://linkedin.com/in/YourProfile',
    },
  ];

  const footerLinks = [
    { name: 'Privacy Policy', url: '/privacy' },
    { name: 'Terms of Service', url: '/terms' },
    { name: 'Contact Us', url: '/contact' },
  ];

  return (
    <footer className="bg-slate-900 border-t border-slate-700/50 text-slate-400">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Logo and About Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center shadow-md">
                <BellRingIcon className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-lg font-bold text-white">
                Geo Aid+
              </h1>
            </div>
            <p className="text-sm">
              The Geo Aid+ Coordination Platform is dedicated to providing timely and accurate information during crises.
            </p>
          </div>

          {/* Links Section */}
          <div className="md:justify-self-center">
            <h3 className="text-md font-semibold text-slate-200 mb-4">Quick Links</h3>
            <ul className="space-y-2">
              {footerLinks.map((link) => (
                <li key={link.name}>
                  <a href={link.url} className="text-sm hover:text-white transition-colors">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Social Media Section */}
          <div className="md:justify-self-end">
            <h3 className="text-md font-semibold text-slate-200 mb-4">Follow Us</h3>
            <div className="flex items-center space-x-4">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors"
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-slate-800 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} Geo Aid+ Platform. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;