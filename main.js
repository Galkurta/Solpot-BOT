const fs = require("fs");
const axios = require("axios");
const displayBanner = require("./config/banner");
const logger = require("./config/logger");
const CountdownTimer = require("./config/countdown");
const colors = require("./config/colors");

// API Configuration
const API = {
  BASE_URL: "https://solpot.com",
  ENDPOINTS: {
    PROFILE: "/api/profile/info",
    DAILY_CASE: "/api/daily-case/open",
  },
};

// File Configuration
const FILES = {
  ACCOUNTS: "data.txt",
};

// Time Constants
const TIME = {
  SECONDS_PER_MINUTE: 60,
  MINUTES_PER_HOUR: 60,
  HOURS_PER_DAY: 24,
  DELAY_BETWEEN_ACCOUNTS: 5, // 5 seconds delay between accounts
  get SECONDS_PER_DAY() {
    return this.SECONDS_PER_MINUTE * this.MINUTES_PER_HOUR * this.HOURS_PER_DAY;
  },
};

// Request Headers
const HEADERS = {
  DEFAULT: {
    authority: "solpot.com",
    accept: "*/*",
    "accept-encoding": "gzip, deflate, br",
    "accept-language": "en-US,en;q=0.9",
    "content-type": "application/json",
    origin: "https://solpot.com",
    "user-agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  },
};

// Timer Configuration
const TIMER = {
  DEFAULT_MESSAGE: "Time remaining: ",
  FORMAT: "HH:mm:ss",
};

// Messages
const MESSAGES = {
  ERROR: {
    ACCOUNTS_READ: "Error reading accounts file",
    PROFILE_FETCH: "Error fetching profile",
    DAILY_CASE: "Error opening daily case",
    TIMER: "Timer error",
    CYCLE: "Cycle error",
    FATAL: "Fatal error",
    NO_ACCOUNTS: "No accounts found in data file",
  },
  INFO: {
    START: "Starting Solpot automation...",
    NEW_CYCLE: "=== New Cycle Started ===",
    CYCLE_COMPLETE: "=== Cycle Completed ===",
    WAITING_CYCLE: "Waiting for next cycle",
    CASE_CLAIMED: "Daily case already claimed for today",
    CASE_SUCCESS: "Daily case opened successfully!",
    TOTAL_ACCOUNTS: "Total accounts loaded: ",
    PROCESSING_ACCOUNT: "Processing account",
  },
  WARN: {
    PROFILE_RETRY: "Profile check failed, retrying in 24 hours",
    CASE_RETRY: "Daily case failed, retrying in 24 hours",
    SHUTDOWN: "Gracefully shutting down...",
    CYCLE_RESTART: "Restarting cycle in 24 hours",
  },
};

// Read accounts from file
function getAccounts() {
  try {
    const content = fs.readFileSync(FILES.ACCOUNTS, "utf8");
    const accounts = content.split("\n").filter((line) => line.trim());

    if (accounts.length === 0) {
      logger.error(MESSAGES.ERROR.NO_ACCOUNTS);
      process.exit(1);
    }

    return accounts;
  } catch (error) {
    logger.error(`${MESSAGES.ERROR.ACCOUNTS_READ}: ${error.message}`);
    process.exit(1);
  }
}

// Create axios instance with common configuration
function createAxiosInstance(cookie) {
  return axios.create({
    baseURL: API.BASE_URL,
    headers: { ...HEADERS.DEFAULT, cookie },
  });
}

// API functions
async function getUserProfile(api, accountIndex) {
  try {
    const response = await api.post(API.ENDPOINTS.PROFILE);
    const data = response.data;

    if (data.success) {
      logger.info(`Account ${accountIndex + 1} Profile:`);
      logger.custom(
        `Telegram: ${colors.accountName}${data.data.telegram.username}${colors.reset}`
      );
      logger.custom(
        `Referred By: ${colors.accountInfo}${data.data.referredBy}${colors.reset}`
      );
      return true;
    } else {
      logger.error(
        `Account ${accountIndex + 1} - Failed to get profile - ${
          data.error || "Unknown error"
        }`
      );
      return false;
    }
  } catch (error) {
    if (error.response) {
      logger.error(
        `Account ${accountIndex + 1} - Error: ${
          error.response.data.error || "Unknown error"
        }`
      );
    } else {
      logger.error(
        `Account ${accountIndex + 1} - ${MESSAGES.ERROR.PROFILE_FETCH}: ${
          error.message
        }`
      );
    }
    return false;
  }
}

async function openDailyCase(api, accountIndex) {
  try {
    const response = await api.post(API.ENDPOINTS.DAILY_CASE, { demo: false });
    const data = response.data;

    if (data.success) {
      logger.success(
        `Account ${accountIndex + 1} - ${MESSAGES.INFO.CASE_SUCCESS}`
      );
      logger.info(
        `Account ${accountIndex + 1} - Target Block: ${colors.taskComplete}${
          data.data.targetBlock
        }${colors.reset}`
      );
      return true;
    } else {
      if (data.error && data.error.includes("once per day")) {
        logger.info(
          `Account ${accountIndex + 1} - ${colors.taskComplete}${
            MESSAGES.INFO.CASE_CLAIMED
          }${colors.reset}`
        );
        return true;
      } else {
        logger.error(
          `Account ${accountIndex + 1} - Failed to open daily case - ${
            data.error || "Unknown error"
          }`
        );
        return false;
      }
    }
  } catch (error) {
    if (error.response) {
      logger.error(
        `Account ${accountIndex + 1} - Error: ${
          error.response.data.error || "Unknown error"
        }`
      );
    } else {
      logger.error(
        `Account ${accountIndex + 1} - ${MESSAGES.ERROR.DAILY_CASE}: ${
          error.message
        }`
      );
    }
    return false;
  }
}

// Sleep function with countdown
async function sleep(seconds, message) {
  try {
    const timer = new CountdownTimer({
      message: message || TIMER.DEFAULT_MESSAGE,
      format: TIMER.FORMAT,
      colors: {
        message: colors.timerCount,
        timer: colors.timerWarn,
        reset: colors.reset,
      },
      clearOnComplete: true,
    });
    await timer.start(seconds);
  } catch (error) {
    logger.error(`${MESSAGES.ERROR.TIMER}: ${error.message}`);
  }
}

// Process single account
async function processAccount(cookie, index, totalAccounts) {
  logger.info(
    `${colors.menuBorder}=== Processing Account ${
      index + 1
    }/${totalAccounts} ===${colors.reset}`
  );

  const api = createAxiosInstance(cookie);

  // Get user profile
  const profileSuccess = await getUserProfile(api, index);
  if (!profileSuccess) return false;

  // Open daily case
  const caseSuccess = await openDailyCase(api, index);
  if (!caseSuccess) return false;

  return true;
}

// Main automation function
async function startAutomation() {
  try {
    displayBanner();
    logger.info(`${colors.brightCyan}${MESSAGES.INFO.START}${colors.reset}`);

    while (true) {
      try {
        const accounts = getAccounts();
        logger.info(`${MESSAGES.INFO.TOTAL_ACCOUNTS}${accounts.length}`);

        logger.info(
          `${colors.menuBorder}${MESSAGES.INFO.NEW_CYCLE}${colors.reset}`
        );

        // Process each account
        for (let i = 0; i < accounts.length; i++) {
          await processAccount(accounts[i].trim(), i, accounts.length);

          // Add delay between accounts except for the last one
          if (i < accounts.length - 1) {
            await sleep(TIME.DELAY_BETWEEN_ACCOUNTS, "Next account in: ");
          }
        }

        logger.info(
          `${colors.menuBorder}${MESSAGES.INFO.CYCLE_COMPLETE}${colors.reset}`
        );
        logger.info(MESSAGES.INFO.WAITING_CYCLE);
        await sleep(TIME.SECONDS_PER_DAY, "Next cycle in: ");
      } catch (error) {
        logger.error(`${MESSAGES.ERROR.CYCLE}: ${error.message}`);
        logger.warn(MESSAGES.WARN.CYCLE_RESTART);
        await sleep(TIME.SECONDS_PER_DAY, "Restart in: ");
      }
    }
  } catch (error) {
    logger.error(`${MESSAGES.ERROR.FATAL}: ${error.message}`);
    process.exit(1);
  }
}

// Handle process termination
process.on("SIGINT", () => {
  logger.warn(MESSAGES.WARN.SHUTDOWN);
  process.exit(0);
});

process.on("unhandledRejection", (error) => {
  logger.error(`Unhandled Promise Rejection: ${error.message}`);
});

// Start the automation
startAutomation();
