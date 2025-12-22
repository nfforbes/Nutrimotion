'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import styles from './Home.module.css'

export default function Home() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className={styles.homeContainer}>
      <div className={styles.hero}>
        <h1 className={styles.heroTitle}>Welcome to Nutrimotion</h1>
        <p className={styles.heroSubtitle}>Your journey to better nutrition and fitness starts here.</p>
      </div>

      <div className={styles.dashboard}>
        <h2 className={styles.dashboardTitle}>Quick Links</h2>
        <div className={styles.quickLinks}>
          <Link href="/training" className={styles.quickLinkCard}>
            <div className={styles.iconContainer}>
              <svg 
                width="48" 
                height="48" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <h3 className={styles.cardTitle}>Training</h3>
            <p className={styles.cardDescription}>Explore our personal training packages and workout plans</p>
            <span className={styles.cardLink}>View Training →</span>
          </Link>

          <Link href="/meals" className={styles.quickLinkCard}>
            <div className={styles.iconContainer}>
              <svg 
                width="48" 
                height="48" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
              >
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
            </div>
            <h3 className={styles.cardTitle}>Meals</h3>
            <p className={styles.cardDescription}>Browse our nutritious meal options for breakfast, lunch, and dinner</p>
            <span className={styles.cardLink}>View Meals →</span>
          </Link>

          <Link href="/books" className={styles.quickLinkCard}>
            <div className={styles.iconContainer}>
              <svg 
                width="48" 
                height="48" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
              >
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            </div>
            <h3 className={styles.cardTitle}>Books</h3>
            <p className={styles.cardDescription}>Discover our recipe books available in digital and print formats</p>
            <span className={styles.cardLink}>View Books →</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
