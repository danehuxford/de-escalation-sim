export const scoringConfig = {
  profanity: ["fuck", "shit", "bitch", "asshole"],
  empathy: {
    phrases: {
      strong: [
        "i understand",
        "i'm sorry",
        "im sorry",
        "that sounds",
        "i can see",
        "thank you for",
        "it makes sense"
      ],
      courtesy: ["please", "thank you", "appreciate"],
      negative: ["calm down", "relax", "listen"],
      terse: ["be quiet", "silence"]
    },
    deltas: {
      strong: 2,
      courtesy: 1,
      negative: -2,
      terse: -1,
      profanity: -3
    },
    clamp: { min: -5, max: 5 }
  },
  clarity: {
    phrases: {
      structured: [
        "here's what",
        "next",
        "first",
        "then",
        "in a moment",
        "what will happen",
        "we're going to"
      ]
    },
    deltas: {
      structured: 2,
      timeEstimate: 1,
      longMessage: -2,
      manyQuestions: -1
    },
    timeEstimateRegex: "\\b(\\d{1,2})\\s?(min|mins|minutes)\\b",
    longMessageThreshold: 60,
    manyQuestionsThreshold: 3,
    clamp: { min: -5, max: 5 }
  },
  boundary: {
    phrases: {
      firm: [
        "i can't",
        "i cannot",
        "i'm not able to",
        "for safety",
        "i need you to",
        "we need to",
        "i can help you with",
        "what i can do is"
      ],
      options: ["options", "choices", "you can either"],
      threats: ["or else"]
    },
    callSecurityPhrase: "i'll call security",
    deltas: {
      firm: 2,
      options: 1,
      threats: -2,
      callSecurity: -2
    },
    clamp: { min: -5, max: 5 }
  },
  escalation: {
    phrases: {
      escalation: ["stop", "now", "immediately", "shut up"],
      terse: ["be quiet", "silence", "quiet", "enough"],
      demands: ["you have to", "you need to"],
      calming: ["i understand", "thank you", "please", "let's", "take a breath"]
    },
    deltas: {
      escalation: 1,
      calming: -1
    },
    allCapsThreshold: { letters: 10, ratio: 0.7 },
    clamp: { min: -1, max: 1 }
  },
  sessionClamps: {
    empathy: { min: 0, max: 100 },
    clarity: { min: 0, max: 100 },
    boundary: { min: 0, max: 100 },
    escalation: { min: 0, max: 5 }
  },
  readiness: {
    ready: { escalationMax: 1, empathyMin: 55 },
    developing: { escalationMax: 3 },
    needsSupport: { escalationMin: 4 }
  }
};
