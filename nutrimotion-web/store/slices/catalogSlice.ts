/**
 * Catalog Slice
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  MealPackage,
  TrainingPackage,
  Book,
  Recipe,
  VideoAsset,
  ContentAccess,
  ContentLibraryResponse,
} from '@/types/catalog';

interface CatalogState {
  meals: MealPackage[];
  training: TrainingPackage[];
  books: Book[];
  recipes: Recipe[];
  recipesAccess: ContentAccess | null;
  videos: VideoAsset[];
  videosAccess: ContentAccess | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: CatalogState = {
  meals: [],
  training: [],
  books: [],
  recipes: [],
  recipesAccess: null,
  videos: [],
  videosAccess: null,
  isLoading: false,
  error: null,
};

function accessOf<T>(response: ContentLibraryResponse<T>): ContentAccess {
  return {
    subscribed: response.subscribed,
    total: response.total,
    lockedCount: response.lockedCount,
    monthlyPrice: response.monthlyPrice,
  };
}

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
    fetchRecipesSuccess: (state, action: PayloadAction<ContentLibraryResponse<Recipe>>) => {
      state.recipes = action.payload.items ?? [];
      state.recipesAccess = accessOf(action.payload);
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
    fetchVideosSuccess: (state, action: PayloadAction<ContentLibraryResponse<VideoAsset>>) => {
      state.videos = action.payload.items ?? [];
      state.videosAccess = accessOf(action.payload);
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
