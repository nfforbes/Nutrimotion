/**
 * Order Saga
 */

import { call, put, takeLatest } from 'redux-saga/effects';
import { PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import {
  fetchOrdersRequest,
  fetchOrdersSuccess,
  fetchOrdersFailure,
  fetchOrderRequest,
  fetchOrderSuccess,
  fetchOrderFailure,
  createOrderRequest,
  createOrderSuccess,
  createOrderFailure,
} from '../slices/orderSlice';
import { clearCart } from '../slices/cartSlice';

function* fetchOrdersSaga(): Generator<any, void, any> {
  try {
    const response = yield call(axios.get, '/api/orders');
    yield put(fetchOrdersSuccess(response.data));
  } catch (error: any) {
    yield put(
      fetchOrdersFailure(error?.response?.data?.message || 'Failed to fetch orders')
    );
  }
}

function* fetchOrderSaga(action: PayloadAction<string>): Generator<any, void, any> {
  try {
    const response = yield call(axios.get, `/api/orders/${action.payload}`);
    yield put(fetchOrderSuccess(response.data));
  } catch (error: any) {
    yield put(
      fetchOrderFailure(error?.response?.data?.message || 'Failed to fetch order')
    );
  }
}

function* createOrderSaga(action: PayloadAction<any>): Generator<any, void, any> {
  try {
    const response = yield call(axios.post, '/api/checkout', action.payload);
    yield put(createOrderSuccess(response.data));
    yield put(clearCart());
  } catch (error: any) {
    yield put(
      createOrderFailure(error?.response?.data?.message || 'Failed to create order')
    );
  }
}

export function* watchOrder() {
  yield takeLatest(fetchOrdersRequest.type, fetchOrdersSaga);
  yield takeLatest(fetchOrderRequest.type, fetchOrderSaga);
  yield takeLatest(createOrderRequest.type, createOrderSaga);
}
