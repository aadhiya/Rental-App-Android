import React, { useState, useEffect } from 'react';
import { View, Text, Alert, FlatList, StyleSheet } from 'react-native';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/app/services/firebaseConfig';

const TodayDueNotification = () => {
  const [dueRents, setDueRents] = useState([]);

  useEffect(() => {
  async function fetchTodaysPendingRents() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const startTimestamp = Timestamp.fromDate(today);
      const endTimestamp = Timestamp.fromDate(tomorrow);

      const rentsRef = collection(db, 'customers');

      const q = query(
        rentsRef,
        where('status', '==', 'pending'),
        where('endDate', '>=', startTimestamp),
        where('endDate', '<', endTimestamp)
      );

      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const rentsList = [];
        snapshot.forEach(doc => {
          rentsList.push({ id: doc.id, ...doc.data() });
        });
        setDueRents(rentsList);

        let msg = rentsList.map(rent => `- ${rent.name}: ${rent.itemName} (Qty: ${rent.quantity})`).join('\n');
        Alert.alert('Pending Rents Due Today', msg);
      } else {
        setDueRents([]);
      }
    } catch (error) {
      console.log('Error fetching rents due today:', error);
    }
  }

  fetchTodaysPendingRents();
}, []);



  return (
    <View style={styles.container}>
      {dueRents.length > 0 ? (
        <>
          <Text style={styles.title}>Rentals Due Today</Text>
          <FlatList
            data={dueRents}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <View style={styles.item}>
                <Text>{item.name}</Text>
                <Text>{item.itemName} - Qty: {item.quantity}</Text>
              </View>
            )}
          />
        </>
      ) : (
        <Text style={styles.noDue}>No pending payments due today.</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  item: { paddingVertical: 8, borderBottomColor: '#ccc', borderBottomWidth: 1 },
  noDue: { textAlign: 'center', marginTop: 20, color: '#888' },
});

export default TodayDueNotification;
