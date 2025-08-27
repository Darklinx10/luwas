// utils/capitalize.js

export const capitalizeWords = (str = '') =>
  str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
