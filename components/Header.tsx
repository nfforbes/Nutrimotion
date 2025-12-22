'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import styles from './Header.module.css'

export default function Header() {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <header className={styles.header}>
      <nav className={styles.nav}>
        <Link href="/" className={styles.logo}>
          <img
            src="/images/logo_no_backgroung.png"
            alt="Nutrimotion Logo"
            className={styles.logoImage}
          />
        </Link>
        <div className={styles.menu}>
          <Link 
            href="/" 
            className={`${styles.menuItem} ${mounted && pathname === '/' ? styles.active : ''}`}
          >
            Home
          </Link>
          <Link 
            href="/training" 
            className={`${styles.menuItem} ${mounted && pathname === '/training' ? styles.active : ''}`}
          >
            Training
          </Link>
          <Link 
            href="/meals" 
            className={`${styles.menuItem} ${mounted && pathname === '/meals' ? styles.active : ''}`}
          >
            Meals
          </Link>
          <Link 
            href="/books" 
            className={`${styles.menuItem} ${mounted && pathname === '/books' ? styles.active : ''}`}
          >
            Books
          </Link>
        </div>
        <div className={styles.rightSection}>
          <button className={styles.cartButton} aria-label="Cart">
            <svg 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
            >
              <path d="M9 21h6M9 21a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2M9 21a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v0a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2zM19 7V5a2 2 0 0 0-2-2h-2M7 7V5a2 2 0 0 1 2-2h2" />
            </svg>
            <span className={styles.cartText}>Cart</span>
          </button>
          <button className={styles.loginButton} aria-label="Login">
            <svg 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
            >
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" />
            </svg>
            <span className={styles.loginText}>Login</span>
          </button>
        </div>
      </nav>
    </header>
  )
}

