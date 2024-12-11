import React from 'react';
import { NavigationContainer, NavigationIndependentTree } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './screens/HomeScreen';
import RentalScreen from './screens/RentalScreen';
import CustomerScreen from './screens/CustomerScreen';
import ManageMaterialsScreen from './screens/ManageMaterialsScreen';
import AvailableItemsScreen from './screens/AvailableItemsScreen';
import ReportScreen from './screens/ReportScreen';


const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationIndependentTree>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Home">
          <Stack.Screen name="Available Items" component={AvailableItemsScreen} />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Report" component={ReportScreen} />
          <Stack.Screen name="Rental" component={RentalScreen} />
          <Stack.Screen name="Customer" component={CustomerScreen} />
          <Stack.Screen name="Upload Materials" component={ManageMaterialsScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </NavigationIndependentTree>
  );
}

