import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { db } from './app/services/firebaseConfig.js';
import { collection, getDocs } from 'firebase/firestore';
import Toast from 'react-native-toast-message';

const AvailableItemsScreen = ({ navigation }) => {
  const [materials, setMaterials] = useState([]);

  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const materialsCollection = collection(db, 'materials');
        const snapshot = await getDocs(materialsCollection);
        const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setMaterials(items);

        Toast.show({
          type: 'success',
          text1: 'Materials loaded successfully!',
        });
      } catch (error) {
        console.error('Error fetching materials:', error);
        Toast.show({
          type: 'error',
          text1: 'Failed to load materials',
          text2: 'Please try again.',
        });
      }
    };

    fetchMaterials();
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView>
        <Text style={styles.header}>Available Materials</Text>
        {materials.map((material) => (
          <TouchableOpacity
            key={material.id}
            style={styles.itemContainer}
            onPress={() => {
              navigation.navigate('Rental', { item: material });
              Toast.show({
                type: 'success',
                text1: `Navigating to rent "${material.name}"`,
              });
            }}
          >
            <Text style={styles.itemName}>{material.name}</Text>
            <Text style={styles.itemRate}>{`Rate per day: $${material.rate}`}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <Toast />
    </View>
  );
};

export default AvailableItemsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#ffffff',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  itemContainer: {
    marginBottom: 15,
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  itemName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  itemRate: {
    fontSize: 16,
    color: 'grey',
  },
});
