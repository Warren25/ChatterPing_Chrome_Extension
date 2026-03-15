# ChatterPing

ChatterPing is an AI-powered Chrome extension designed to monitor online chatter, starting with Reddit, for specific keywords. It summarizes the latest opinions and notifies users through a badge and a popup panel.

## Features

- **Configurable Keyword Tracking**: Monitor mentions of any keyword/brand on Reddit via the Settings tab.
- **AI Summarization**: Uses OpenAI GPT-3.5-turbo to generate sentiment analysis and actionable summaries.
- **Tabbed Interface**: Summary, Details, and Settings tabs all within the extension popup.
- **Real-time Updates**: Badge shows mention count with live sync indicator.

## Getting Started

### Prerequisites

- Node.js and npm installed on your machine.
- A valid OpenAI API key (see setup below).

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Warren25/ChatterPing_Chrome_Extension.git
   cd ChatterPing
   ```

2. Install server dependencies:
   ```bash
   cd server
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp ../.env.example .env
   ```
   
   Then edit `server/.env` and add your OpenAI API key:
   - Get your API key from: https://platform.openai.com/api-keys
   - Add credits ($5 minimum): https://platform.openai.com/settings/organization/billing/overview

> **Note:** OpenAI charges ~$0.002 per summary (GPT-3.5-turbo). $5 = ~2,500 summaries.

### Running the Project

1. Start the server:
   ```bash
   cd server
   npm start
   ```

2. Load the Chrome extension:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `extension` directory

3. Configure the extension:
   - Click on the ChatterPing icon in the Chrome toolbar
   - Go to the **Settings** tab
   - Enter your target keyword and save

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a new branch for your feature or bug fix.
3. Make your changes and commit them.
4. Push to your branch and create a pull request.

## License

This project is open-source and available under the MIT License.