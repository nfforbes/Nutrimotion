/**
 * Root Saga
 */

import { all, fork } from 'redux-saga/effects';
import { watchAuth } from './authSaga';
import { watchCart } from './cartSaga';
import { watchCatalog } from './catalogSaga';
import { watchOrder } from './orderSaga';
import { watchDelivery } from './deliverySaga';

export default function* rootSaga() {
  yield all([
    fork(watchAuth),
    fork(watchCart),
    fork(watchCatalog),
    fork(watchOrder),
    fork(watchDelivery),
  ]);
}
