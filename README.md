# Habit Tracker — Basic React Native Project

A beginner-friendly habit tracker made with React Native, Expo Router, TypeScript, and AsyncStorage. No paid API, no account, and no backend required.

## Features
- View today's habits and daily completion percentage
- Create, edit, and delete habits
- Pick an icon and color for each habit
- Mark habits complete/incomplete for today
- Save habit data on the device with AsyncStorage
- Confirmation dialog before deleting
- Responsive layout and empty state

## Run locally
1. Install Node.js LTS and VS Code.
2. Extract the ZIP and open the `habit-tracker-basic` folder in VS Code.
3. In the VS Code terminal run:

   ```bash
   npm install
   npx expo start
   ```

4. Install Expo Go on an Android phone and scan the QR code shown in the terminal/browser. You can also run `npx expo start --web` to try it in a browser.

## Notes
- This is a basic local-only app. It has no login, cloud sync, push service, or paid API.
- Each habit stores its completion dates so future streak/history features can be added correctly.
- This starter was generated as a project scaffold and has not been run on the user's device. If Expo reports dependency/version issues, run `npx expo install --fix` and then restart with `npx expo start -c`.
