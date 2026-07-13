/**
 * Catalog and Content Types
 */

export enum MealSlot {
  BREAKFAST = 'breakfast',
  LUNCH = 'lunch',
  SMOOTHIES = 'smoothies',
  JUICE_SHOT = 'juice_shot',
}

export interface MealPackage {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  price: number;
  instagramLink?: string;
  slot: MealSlot;
  scheduledDate: Date;
  available: boolean;
  ingredients?: string[];
  nutritionInfo?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface TrainingPackage {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  price: number;
  duration: string; // e.g., "4 weeks", "12 sessions"
  level: 'beginner' | 'intermediate' | 'advanced';
  includes: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  description: string;
  coverImageUrl: string;
  price: number;
  pdfUrl: string; // Secured with DRM
  pageCount?: number;
  isbn?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  ingredients: string[];
  instructions: string[];
  prepTime: number; // minutes
  cookTime: number; // minutes
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface VideoAsset {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  videoUrl: string; // Link to cloud storage
  duration: number; // seconds
  category: 'cooking' | 'training';
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface MealSchedule {
  id: string;
  date: Date;
  breakfast: MealPackage[];
  lunch: MealPackage[];
  smoothies: MealPackage[];
  juice_shot: MealPackage[];
}
