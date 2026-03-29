/**
 * Cart Saga
 */

import { call, put, takeLatest } from 'redux-saga/effects';
import { PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import {
  fetchCartRequest,
  fetchCartSuccess,
  fetchCartFailure,
  addToCartRequest,
  addToCartSuccess,
  addToCartFailure,
  removeFromCartRequest,
  removeFromCartSuccess,
  removeFromCartFailure,
  updateCartItemRequest,
  updateCartItemSuccess,
  updateCartItemFailure,
  applyDiscountRequest,
  applyDiscountSuccess,
  applyDiscountFailure,
  removeDiscountRequest,
  removeDiscountSuccess,
  removeDiscountFailure,
} from '../slices/cartSlice';

function* fetchCartSaga(): Generator<any, void, any> {
  try {
    const response = yield call(axios.get, '/api/cart');
    yield put(fetchCartSuccess(response.data));
  } catch (error: any) {
    yield put(
      fetchCartFailure(error?.response?.data?.message || 'Failed to fetch cart')
    );
  }
}

function* addToCartSaga(action: PayloadAction<any>): Generator<any, void, any> {
  try {
    const response = yield call(axios.post, '/api/cart/items', action.payload);
    yield put(addToCartSuccess(response.data));
  } catch (error: any) {
    yield put(
      addToCartFailure(error?.response?.data?.message || 'Failed to add to cart')
    );
  }
}

function* removeFromCartSaga(action: PayloadAction<string>): Generator<any, void, any> {
  try {
    const response = yield call(
      axios.delete,
      `/api/cart/items/${action.payload}`
    );
    yield put(removeFromCartSuccess(response.data));
  } catch (error: any) {
    yield put(
      removeFromCartFailure(
        error?.response?.data?.message || 'Failed to remove from cart'
      )
    );
  }
}

function* updateCartItemSaga(
  action: PayloadAction<{ itemId: string; quantity: number }>
): Generator<any, void, any> {
  try {
    const response = yield call(
      axios.patch,
      `/api/cart/items/${action.payload.itemId}`,
      { quantity: action.payload.quantity }
    );
    yield put(updateCartItemSuccess(response.data));
  } catch (error: any) {
    yield put(
      updateCartItemFailure(
        error?.response?.data?.message || 'Failed to update cart item'
      )
    );
  }
}

function* applyDiscountSaga(action: PayloadAction<string>): Generator<any, void, any> {
  try {
    const response = yield call(axios.post, '/api/cart/discount', {
      code: action.payload,
    });
    yield put(applyDiscountSuccess(response.data));
  } catch (error: any) {
    const msg =
      error?.response?.data?.error ||
      error?.response?.data?.message ||
      'Failed to apply coupon';
    yield put(applyDiscountFailure(msg));
  }
}

function* removeDiscountSaga(): Generator<any, void, any> {
  try {
    const response = yield call(axios.delete, '/api/cart/discount');
    yield put(removeDiscountSuccess(response.data));
  } catch (error: any) {
    const msg =
      error?.response?.data?.error ||
      error?.response?.data?.message ||
      'Failed to remove coupon';
    yield put(removeDiscountFailure(msg));
  }
}

export function* watchCart() {
  yield takeLatest(fetchCartRequest.type, fetchCartSaga);
  yield takeLatest(addToCartRequest.type, addToCartSaga);
  yield takeLatest(removeFromCartRequest.type, removeFromCartSaga);
  yield takeLatest(updateCartItemRequest.type, updateCartItemSaga);
  yield takeLatest(applyDiscountRequest.type, applyDiscountSaga);
  yield takeLatest(removeDiscountRequest.type, removeDiscountSaga);
}
