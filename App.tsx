import React from 'react';
import {StatusBar} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import CalendarScreen from './src/screens/CalendarScreen';
import {C} from './src/theme';

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      <CalendarScreen />
    </SafeAreaProvider>
  );
}
