/**
 * Delivery Saga
 */

import { call, put, takeLatest } from 'redux-saga/effects';
import { PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import {
  fetchAssignmentsRequest,
  fetchAssignmentsSuccess,
  fetchAssignmentsFailure,
  updateDeliveryStatusRequest,
  updateDeliveryStatusSuccess,
  updateDeliveryStatusFailure,
  updateDriverLocationRequest,
  updateDriverLocationSuccess,
  updateDriverLocationFailure,
} from '../slices/deliverySlice';

function* fetchAssignmentsSaga(): Generator<any, void, any> {
  try {
    const response = yield call(axios.get, '/api/driver/assignments');
    yield put(fetchAssignmentsSuccess(response.data));
  } catch (error: any) {
    yield put(
      fetchAssignmentsFailure(
        error?.response?.data?.message || 'Failed to fetch assignments'
      )
    );
  }
}

function* updateDeliveryStatusSaga(
  action: PayloadAction<{ assignmentId: string; status: string }>
): Generator<any, void, any> {
  try {
    const response = yield call(
      axios.patch,
      `/api/driver/assignments/${action.payload.assignmentId}`,
      { status: action.payload.status }
    );
    yield put(updateDeliveryStatusSuccess(response.data));
  } catch (error: any) {
    yield put(
      updateDeliveryStatusFailure(
        error?.response?.data?.message || 'Failed to update delivery status'
      )
    );
  }
}

function* updateDriverLocationSaga(
  action: PayloadAction<{ lat: number; lng: number; assignmentId?: string }>
): Generator<any, void, any> {
  try {
    const response = yield call(
      axios.post,
      '/api/driver/location',
      action.payload
    );
    yield put(updateDriverLocationSuccess(response.data));
  } catch (error: any) {
    yield put(
      updateDriverLocationFailure(
        error?.response?.data?.message || 'Failed to update location'
      )
    );
  }
}

export function* watchDelivery() {
  yield takeLatest(fetchAssignmentsRequest.type, fetchAssignmentsSaga);
  yield takeLatest(updateDeliveryStatusRequest.type, updateDeliveryStatusSaga);
  yield takeLatest(updateDriverLocationRequest.type, updateDriverLocationSaga);
}
