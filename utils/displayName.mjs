// Examples:
//   formatUserDisplayName({ first_name: 'Άννα', last_name: 'Κ' })  // 'Άννα Κ'
//   formatUserDisplayName({ first_name: 'Άννα' })                  // 'Άννα'
//   formatUserDisplayName(null, '-')                               // '-'
//   formatUserDisplayName({}, '-')                                 // '-'
export const formatUserDisplayName = (user, fallback = null) => {
    if (!user) return fallback;
    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
    return fullName || fallback;
};
