/**
 * Catalog Slice
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { MealPackage, TrainingPackage, Book, Recipe, VideoAsset } from '@/types/catalog';

interface CatalogState {
  meals: MealPackage[];
  training: TrainingPackage[];
  books: Book[];
  recipes: Recipe[];
  videos: VideoAsset[];
  isLoading: boolean;
  error: string | null;
}

const initialState: CatalogState = {
  meals: [],
  training: [],
  books: [],
  recipes: [],
  videos: [],
  isLoading: false,
  error: null,
};

const catalogSlice = createSlice({
  name: 'catalog',
  initialState,
  reducers: {
    fetchMealsRequest: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    fetchMealsSuccess: (state, action: PayloadAction<MealPackage[]>) => {
      state.meals = action.payload;
      state.isLoading = false;
      state.error = null;
    },
    fetchMealsFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    fetchTrainingRequest: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    fetchTrainingSuccess: (state, action: PayloadAction<TrainingPackage[]>) => {
      state.training = action.payload;
      state.isLoading = false;
      state.error = null;
    },
    fetchTrainingFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    fetchBooksRequest: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    fetchBooksSuccess: (state, action: PayloadAction<Book[]>) => {
      state.books = action.payload;
      state.isLoading = false;
      state.error = null;
    },
    fetchBooksFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    fetchRecipesRequest: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    fetchRecipesSuccess: (state, action: PayloadAction<Recipe[]>) => {
      state.recipes = action.payload;
      state.isLoading = false;
      state.error = null;
    },
    fetchRecipesFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    fetchVideosRequest: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    fetchVideosSuccess: (state, action: PayloadAction<VideoAsset[]>) => {
      state.videos = action.payload;
      state.isLoading = false;
      state.error = null;
    },
    fetchVideosFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
  },
});

export const {
  fetchMealsRequest,
  fetchMealsSuccess,
  fetchMealsFailure,
  fetchTrainingRequest,
  fetchTrainingSuccess,
  fetchTrainingFailure,
  fetchBooksRequest,
  fetchBooksSuccess,
  fetchBooksFailure,
  fetchRecipesRequest,
  fetchRecipesSuccess,
  fetchRecipesFailure,
  fetchVideosRequest,
  fetchVideosSuccess,
  fetchVideosFailure,
} = catalogSlice.actions;

export default catalogSlice.reducer;
