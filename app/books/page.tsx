'use client'

import { useEffect, useState } from 'react'
import styles from './Books.module.css'

interface Book {
  id: number
  title: string
  description: string
  author: string
  softCopyPrice: number
  hardCopyPrice: number
  image: string
}

const books: Book[] = [
  {
    id: 1,
    title: 'Complete Nutrition Guide',
    description: 'A comprehensive guide to healthy eating with over 200 recipes. Learn the fundamentals of nutrition and meal planning.',
    author: 'Malik Reid',
    softCopyPrice: 24.99,
    hardCopyPrice: 39.99,
    image: '/images/books/nutrition-guide.jpg'
  },
  {
    id: 2,
    title: 'Quick & Healthy Meals',
    description: '50 delicious recipes you can prepare in 30 minutes or less. Perfect for busy professionals and families.',
    author: 'Malik Reid',
    softCopyPrice: 19.99,
    hardCopyPrice: 34.99,
    image: '/images/books/quick-meals.jpg'
  },
  {
    id: 3,
    title: 'Plant-Based Power',
    description: 'Discover the benefits of plant-based nutrition with 150 vegan and vegetarian recipes packed with flavor.',
    author: 'Malik Reid',
    softCopyPrice: 27.99,
    hardCopyPrice: 44.99,
    image: '/images/books/plant-based.jpg'
  },
  {
    id: 4,
    title: 'Meal Prep Mastery',
    description: 'Master the art of meal prepping with this essential guide. Save time and eat healthy all week long.',
    author: 'Malik Reid',
    softCopyPrice: 22.99,
    hardCopyPrice: 37.99,
    image: '/images/books/meal-prep.jpg'
  },
  {
    id: 5,
    title: 'Athlete\'s Kitchen',
    description: 'Performance-focused recipes designed for athletes. Fuel your body for peak performance and recovery.',
    author: 'Malik Reid',
    softCopyPrice: 29.99,
    hardCopyPrice: 49.99,
    image: '/images/books/athletes-kitchen.jpg'
  },
  {
    id: 6,
    title: 'Family-Friendly Recipes',
    description: 'Nutritious meals the whole family will love. Kid-approved recipes that are both healthy and delicious.',
    author: 'Malik Reid',
    softCopyPrice: 21.99,
    hardCopyPrice: 36.99,
    image: '/images/books/family-recipes.jpg'
  }
]

export default function Books() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (mounted) {
      e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="400"%3E%3Crect fill="%23ddd" width="300" height="400"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="18" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EBook Cover%3C/text%3E%3C/svg%3E'
    }
  }

  return (
    <div className={styles.booksContainer}>
      <h1 className={styles.title}>Recipe Books</h1>
      <p className={styles.subtitle}>Discover our collection of nutrition and recipe books available in digital and print formats</p>

      <div className={styles.booksGrid}>
        {books.map((book) => (
          <div key={book.id} className={styles.bookCard}>
            <div className={styles.imageContainer}>
              <img 
                src={book.image} 
                alt={book.title}
                className={styles.bookImage}
                onError={handleImageError}
              />
            </div>
            <div className={styles.bookContent}>
              <h2 className={styles.bookTitle}>{book.title}</h2>
              <p className={styles.bookAuthor}>By {book.author}</p>
              <p className={styles.bookDescription}>{book.description}</p>
              <div className={styles.pricingSection}>
                <div className={styles.priceOption}>
                  <span className={styles.formatLabel}>Digital Copy</span>
                  <span className={styles.price}>${book.softCopyPrice.toFixed(2)}</span>
                  <button className={styles.buyButton}>Buy Digital</button>
                </div>
                <div className={styles.priceOption}>
                  <span className={styles.formatLabel}>Hard Copy</span>
                  <span className={styles.price}>${book.hardCopyPrice.toFixed(2)}</span>
                  <button className={styles.buyButton}>Buy Hardcover</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

