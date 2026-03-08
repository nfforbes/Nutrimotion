/**
 * Auth Saga
 */

import { call, put, takeLatest } from 'redux-saga/effects';
import axios from 'axios';
import {
  fetchUserRequest,
  fetchUserSuccess,
  fetchUserFailure,
} from '../slices/authSlice';

function* fetchUserSaga(): Generator<any, void, any> {
  try {
    const response = yield call(axios.get, '/api/auth/me');
    yield put(fetchUserSuccess(response.data));
  } catch (error: any) {
    yield put(
      fetchUserFailure(error?.response?.data?.message || 'Failed to fetch user')
    );
  }
}

export function* watchAuth() {
  yield takeLatest(fetchUserRequest.type, fetchUserSaga);
}
