import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import * as Sharing from 'expo-sharing';

const BillGenerationScreen = ({ route }) => {
  const {
    customerName: defaultCustomerName = '',
    phoneNumber: defaultPhoneNumber = '',
    itemName = '',
    quantity = 1,
    rate = 0,
    startDate = '',
    endDate = '',
  } = route.params || {};

  const [billDetails, setBillDetails] = useState({
    customerName: defaultCustomerName,
    phoneNumber: defaultPhoneNumber,
    itemName,
    quantity,
    rate,
    startDate,
    endDate,
    totalAmount: 0,
  });

  useEffect(() => {
    if (startDate && endDate && rate && quantity) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (end >= start) {
        const rentalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
        const totalAmount = rentalDays * rate * quantity;

        setBillDetails((prev) => ({ ...prev, totalAmount }));
      }
    }
  }, [startDate, endDate, rate, quantity]);

  const generatePDF = async () => {
    const { customerName, phoneNumber, itemName, quantity, rate, startDate, endDate, totalAmount } =
      billDetails;

    if (!customerName || !phoneNumber) {
      Alert.alert('Error', 'Please fill in customer name and phone number.');
      return;
    }

    const htmlContent = `
      <h1 style="text-align: center;">Rental Bill</h1>
      <p><strong>Customer Name:</strong> ${customerName}</p>
      <p><strong>Phone Number:</strong> ${phoneNumber}</p>
      <p><strong>Item Rented:</strong> ${itemName}</p>
      <p><strong>Quantity:</strong> ${quantity}</p>
      <p><strong>Rate per Day:</strong> ₹${rate}</p>


      <p><strong>Start Date:</strong> ${startDate}</p>
      <p><strong>End Date:</strong> ${endDate}</p>
      <p><strong>Total Amount:</strong> ₹${totalAmount}</p>
    `;

    try {
      const pdf = await RNHTMLtoPDF.convert({
        html: htmlContent,
        fileName: `Rental_Bill_${customerName.replace(/\s/g, '_')}`,
        base64: false,
      });

      console.log('Generated PDF file path:', pdf.filePath);

      if (pdf.filePath) {
        const fileUri = `file://${pdf.filePath}`; // Prepend "file://"
        console.log('File URI for sharing:', fileUri);

        Alert.alert('Success', 'Bill has been generated. Do you want to send it?', [
          { text: 'No', style: 'cancel' },
          {
            text: 'Yes',
            onPress: () => sendBill(fileUri),
          },
        ]);
      } else {
        throw new Error('PDF file path is null or undefined');
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert('Error', `Error generating PDF: ${error.message}`);
    }
  };

  const sendBill = async (fileUri) => {
    if (!fileUri) {
      Alert.alert('Error', 'No bill has been generated to send.');
      return;
    }

    try {
      const isSharingAvailable = await Sharing.isAvailableAsync();
      if (isSharingAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Share Rental Bill',
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert('Error', 'Sharing is not available on this device.');
      }
    } catch (error) {
      console.error('Error sharing file:', error);
      Alert.alert('Error', 'Failed to share the file.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Bill Details</Text>

      <Text style={styles.label}>Customer Name:</Text>
      <TextInput
        style={styles.input}
        value={billDetails.customerName}
        onChangeText={(text) => setBillDetails({ ...billDetails, customerName: text })}
      />

      <Text style={styles.label}>Phone Number:</Text>
      <TextInput
        style={styles.input}
        value={billDetails.phoneNumber}
        onChangeText={(text) => setBillDetails({ ...billDetails, phoneNumber: text })}
      />

      <Text style={styles.label}>Total Amount:</Text>
      <Text style={styles.textValue}>₹{billDetails.totalAmount}</Text>


      <View style={styles.buttonContainer}>
        <Button title="Generate Bill" onPress={generatePDF} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, backgroundColor: '#fff' },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  label: { fontSize: 16, marginTop: 10 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 5, padding: 10, marginBottom: 10 },
  textValue: { fontSize: 16, marginBottom: 10, fontWeight: 'bold' },
  buttonContainer: { marginTop: 20 },
});

export default BillGenerationScreen;
