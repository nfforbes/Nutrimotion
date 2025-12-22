'use client'

import { useEffect, useState } from 'react'
import styles from './Training.module.css'

interface TrainingPackage {
  id: number
  name: string
  description: string
  price: number
  sessions: number
  duration: string
  features: string[]
  popular?: boolean
}

const packages: TrainingPackage[] = [
  {
    id: 1,
    name: 'Starter Package',
    description: 'Perfect for beginners looking to kickstart their fitness journey. Get personalized guidance and build a solid foundation.',
    price: 199.99,
    sessions: 4,
    duration: '1 month',
    features: [
      '4 one-on-one sessions',
      'Initial fitness assessment',
      'Customized workout plan',
      'Nutrition guidance',
      'Email support'
    ]
  },
  {
    id: 2,
    name: 'Premium Package',
    description: 'Our most popular package for serious fitness enthusiasts. Comprehensive training with ongoing support and accountability.',
    price: 449.99,
    sessions: 12,
    duration: '3 months',
    features: [
      '12 one-on-one sessions',
      'Comprehensive fitness assessment',
      'Personalized workout program',
      'Meal planning assistance',
      'Weekly progress check-ins',
      '24/7 messaging support',
      'Access to online resources'
    ],
    popular: true
  },
  {
    id: 3,
    name: 'Elite Package',
    description: 'Ultimate training experience for maximum results. Intensive coaching with all-inclusive support and premium features.',
    price: 799.99,
    sessions: 24,
    duration: '6 months',
    features: [
      '24 one-on-one sessions',
      'Advanced fitness testing',
      'Dynamic workout programming',
      'Custom meal plans',
      'Bi-weekly progress reviews',
      'Priority scheduling',
      '24/7 direct trainer access',
      'Supplement guidance',
      'Body composition tracking',
      'Video form analysis'
    ]
  },
  {
    id: 4,
    name: 'Flex Package',
    description: 'Flexible training option for busy schedules. Pay-as-you-go sessions with the freedom to train when it works for you.',
    price: 79.99,
    sessions: 1,
    duration: 'Per session',
    features: [
      'Single session booking',
      'Flexible scheduling',
      'No commitment required',
      'Personalized attention',
      'Workout plan included'
    ]
  }
]

export default function Training() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className={styles.trainingContainer}>
      <h1 className={styles.title}>Personal Training Packages</h1>
      <p className={styles.subtitle}>Choose the perfect training plan to achieve your fitness goals</p>

      <div className={styles.packagesGrid}>
        {packages.map((pkg) => (
          <div 
            key={pkg.id} 
            className={`${styles.packageCard} ${mounted && pkg.popular ? styles.popular : ''}`}
          >
            {mounted && pkg.popular && (
              <div className={styles.popularBadge}>Most Popular</div>
            )}
            <div className={styles.packageHeader}>
              <h2 className={styles.packageName}>{pkg.name}</h2>
              <div className={styles.packagePrice}>
                <span className={styles.price}>${pkg.price.toFixed(2)}</span>
                {pkg.sessions > 1 && (
                  <span className={styles.priceUnit}>/{pkg.duration}</span>
                )}
              </div>
            </div>
            <p className={styles.packageDescription}>{pkg.description}</p>
            <div className={styles.sessionsInfo}>
              <span className={styles.sessionsCount}>{pkg.sessions}</span>
              <span className={styles.sessionsLabel}>
                {pkg.sessions === 1 ? 'Session' : 'Sessions'}
              </span>
            </div>
            <ul className={styles.featuresList}>
              {pkg.features.map((feature, index) => (
                <li key={index} className={styles.feature}>
                  <svg 
                    className={styles.checkIcon}
                    width="20" 
                    height="20" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>
            <button className={styles.selectButton}>
              Select Package
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
