// Assuming the session model and subscription plan are already available

const validateSessionPlan = (session, userSubscription) => {
  // Check for Free plan
  if (userSubscription.name === "free") {
    // Free plan restrictions
    if (session.type !== "Poll") {
      throw new Error("Free plan supports only Poll sessions");
    }
    if (session.voterList.length > 100) {
      throw new Error("Free plan allows a maximum of 100 votes");
    }
  }

  // Check for Pro plan
  if (userSubscription.name === "pro") {
    // Pro plan restrictions
    if (session.voterList.length > 10000) {
      throw new Error("Pro plan allows a maximum of 10,000 votes");
    }
  }

  // Check for Enterprise plan
  if (userSubscription.name === "enterprise") {
    // Enterprise plan restrictions
    if (session.blockchainAddress && !session.isPrivateBlockchain) {
      throw new Error(
        "Enterprise plan requires a private blockchain deployment"
      );
    }
    // No limits for voters or votes
    // Full-time support is assumed to be always available for Enterprise
  }
};

// Example of usage with a session and a user’s subscription
try {
  validateSessionPlan(session, userSubscription);
  // Proceed with session creation or update
} catch (error) {
  console.error(error.message);
  // Handle the error, like showing it to the user
}
