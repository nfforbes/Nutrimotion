/**
 * Catalog Saga
 */

import { call, put, takeLatest } from 'redux-saga/effects';
import axios from 'axios';
import {
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
} from '../slices/catalogSlice';

function* fetchMealsSaga(): Generator<any, void, any> {
  try {
    const response = yield call(axios.get, '/api/meals');
    yield put(fetchMealsSuccess(response.data));
  } catch (error: any) {
    yield put(
      fetchMealsFailure(error?.response?.data?.message || 'Failed to fetch meals')
    );
  }
}

function* fetchTrainingSaga(): Generator<any, void, any> {
  try {
    const response = yield call(axios.get, '/api/training');
    yield put(fetchTrainingSuccess(response.data));
  } catch (error: any) {
    yield put(
      fetchTrainingFailure(
        error?.response?.data?.message || 'Failed to fetch training'
      )
    );
  }
}

function* fetchBooksSaga(): Generator<any, void, any> {
  try {
    const response = yield call(axios.get, '/api/books');
    yield put(fetchBooksSuccess(response.data));
  } catch (error: any) {
    yield put(
      fetchBooksFailure(error?.response?.data?.message || 'Failed to fetch books')
    );
  }
}

function* fetchRecipesSaga(): Generator<any, void, any> {
  try {
    const response = yield call(axios.get, '/api/recipes');
    yield put(fetchRecipesSuccess(response.data));
  } catch (error: any) {
    yield put(
      fetchRecipesFailure(
        error?.response?.data?.message || 'Failed to fetch recipes'
      )
    );
  }
}

function* fetchVideosSaga(): Generator<any, void, any> {
  try {
    const response = yield call(axios.get, '/api/videos');
    yield put(fetchVideosSuccess(response.data));
  } catch (error: any) {
    yield put(
      fetchVideosFailure(error?.response?.data?.message || 'Failed to fetch videos')
    );
  }
}

export function* watchCatalog() {
  yield takeLatest(fetchMealsRequest.type, fetchMealsSaga);
  yield takeLatest(fetchTrainingRequest.type, fetchTrainingSaga);
  yield takeLatest(fetchBooksRequest.type, fetchBooksSaga);
  yield takeLatest(fetchRecipesRequest.type, fetchRecipesSaga);
  yield takeLatest(fetchVideosRequest.type, fetchVideosSaga);
}
