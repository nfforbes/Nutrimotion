/**
 * Order Slice
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Order } from '@/types/commerce';

interface OrderState {
  orders: Order[];
  currentOrder: Order | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: OrderState = {
  orders: [],
  currentOrder: null,
  isLoading: false,
  error: null,
};

const orderSlice = createSlice({
  name: 'order',
  initialState,
  reducers: {
    fetchOrdersRequest: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    fetchOrdersSuccess: (state, action: PayloadAction<Order[]>) => {
      state.orders = action.payload;
      state.isLoading = false;
      state.error = null;
    },
    fetchOrdersFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    fetchOrderRequest: (state, action: PayloadAction<string>) => {
      state.isLoading = true;
      state.error = null;
    },
    fetchOrderSuccess: (state, action: PayloadAction<Order>) => {
      state.currentOrder = action.payload;
      state.isLoading = false;
      state.error = null;
    },
    fetchOrderFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    createOrderRequest: (state, action: PayloadAction<any>) => {
      state.isLoading = true;
      state.error = null;
    },
    createOrderSuccess: (state, action: PayloadAction<Order>) => {
      state.currentOrder = action.payload;
      state.orders.unshift(action.payload);
      state.isLoading = false;
      state.error = null;
    },
    createOrderFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
  },
});

export const {
  fetchOrdersRequest,
  fetchOrdersSuccess,
  fetchOrdersFailure,
  fetchOrderRequest,
  fetchOrderSuccess,
  fetchOrderFailure,
  createOrderRequest,
  createOrderSuccess,
  createOrderFailure,
} = orderSlice.actions;

export default orderSlice.reducer;
