/**
 * Auth Slice
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UserRole, Permission } from '@/types/auth';

interface AuthState {
  user: {
    id: string;
    email: string;
    name: string;
    picture?: string;
  } | null;
  roles: UserRole[];
  permissions: Permission[];
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  roles: [],
  permissions: [],
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    fetchUserRequest: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    fetchUserSuccess: (
      state,
      action: PayloadAction<{
        user: AuthState['user'];
        roles: UserRole[];
        permissions: Permission[];
      }>
    ) => {
      state.user = action.payload.user;
      state.roles = action.payload.roles;
      state.permissions = action.payload.permissions;
      state.isAuthenticated = true;
      state.isLoading = false;
      state.error = null;
    },
    fetchUserFailure: (state, action: PayloadAction<string>) => {
      state.user = null;
      state.roles = [];
      state.permissions = [];
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.roles = [];
      state.permissions = [];
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;
    },
  },
});

export const { fetchUserRequest, fetchUserSuccess, fetchUserFailure, logout } =
  authSlice.actions;

export default authSlice.reducer;
