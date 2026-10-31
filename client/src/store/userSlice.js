import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { api, post } from "../lib/api";

export const loadSession = createAsyncThunk("user/load", async () => {
  try {
    return await api("/auth/session");
  } catch {
    return null;
  }
});

export const toggleSaved = createAsyncThunk("user/toggleSaved", (id) =>
  post(`/user/saved/${id}`)
);

const userSlice = createSlice({
  name: "user",
  initialState: { current: null, ready: false },
  reducers: {
    setUser(state, action) {
      state.current = action.payload;
      state.ready = true;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadSession.fulfilled, (state, action) => {
        state.current = action.payload;
        state.ready = true;
      })
      .addCase(toggleSaved.fulfilled, (state, action) => {
        if (state.current) state.current.saved = action.payload.savedIds;
      });
  },
});

export const { setUser } = userSlice.actions;
export default userSlice.reducer;
