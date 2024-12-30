# Solpot Bot - Multi-Account Daily Case Automation

An automation bot for claiming daily cases on Solpot with multi-account support.

## Features

- Multi-account support
- Daily case auto-claim
- Beautiful console output with colors
- Countdown timer display
- Error handling and auto-retry
- Account status monitoring

## Prerequisites

- Node.js >= 14.x
- NPM >= 6.x
- A Solpot account (Register [here](https://solpot.com/r/Galkurta))

## Installation

1. Clone the repository:

```bash
git clone https://github.com/Galkurta/Solpot-Bot.git
cd Solpot-Bot
```

2. Install dependencies:

```bash
npm install
```

3. Edit `data.txt` file in the root directory and add your account cookies (one per line):

```
cookie_account_1
cookie_account_2
cookie_account_3
```

### How to Get Your Cookie

1. Go to [Solpot](https://solpot.com) and login to your account
2. Open Chrome DevTools:

   - Press `F12` or
   - Right-click anywhere and select "Inspect" or
   - Press `Ctrl + Shift + I` (Windows/Linux) or `Cmd + Option + I` (Mac)

3. Go to Network tab in DevTools:

   - Click on the "Network" tab
   - Make sure "Preserve log" is checked

4. Get the cookie:
   - Go to any page on Solpot
   - In Network tab, find any request to `solpot.com`
   - Click on the request
   - In the Headers section, scroll down to find "Cookie"
   - Copy the entire value that starts with `solpotsid=`

Example of cookie format:

```
solpotsid=x%3Au%3A3A75fe516857...rest_of_cookie_value
```

**Note**: Do not share your cookies with anyone. They provide full access to your account.

## Configuration

The bot uses several configuration files located in the `config` folder:

- `banner.js` - ASCII art banner configuration
- `colors.js` - Console color scheme configuration
- `countdown.js` - Countdown timer configuration
- `logger.js` - Logging configuration

### Main Configuration Options

You can modify these constants in `main.js`:

```javascript
// Time between account processing
TIME.DELAY_BETWEEN_ACCOUNTS = 5; // seconds

// API endpoints
API.BASE_URL = "https://solpot.com";
API.ENDPOINTS = {
  PROFILE: "/api/profile/info",
  DAILY_CASE: "/api/daily-case/open",
};
```

## Usage

1. Start the bot:

```bash
node main.js
```

2. The bot will:
   - Load all accounts from data.txt
   - Process each account sequentially
   - Wait 5 seconds between accounts
   - Wait 24 hours before starting the next cycle

## Output Example

```
=== New Cycle Started ===
Account 1 Profile:
Telegram: user1
Referred By: referrer1
Daily case opened successfully!
Target Block: 412635997

=== Processing Account 2/3 ===
Account 2 Profile:
Telegram: user2
Referred By: referrer2
Daily case already claimed for today

[...continues for all accounts]
```

## Important Notes

1. **Security**

   - Keep your `data.txt` file secure
   - Don't share your cookies
   - Use at your own risk

2. **Rate Limiting**

   - The bot includes a delay between accounts to prevent rate limiting
   - Modify `TIME.DELAY_BETWEEN_ACCOUNTS` if needed

3. **Cookies**
   - Update cookies in `data.txt` if they expire
   - One cookie per line
   - Make sure there are no empty lines

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contributing

Contributions, issues, and feature requests are welcome!
