# Barbershopapp-Frontend

A mobile application built with Expo and React Native, providing a platform for barbers and customers to manage appointments, profiles, and services.

## Key Features & Benefits

*   **User Authentication:** Secure signup and login functionality.
*   **Dashboard:**  Overview of key information for both barbers and customers.
*   **Appointment Management:**  Book, view, and manage appointments.
*   **Profile Management:**  Barbers and customers can update their profile information.
*   **Push Notifications:** Receive real-time updates and reminders via push notifications.

## Prerequisites & Dependencies

Before you begin, ensure you have the following installed:

*   **Node.js:**  Version 16 or higher.  Download from [nodejs.org](https://nodejs.org/).
*   **npm or Yarn:**  Node package manager.  npm is included with Node.js; Yarn can be installed globally via npm: `npm install -g yarn`.
*   **Expo CLI:**  Install globally using npm: `npm install -g expo-cli`.
*   **Expo Go App:**  Download the Expo Go app on your iOS or Android device.
*   **Android Studio or Xcode (Optional):** For running on emulators/simulators or building native binaries.
*   **@react-native-async-storage/async-storage:** For local storage
*   **expo-router:** For routing

## Installation & Setup Instructions

Follow these steps to get the project up and running on your local machine:

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/AvielEsperansa/Barbershopapp-Frontend.git
    cd Barbershopapp-Frontend
    ```

2.  **Install dependencies:**

    ```bash
    npm install  # or yarn install
    ```

3.  **Configure API Base URL:**

    *   Open the `config.js` file located in the project root.
    *   Modify the `BASE_URL` to point to your backend server's address.

        ```javascript
        // config.js
        const config = {
            BASE_URL: 'http://your-backend-server-address:4000'
        }
        export default config;
        ```

4.  **Start the Expo development server:**

    ```bash
    npx expo start # or yarn expo start
    ```

    This will open the Expo DevTools in your browser.

5.  **Run the App:**

    *   **Using the Expo Go App:**  Scan the QR code displayed in the Expo DevTools with the Expo Go app on your iOS or Android device.
    *   **Using an Emulator/Simulator:**  Click on the "Run on Android emulator" or "Run on iOS simulator" option in the Expo DevTools.  Make sure you have Android Studio or Xcode installed and configured correctly.

## Usage Examples & API Documentation

### Setting up environment variables
The App connects to a backend server, make sure that the Base URL is correct by checking the `config.js` file.

### API Calls

The `lib/apiClient.js` file provides a wrapper for making API calls. It handles token management and automatic refreshing of access tokens.

**Example: Making a GET request**

```javascript
import ApiClient from './lib/apiClient';

const apiClient = new ApiClient();

async function fetchData() {
    try {
        const response = await apiClient.get('/appointments');
        console.log(response.data);
    } catch (error) {
        console.error("Error fetching data:", error);
    }
}
```

**Example: Making a POST request**

```javascript
import ApiClient from './lib/apiClient';

const apiClient = new ApiClient();

async function createAppointment(appointmentData) {
    try {
        const response = await apiClient.post('/appointments', appointmentData);
        console.log("Appointment created:", response.data);
    } catch (error) {
        console.error("Error creating appointment:", error);
    }
}
```

## Configuration Options

*   **`config.js`:**  Contains the `BASE_URL` setting, allowing you to easily point the frontend to different backend environments.

## Contributing Guidelines

Contributions are welcome! To contribute to this project, follow these steps:

1.  Fork the repository.
2.  Create a new branch for your feature or bug fix.
3.  Make your changes and commit them with descriptive commit messages.
4.  Push your branch to your forked repository.
5.  Submit a pull request to the main repository.

## License Information

This project does not specify a license. All rights are reserved by the owner, AvielEsperansa.

## Acknowledgments

*   This project uses the Expo framework and React Native.
*   The `@react-native-async-storage/async-storage` library is used for local data storage.
*   The `expo-router` library is used for navigation.
