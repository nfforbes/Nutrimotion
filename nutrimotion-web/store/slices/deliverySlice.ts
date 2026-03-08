/**
 * Delivery Slice
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { DeliveryAssignment, DriverLocation } from '@/types/delivery';

interface DeliveryState {
  assignments: DeliveryAssignment[];
  currentAssignment: DeliveryAssignment | null;
  driverLocation: DriverLocation | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: DeliveryState = {
  assignments: [],
  currentAssignment: null,
  driverLocation: null,
  isLoading: false,
  error: null,
};

const deliverySlice = createSlice({
  name: 'delivery',
  initialState,
  reducers: {
    fetchAssignmentsRequest: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    fetchAssignmentsSuccess: (state, action: PayloadAction<DeliveryAssignment[]>) => {
      state.assignments = action.payload;
      state.isLoading = false;
      state.error = null;
    },
    fetchAssignmentsFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    updateDeliveryStatusRequest: (
      state,
      action: PayloadAction<{ assignmentId: string; status: string }>
    ) => {
      state.isLoading = true;
      state.error = null;
    },
    updateDeliveryStatusSuccess: (state, action: PayloadAction<DeliveryAssignment>) => {
      const index = state.assignments.findIndex((a) => a.id === action.payload.id);
      if (index !== -1) {
        state.assignments[index] = action.payload;
      }
      if (state.currentAssignment?.id === action.payload.id) {
        state.currentAssignment = action.payload;
      }
      state.isLoading = false;
      state.error = null;
    },
    updateDeliveryStatusFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    updateDriverLocationRequest: (
      state,
      action: PayloadAction<{ lat: number; lng: number; assignmentId?: string }>
    ) => {
      state.error = null;
    },
    updateDriverLocationSuccess: (state, action: PayloadAction<DriverLocation>) => {
      state.driverLocation = action.payload;
      state.error = null;
    },
    updateDriverLocationFailure: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
    selectAssignment: (state, action: PayloadAction<DeliveryAssignment>) => {
      state.currentAssignment = action.payload;
    },
    clearCurrentAssignment: (state) => {
      state.currentAssignment = null;
    },
  },
});

export const {
  fetchAssignmentsRequest,
  fetchAssignmentsSuccess,
  fetchAssignmentsFailure,
  updateDeliveryStatusRequest,
  updateDeliveryStatusSuccess,
  updateDeliveryStatusFailure,
  updateDriverLocationRequest,
  updateDriverLocationSuccess,
  updateDriverLocationFailure,
  selectAssignment,
  clearCurrentAssignment,
} = deliverySlice.actions;

export default deliverySlice.reducer;
