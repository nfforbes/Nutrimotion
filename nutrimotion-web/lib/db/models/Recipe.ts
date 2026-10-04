/**
 * Recipe content (subscription-gated unless free or in this week's picks).
 */

import mongoose, { Schema, Model, Document } from 'mongoose';

export interface IRecipe extends Document {
  title: string;
  description: string;
  imageUrl: string;
  ingredients: string[];
  instructions: string[];
  prepTime: number;
  cookTime: number;
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  isFree: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RecipeSchema = new Schema<IRecipe>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    imageUrl: { type: String, required: true },
    ingredients: [String],
    instructions: [String],
    prepTime: { type: Number, required: true },
    cookTime: { type: Number, required: true },
    servings: { type: Number, required: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
    tags: [String],
    isFree: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Recipe: Model<IRecipe> =
  (mongoose.models.Recipe as Model<IRecipe>) || mongoose.model<IRecipe>('Recipe', RecipeSchema);
