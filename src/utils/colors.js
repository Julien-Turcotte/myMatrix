// Generate a consistent color for a given username
const USER_COLORS = [
  '#89b4fa', // blue
  '#a6e3a1', // green
  '#fab387', // peach
  '#f38ba8', // red
  '#cba6f7', // mauve
  '#f9e2af', // yellow
  '#94e2d5', // teal
  '#89dceb', // sky
  '#b4befe', // lavender
  '#eba0ac', // maroon
];

export function getUserColor(userId) {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    hash |= 0;
  }
  const index = Math.abs(hash) % USER_COLORS.length;
  return USER_COLORS[index];
}

export function formatTimestamp(ts) {
  const date = new Date(ts);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}
