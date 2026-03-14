# ChatterPing

ChatterPing is an AI-powered Chrome extension designed to monitor online chatter, starting with Reddit, for specific keywords. It summarizes the latest opinions and notifies users through a badge and a popup panel.

## Features

- **Keyword Tracking**: Monitors mentions of a hardcoded keyword ("CentralDispatch") on Reddit.
- **Summarization**: Utilizes OpenAI's API to summarize the latest mentions.
- **User Notifications**: Displays a red badge with the count of unread mentions and a popup panel with recent mentions and summaries.
- **Local Storage**: Stores mentions locally using SQLite for development.

## Getting Started

### Prerequisites

- Node.js and npm installed on your machine.
- A valid OpenAI API key (see setup below).

### Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd ChatterPing
   ```

2. Install dependencies for both the extension and server:
   ```
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env`:
     ```
     cp server/.env.example server/.env
     ```
   - Get your OpenAI API key from: https://platform.openai.com/api-keys
   - Add credits to your OpenAI account ($5 minimum): https://platform.openai.com/settings/organization/billing/overview
   - Add your key to `server/.env`:
     ```
     OPENAI_API_KEY=sk-your-key-here
     ```

> **Note:** OpenAI charges ~$0.002 per summary (GPT-3.5-turbo). $5 = ~2,500 summaries.

### Running the Project

1. Start the server:
   ```
   cd server
   npm start
   ```

2. Load the Chrome extension:
   - Open Chrome and navigate to `chrome://extensions/`.
   - Enable "Developer mode".
   - Click "Load unpacked" and select the `extension` directory.

3. Use the extension:
   - Click on the ChatterPing icon in the Chrome toolbar to open the popup and view the latest summaries.

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a new branch for your feature or bug fix.
3. Make your changes and commit them.
4. Push to your branch and create a pull request.

## License

This project is open-source and available under the MIT License.