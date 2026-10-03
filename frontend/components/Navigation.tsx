'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Palette } from 'lucide-react';
import PhoneLink from './PhoneLink';

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { href: '/', label: 'Главная' },
    { href: '/gallery', label: 'Галерея' },
    { href: '/about', label: 'Обо мне' },
    { href: '/videos', label: 'Видео' },
    { href: '/blog', label: 'Блог' },
    { href: '/reviews', label: 'Отзывы' },
    { href: '/contacts', label: 'Контакты' },
  ];

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-[9999] transition-all duration-300 ${
        isScrolled ? 'shadow-md' : ''
      } bg-paper/95 backdrop-blur-sm border-b border-line`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-sea rounded-md flex items-center justify-center">
              <Palette className="w-6 h-6 text-paper" />
            </div>
            <span className="text-xl font-serif font-semibold text-ink">
              Анжела Моисеенко
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div data-testid="desktop-nav" className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(item.href) ? 'page' : undefined}
                className={`relative px-3 py-2 text-sm font-medium transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sea ${
                  isActive(item.href)
                    ? 'text-sea'
                    : 'text-ink-600 hover:text-sea'
                }`}
              >
                {item.label}
                {isActive(item.href) && (
                  <span
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-sea"
                    />
                )}
              </Link>
            ))}
          </div>

          {/* The phone is the shortest path to a sale, so it sits in the header on
              every page; on narrow desktops only the icon remains. */}
          <PhoneLink
            place="header"
            showNumberFrom="md"
            className="hidden md:inline-flex items-center gap-2 rounded-full bg-sea px-4 h-10 text-sm font-semibold text-white transition-colors duration-200 hover:bg-sea-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-sea focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
          />

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Меню"
            aria-expanded={isOpen}
            className="md:hidden p-2 rounded-md text-ink-600 hover:text-sea hover:bg-paper-200 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sea"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
        {isOpen && (
          <div
            data-testid="mobile-menu"
            className="animate-fade-in md:hidden bg-paper border-t border-line shadow-md"
          >
            <div className="px-4 pt-2 pb-3 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  aria-current={isActive(item.href) ? 'page' : undefined}
                  className={`block px-3 py-2 text-base font-medium rounded-md transition-colors duration-200 ${
                    isActive(item.href)
                      ? 'text-sea bg-sea-50'
                      : 'text-ink-600 hover:text-sea hover:bg-paper-200'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <PhoneLink
                place="header-mobile"
                className="mt-2 flex items-center justify-center gap-2 rounded-md bg-sea px-3 py-2 text-base font-semibold text-white transition-colors duration-200 hover:bg-sea-700"
              />
            </div>
          </div>
        )}
    </nav>
  );
};

export default Navigation; 