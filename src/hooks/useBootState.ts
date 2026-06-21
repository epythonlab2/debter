// src/hooks/useBootState.ts
import { useEffect, useReducer } from "react";
import { BootState, BootUser } from "../types/boot";

type Action =
  | { type: "HYDRATE_START" }
  | { type: "HYDRATE_SUCCESS"; user: BootUser | null }
  | { type: "HYDRATE_ERROR"; error: string }
  | { type: "AUTH_SUCCESS"; user: BootUser }
  | { type: "LOGOUT" };

interface State {
  state: BootState;
  user: BootUser | null;
  error: string | null;
}

const initialState: State = {
  state: "INIT",
  user: null,
  error: null
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "HYDRATE_START":
      return { ...state, state: "HYDRATING" };

    case "HYDRATE_SUCCESS":
      return {
        state: action.user ? "AUTHED" : "READY",
        user: action.user,
        error: null
      };

    case "HYDRATE_ERROR":
      return {
        state: "ERROR",
        user: null,
        error: action.error
      };

    case "AUTH_SUCCESS":
      return {
        state: "AUTHED",
        user: action.user,
        error: null
      };

    case "LOGOUT":
      return {
        state: "READY",
        user: null,
        error: null
      };

    default:
      return state;
  }
}

export function useBootState() {
  const [boot, dispatch] = useReducer(reducer, initialState);

  // 1. HYDRATION PHASE (runs once, deterministic)
  useEffect(() => {
    dispatch({ type: "HYDRATE_START" });

    try {
      const raw = localStorage.getItem("esale_v1_current_user");

      const user = raw ? JSON.parse(raw) : null;

      dispatch({
        type: "HYDRATE_SUCCESS",
        user
      });
    } catch (e: any) {
      dispatch({
        type: "HYDRATE_ERROR",
        error: e.message || "Boot failure"
      });
    }
  }, []);

  // 2. ACTIONS (controlled mutations)
  const login = (user: BootUser) => {
    localStorage.setItem("esale_v1_current_user", JSON.stringify(user));
    dispatch({ type: "AUTH_SUCCESS", user });
  };

  const logout = () => {
    localStorage.removeItem("esale_v1_current_user");
    dispatch({ type: "LOGOUT" });
  };

  return {
    boot,
    login,
    logout
  };
}
