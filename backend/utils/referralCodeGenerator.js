
const { v4: uuidv4 } = require('uuid');

const generateReferralCode = () => {
  // Generate a shortened UUID-based code
  const fullUuid = uuidv4();
  // Take first 8 characters of UUID to create a shorter referral code
  return fullUuid.split('-')[0];
};

module.exports = generateReferralCode;
