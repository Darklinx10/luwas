export function calculateAge(dateString) {
  const today = new Date();
  const birthDate = new Date(dateString);
  if (isNaN(birthDate)) return '';

  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
}
