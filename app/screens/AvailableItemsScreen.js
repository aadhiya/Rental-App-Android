import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, TextInput } from 'react-native';
import { db } from '@/app/services/firebaseConfig.js';
import { collection, getDocs } from 'firebase/firestore';
import Toast from 'react-native-toast-message';
import Icon from 'react-native-vector-icons/Ionicons'; // For checkmark icons

const AvailableItemsScreen = ({ navigation }) => {
  const [materials, setMaterials] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);

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

  const toggleSelectItem = (item) => {
    if (selectedItems.find(i => i.id === item.id)) {
      setSelectedItems(selectedItems.filter(i => i.id !== item.id));
    } else {
      setSelectedItems([...selectedItems, item]);
    }
  };
  // Filter materials based on search query
  const filteredMaterials = materials.filter((material) =>
    material.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Available Materials</Text>

      {/* Search Bar */}
      <TextInput
        style={styles.searchBar}
        placeholder="Search for items..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

       <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }}>
        {filteredMaterials.map((material) => (
          <TouchableOpacity
            key={material.id}
            style={[
              styles.itemContainer,
              selectedItems.find(i => i.id === material.id) && styles.selectedItemContainer,
            ]}
            onPress={() => {
              if (material.quantity <= 0) {
                Alert.alert('Out of Stock', `Item "${material.name}" is currently out of stock.`);
                return;
              }
              toggleSelectItem(material);
            }}
          >
            <View style={styles.itemRow}>
              <Text style={styles.itemName}>{material.name}</Text>
              {selectedItems.find(i => i.id === material.id) && (
                <Icon name="checkmark-circle" size={24} color="#4CAF50" />
              )}
            </View>
            <Text style={styles.itemRate}>{`Rate per day: ₹${material.rate}`}</Text>
            <Text style={styles.itemQuantity}>{`Available: ${material.quantity}`}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      {/* Next Button */}
      <TouchableOpacity
        style={styles.nextButton}
        onPress={() => {
          if (selectedItems.length === 0) {
            Alert.alert('No selection', 'Please select at least one item to proceed.');
          } else {
            navigation.navigate('RentalBatch', { items: selectedItems });
          }
        }}
      >
        <Text style={styles.nextButtonText}>Next</Text>
      </TouchableOpacity>
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
    marginBottom: 10,
    textAlign: 'center',
  },
  searchBar: {
    height: 45,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 15,
    backgroundColor: '#f9f9f9',
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
  selectedItemContainer: {
    backgroundColor: '#d0f0c0',
    borderColor: '#4CAF50',
  },
  itemQuantity: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nextButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#6200ee',
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
