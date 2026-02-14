'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'

export default function NavBar() {
  const [activeIndex, setActiveIndex] = useState(0)

  const links = [
    { name: 'Home', href: '/' },
    { name: 'About', href: '/about' },
    { name: 'Contact', href: '/contact' },
  ]

  return (
    <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 mt-2">
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 mb-2">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <Link href="/" className="shrink-0 flex items-center gap-2 overflow-hidden">
            <Image
              src="/images/logo.png"
              alt="Laughtale Logo"
              width={100}
              height={100}
              priority
            />
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-purple-900 bg-clip-text text-transparent">
              Amethyst
            </span>
          </Link>

          {/* Links */}
          <div className="flex gap-8">
            {links.map((link, index) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setActiveIndex(index)}
                className={`text-sm font-medium transition-colors ${
                  activeIndex === index
                    ? 'text-purple-600 dark:text-purple-400'
                    : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  )
}
