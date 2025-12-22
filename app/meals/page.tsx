'use client'

import styles from './Meals.module.css'

interface Meal {
  id: number
  name: string
  description: string
  cost: number
  image: string
}

const meals: { [key: string]: Meal[] } = {
  breakfast: [
    {
      id: 1,
      name: 'Protein Power Bowl',
      description: 'Scrambled eggs with avocado, spinach, and whole grain toast. Packed with protein and healthy fats to start your day right.',
      cost: 12.99,
      image: '/images/meals/breakfast1.jpg'
    },
    {
      id: 2,
      name: 'Overnight Oats Delight',
      description: 'Creamy oats with fresh berries, chia seeds, and a drizzle of honey. A perfect balance of carbs and fiber.',
      cost: 9.99,
      image: '/images/meals/breakfast2.jpg'
    },
    {
      id: 3,
      name: 'Green Smoothie Bowl',
      description: 'Nutrient-dense smoothie bowl topped with granola, coconut flakes, and seasonal fruits. Energizing and refreshing.',
      cost: 11.99,
      image: '/images/meals/breakfast3.jpg'
    }
  ],
  lunch: [
    {
      id: 4,
      name: 'Grilled Chicken Salad',
      description: 'Fresh mixed greens with grilled chicken breast, cherry tomatoes, cucumbers, and a light vinaigrette dressing.',
      cost: 15.99,
      image: '/images/meals/lunch1.jpg'
    },
    {
      id: 5,
      name: 'Quinoa Power Bowl',
      description: 'Quinoa base with roasted vegetables, chickpeas, feta cheese, and tahini dressing. Plant-based protein powerhouse.',
      cost: 13.99,
      image: '/images/meals/lunch2.jpg'
    },
    {
      id: 6,
      name: 'Salmon & Sweet Potato',
      description: 'Baked salmon fillet with roasted sweet potatoes and steamed broccoli. Rich in omega-3s and complex carbs.',
      cost: 18.99,
      image: '/images/meals/lunch3.jpg'
    }
  ],
  dinner: [
    {
      id: 7,
      name: 'Lean Beef Stir Fry',
      description: 'Tender beef strips with mixed vegetables in a savory sauce, served over brown rice. High protein, low fat.',
      cost: 19.99,
      image: '/images/meals/dinner1.jpg'
    },
    {
      id: 8,
      name: 'Mediterranean Pasta',
      description: 'Whole wheat pasta with grilled chicken, sun-dried tomatoes, olives, and feta cheese. Mediterranean flavors.',
      cost: 16.99,
      image: '/images/meals/dinner2.jpg'
    },
    {
      id: 9,
      name: 'Herb-Crusted Cod',
      description: 'Fresh cod fillet with herb crust, served with quinoa pilaf and seasonal vegetables. Light and nutritious.',
      cost: 20.99,
      image: '/images/meals/dinner3.jpg'
    }
  ]
}

export default function Meals() {
  return (
    <div className={styles.mealsContainer}>
      <h1 className={styles.title}>Our Meals</h1>
      <p className={styles.subtitle}>Discover nutritious meal plans designed for your fitness goals</p>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Breakfast</h2>
        <div className={styles.mealsGrid}>
          {meals.breakfast.map((meal) => (
            <div key={meal.id} className={styles.mealCard}>
              <div className={styles.imageContainer}>
                <img 
                  src={meal.image} 
                  alt={meal.name}
                  className={styles.mealImage}
                  onError={(e) => {
                    // Fallback to placeholder if image doesn't exist
                    e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="200"%3E%3Crect fill="%23ddd" width="300" height="200"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="18" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EMeal Image%3C/text%3E%3C/svg%3E'
                  }}
                />
              </div>
              <div className={styles.mealContent}>
                <h3 className={styles.mealName}>{meal.name}</h3>
                <p className={styles.mealDescription}>{meal.description}</p>
                <div className={styles.mealFooter}>
                  <span className={styles.cost}>${meal.cost.toFixed(2)}</span>
                  <button className={styles.addButton}>Add to Cart</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Lunch</h2>
        <div className={styles.mealsGrid}>
          {meals.lunch.map((meal) => (
            <div key={meal.id} className={styles.mealCard}>
              <div className={styles.imageContainer}>
                <img 
                  src={meal.image} 
                  alt={meal.name}
                  className={styles.mealImage}
                  onError={(e) => {
                    e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="200"%3E%3Crect fill="%23ddd" width="300" height="200"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="18" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EMeal Image%3C/text%3E%3C/svg%3E'
                  }}
                />
              </div>
              <div className={styles.mealContent}>
                <h3 className={styles.mealName}>{meal.name}</h3>
                <p className={styles.mealDescription}>{meal.description}</p>
                <div className={styles.mealFooter}>
                  <span className={styles.cost}>${meal.cost.toFixed(2)}</span>
                  <button className={styles.addButton}>Add to Cart</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Dinner</h2>
        <div className={styles.mealsGrid}>
          {meals.dinner.map((meal) => (
            <div key={meal.id} className={styles.mealCard}>
              <div className={styles.imageContainer}>
                <img 
                  src={meal.image} 
                  alt={meal.name}
                  className={styles.mealImage}
                  onError={(e) => {
                    e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="200"%3E%3Crect fill="%23ddd" width="300" height="200"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="18" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EMeal Image%3C/text%3E%3C/svg%3E'
                  }}
                />
              </div>
              <div className={styles.mealContent}>
                <h3 className={styles.mealName}>{meal.name}</h3>
                <p className={styles.mealDescription}>{meal.description}</p>
                <div className={styles.mealFooter}>
                  <span className={styles.cost}>${meal.cost.toFixed(2)}</span>
                  <button className={styles.addButton}>Add to Cart</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
