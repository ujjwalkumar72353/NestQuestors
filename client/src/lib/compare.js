import { useSyncExternalStore } from "react";

const KEY = "compare";
export const MAX_COMPARE = 3;

const read = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || [];
  } catch {
    return [];
  }
};

let items = read();
const listeners = new Set();

const write = (next) => {
  items = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
  listeners.forEach((listener) => listener());
};

export const toggleCompare = ({ _id, name }) => {
  if (items.some((item) => item._id === _id)) {
    write(items.filter((item) => item._id !== _id));
    return true;
  }
  if (items.length >= MAX_COMPARE) return false;
  write([...items, { _id, name }]);
  return true;
};

export const clearCompare = () => write([]);

export const useCompare = () =>
  useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => items
  );
