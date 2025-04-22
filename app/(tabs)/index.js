import React from 'react';
import { NavigationContainer, NavigationIndependentTree } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '@/app/screens/HomeScreen';
import RentalScreen from '@/app/screens/RentalScreen';
import CustomerScreen from '@/app/screens/CustomerScreen';
import ManageMaterialsScreen from '@/app/screens/ManageMaterialsScreen';
import AvailableItemsScreen from '@/app/screens/AvailableItemsScreen';
import ReportScreen from '@/app/screens/ReportScreen';
import StockManagementScreen from '@/app/screens/StockManagementScreen';
import BillGenerationScreen from '@/app/screens/BillGenerationScreen'; // Import the new screen
import CustomerPhotoScreen from '@/app/screens/CustomerPhotoScreen';



const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationIndependentTree>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Home">
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Available Items" component={AvailableItemsScreen} />
          <Stack.Screen name="Report" component={ReportScreen} />
          <Stack.Screen name="Rental" component={RentalScreen} />
          <Stack.Screen name="Customer" component={CustomerScreen} />
          <Stack.Screen name="Upload Materials" component={ManageMaterialsScreen} />
          <Stack.Screen name="Stock Management" component={StockManagementScreen} />
          <Stack.Screen name="CustomerPhoto" component={CustomerPhotoScreen} />
          <Stack.Screen
            name="Generate Bill"
            component={BillGenerationScreen} // Add the new screen
            options={{ title: 'Generate Bill' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </NavigationIndependentTree>
  );
}
