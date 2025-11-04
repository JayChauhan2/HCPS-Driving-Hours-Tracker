# Driving Hours Tracker

A React Native mobile application for tracking driving practice hours, designed to help learner drivers log their required 45 hours of practice (including 15 hours of night driving).

## Features

- **Start/Stop Timer**: Track driving sessions with a large, easy-to-use circular button
- **Automatic Night Detection**: Sessions starting after 6:30 PM or before 6:00 AM are automatically marked with a 🌙 icon
- **Session History**: View all logged driving sessions with date, start time, and duration
- **Swipe to Delete**: Remove sessions by swiping left on any entry
- **Progress Tracking**: Real-time display of total hours and night hours completed
- **PDF Export**: Generate a formatted 45-Hour Driving Log ready for submission to driver education instructors
- **Persistent Storage**: All data is automatically saved locally using AsyncStorage

## Requirements

This app tracks the standard driver education requirement of:
- **45 total hours** of guided driving practice
- **15 hours** of night driving (after sunset)

## Technologies Used

- **React Native** - Mobile framework
- **Expo** - Development platform
- **AsyncStorage** - Local data persistence
- **React Native Gesture Handler** - Swipe-to-delete functionality
- **Expo Print** - PDF generation
- **Expo Sharing** - Share/export PDFs

## Installation

1. Install dependencies:
```bash
npm install @react-native-async-storage/async-storage expo-print expo-sharing @expo/vector-icons react-native-gesture-handler react-native-table-component
```

2. Run the app:
```bash
npx expo start
```

## Usage

1. **Start a Session**: Tap the circular "Start" button to begin tracking
2. **Stop a Session**: Tap again to stop - the session will be automatically logged
3. **View History**: Scroll down to see all logged sessions in the "My Activity" table
4. **Delete a Session**: Swipe left on any entry and tap the trash icon
5. **Export Hours**: Once you've completed your hours, tap "Done with Hours?" to generate and share a PDF log

## PDF Export Format

The exported PDF includes:
- Numbered session list with dates and durations
- Day/Night classification for each session
- Space for notes on driving conditions
- Total hours summary (overall and night hours)
- Parent/guardian signature section
- DMV license number field
- Date field

Perfect for submission to driver education instructors or DMV requirements.

## Code Structure

This is a single-file React Native application (`Index.tsx`) containing:
- Timer management with React hooks
- AsyncStorage integration for data persistence
- Table rendering with swipeable rows
- Modal for export confirmation
- HTML template for PDF generation

## Notes

- Sessions are sorted with newest entries at the top
- Night driving is automatically detected based on start time (after 6:30 PM or before 6:00 AM)
- All data persists between app sessions
- The app uses a clean, minimal UI with a blue and white color scheme

## License

Free to use for personal driving practice tracking.
