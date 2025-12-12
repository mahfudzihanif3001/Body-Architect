import { createSlice } from "@reduxjs/toolkit";

const token = localStorage.getItem("access_token");
const role = localStorage.getItem("role");
const username = localStorage.getItem("username");

const initialState = {
  isLoggedIn: !!token, 
  role: role || "",
  username: username || "",
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginUser: (state, action) => {
      const { role, username } = action.payload;
      state.isLoggedIn = true;
      state.role = role;
      state.username = username;
    },
    logoutUser: (state) => {
      state.isLoggedIn = false;
      state.role = "";
      state.username = "";
    },
  },
});

export const { loginUser, logoutUser } = authSlice.actions;
export default authSlice.reducer;