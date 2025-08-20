import React, { useState, useEffect } from 'react';
import { View, Text, Alert, TouchableOpacity, StyleSheet, ScrollView, TextInput,Platform } from 'react-native';
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useRoute ,useNavigation} from '@react-navigation/native';
import { db } from '@/app/services/firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';
import Icon from 'react-native-vector-icons/Ionicons';
const BillGenerationScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const [billDetails, setBillDetails] = useState({
    customerName: '',
    phoneNumber: '',
    itemName: '',
    quantity: 1,
    rate: 0,
    startDate: '',
    endDate: '',
    advancePaid: 0,
    totalAmount: 0,
     createdAt: null,
    docId: null
  });
  const [discount, setDiscount] = useState(0);
  const [pdfUri, setPdfUri] = useState(null);
const [billType, setBillType] = useState(null); // 'bill' or 'estimate'

  const askBillType = (callback) => {
    Alert.alert("Select Bill Type", "Is this a Bill or an Estimate?", [
      { text: "Bill", onPress: () => { setBillType("bill"); callback("bill"); } },
      { text: "Estimate", onPress: () => { setBillType("estimate"); callback("estimate"); } },
      { text: "Cancel", style: "cancel" }
    ]);
  };
  // Calculate inclusive days
  const getNumberOfDays = (start, end) => {
    const s = new Date(start); const e = new Date(end);
    const diff = e - s;
    return (isNaN(diff) || diff < 0) ? 0 : Math.floor(diff / (1000*60*60*24)) + 1;
  };


  // Fill bill details from navigation params and docId
 useEffect(() => {
  if (route?.params) {
    setBillDetails(prev => ({
      ...prev,
      ...route.params,
      startDate: route.params.startDate ?? '',
      endDate: route.params.endDate ?? '',
      advancePaid: route.params.advancePaid !== undefined ? Number(route.params.advancePaid) : 0,
      rate: route.params.rate !== undefined ? Number(route.params.rate) : 0,   // ADD THIS LINE
      createdAt: route.params.createdAt || null,
      docId: route.params.docId || null,
    }));
    if (route.params.discount !== undefined) setDiscount(Number(route.params.discount) || 0);
  }
}, [route?.params]);


  // Recompute total when rate, quantity, dates change
  useEffect(() => {
    const numDays = getNumberOfDays(billDetails.startDate, billDetails.endDate);
    const total = (Number(billDetails.quantity) || 0) * (Number(billDetails.rate) || 0) * numDays;
    setBillDetails(prev => ({ ...prev, totalAmount: total }));
  }, [billDetails.quantity, billDetails.rate, billDetails.startDate, billDetails.endDate]);
const createdDate = billDetails.createdAt?.toDate
  ? billDetails.createdAt.toDate().toLocaleString()
  : billDetails.createdAt || 'N/A';

  const numDays = getNumberOfDays(billDetails.startDate, billDetails.endDate);
  const advance = Number(billDetails.advancePaid) || 0;
  const totalAmount = Number(billDetails.totalAmount) || 0;
  const discountNum = Number(discount) || 0;
  const finalAmount = Math.max(totalAmount - advance - discountNum, 0);

  // Save final amount and discount to Firestore
 const saveFinalAmountToFirestore = async () => {
  try {
    if (billDetails.docId) {
      await updateDoc(doc(db, 'customers', billDetails.docId), {
        totalAmount,   // ✅ store the computed total
        finalAmount,   // ✅ store after discount & advance
        discountNum,   // ✅ save applied discount
      });
      Alert.alert('Saved ✅', 'Bill details have been updated in Firestore.');
    }
  } catch (error) {
    console.error('Error saving bill:', error);
    Alert.alert('Error', 'Failed to save bill details.');
  }
};


const generateBillHTML = (type = 'bill', size = 'A4') => {
  const title = type === 'estimate' ? 'Estimate / Quotation' : 'Rental Bill';

  if (size === '80mm') {
    // Narrow receipt style for 80mm printer
    return `
      <html>
        <head>
          <style>
            body { font-family: monospace, monospace; font-size: 12px; margin: 0; padding: 5px; }
            h1 { text-align: center; font-size: 14px; margin-bottom: 10px; }
            .line { border-top: 1px solid #000; margin: 5px 0; }
            .label { font-weight: bold; }
            .item { margin-bottom: 8px; }
            .right { text-align: right; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>

          <div><span class="label">Customer:</span> ${billDetails.customerName}</div>
          <div><span class="label">Phone:</span> ${billDetails.phoneNumber}</div>

          <div class="line"></div>

          <div><span class="label">Item:</span> ${billDetails.itemName}</div>
          <div><span class="label">Qty:</span> ${billDetails.quantity}</div>
          <div><span class="label">Rate/Day:</span> ₹${billDetails.rate}</div>
          <div><span class="label">Created At:</span> ${createdDate}</div>
          <div><span class="label">Rental Period:</span> ${billDetails.startDate} to ${billDetails.endDate}</div>
          <div><span class="label">Days:</span> ${numDays}</div>

          <div class="line"></div>

          <div class="item"><span class="label">Total:</span> ₹${totalAmount.toFixed(2)}</div>
          <div class="item"><span class="label">Advance Paid:</span> ₹${advance.toFixed(2)}</div>
          <div class="item"><span class="label">Discount:</span> ₹${discountNum.toFixed(2)}</div>
          <div class="item"><span class="label">Final Amount:</span> ₹${finalAmount.toFixed(2)}</div>

          <div class="line"></div>

          <div style="text-align:center; font-size:10px; margin-top:10px;">
            Thank you for your business!
          </div>
        </body>
      </html>
    `;
  }

  // A4 size layout with full table for bill or estimate
  return `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { text-align: center; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #333; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .right { text-align: right; }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <p><strong>Customer Name:</strong> ${billDetails.customerName}</p>
        <p><strong>Phone Number:</strong> ${billDetails.phoneNumber}</p>
        <p><strong>Item Name:</strong> ${billDetails.itemName}</p>
        <p><strong>Rate per Day:</strong> ₹${billDetails.rate}</p>
        <p><strong>Created At:</strong> ${createdDate}</p>
        <p><strong>Rental Period:</strong> ${billDetails.startDate} to ${billDetails.endDate} (${numDays} days)</p>
        <p><strong>Quantity:</strong> ${billDetails.quantity}</p>
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Qty</th>
              <th>Rate</th>
              <th>Date</th>
              <th>Days</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${billDetails.itemName}</td>
              <td>${billDetails.quantity}</td>
              <td>₹${billDetails.rate}</td>
               <td>${createdDate}</td>
              <td>${numDays}</td>
              <td>₹${totalAmount.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
        <p class="right">Advance Paid: ₹${advance.toFixed(2)}</p>
        <p class="right">Discount: ₹${discountNum.toFixed(2)}</p>
        <h2 class="right">Final Amount: ₹${finalAmount.toFixed(2)}</h2>
      </body>
    </html>
  `;
};


  
  const savePDF = async (type) => {
  try {
    // 1️⃣ Generate PDF from the chosen type (always A4 for file save)
    const html = generateBillHTML(type, "A4");
    const { uri } = await Print.printToFileAsync({ html });

    const fileName = `${type === "estimate" ? "Estimate" : "Rental_Bill"}_${billDetails.customerName.replace(/\s/g, '_')}_${Date.now()}.pdf`;

    // 2️⃣ Android: ask user to pick folder & save there
    if (Platform.OS === "android") {
      try {
        const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();

        if (!permissions.granted) {
          Alert.alert("Permission denied", "You need to grant directory access to save the PDF.");
          return;
        }

        // Create the file in that folder
        const destUri = await FileSystem.StorageAccessFramework.createFileAsync(
          permissions.directoryUri,
          fileName,
          "application/pdf"
        );

        // Read the generated PDF as base64
        const pdfBase64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });

        // Save it to the chosen folder
        await FileSystem.writeAsStringAsync(destUri, pdfBase64, { encoding: FileSystem.EncodingType.Base64 });

        Alert.alert("Saved", "Bill PDF saved to the folder you chose!");
      } catch (err) {
        console.log("Error saving PDF:", err);
        Alert.alert("Error", "Could not save the PDF to the selected folder.");
      }
    } 
    else {
      // 3️⃣ Other platforms — just show default location
      Alert.alert("Saved", `PDF saved at: ${uri}`);
    }

  } catch (error) {
    console.error("Error creating PDF:", error);
    Alert.alert("Error", "Failed to generate and save PDF.");
  }
};


  const sharePDF = (type) => {
    const html = generateBillHTML(type, "A4");
    Print.printToFileAsync({ html }).then(({ uri }) => {
      Sharing.shareAsync(uri);
    }).catch(() => Alert.alert("Error", "Failed to share PDF"));
  };

  const printPDF = (type) => {
    Alert.alert("Select Size", "Choose Paper Size", [
      { text: "A4", onPress: () => Print.printAsync({ html: generateBillHTML(type, "A4") }) },
      { text: "80mm", onPress: () => Print.printAsync({ html: generateBillHTML(type, "80mm") }) },
      { text: "Cancel", style: "cancel" }
    ]);
  };


  return (
   
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Rental Bill</Text>

      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>Customer Name</Text>
        <TextInput
          style={styles.input}
          value={billDetails.customerName}
          onChangeText={(text) => setBillDetails(prev => ({ ...prev, customerName: text }))}
          placeholder="Enter customer name"
        />
      </View>

      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>Phone Number</Text>
        <TextInput
          style={styles.input}
          value={billDetails.phoneNumber}
          onChangeText={(text) => setBillDetails(prev => ({ ...prev, phoneNumber: text }))}
          placeholder="Enter phone number"
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>Item Name</Text>
        <TextInput
          style={styles.input}
          value={billDetails.itemName}
          onChangeText={(text) => setBillDetails(prev => ({ ...prev, itemName: text }))}
          placeholder="Enter item name"
        />
      </View>

      <View style={styles.fieldContainer}>
  <Text style={styles.fieldLabel}>Rate per Day (₹)</Text>
  <TextInput
    style={styles.input}
    value={billDetails.rate ? billDetails.rate.toString() : ''}
    onChangeText={(text) => setBillDetails(prev => ({ ...prev, rate: Number(text) || 0 }))}
    placeholder="Enter rate"
    keyboardType="numeric"
  />
</View>


      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>Start Date (YYYY-MM-DD)</Text>
        <TextInput
          style={styles.input}
          value={billDetails.startDate}
          onChangeText={(text) => setBillDetails(prev => ({ ...prev, startDate: text }))}
          placeholder="Enter start date"
        />
      </View>

      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>End Date (YYYY-MM-DD)</Text>
        <TextInput
          style={styles.input}
          value={billDetails.endDate}
          onChangeText={(text) => setBillDetails(prev => ({ ...prev, endDate: text }))}
          placeholder="Enter end date"
        />
      </View>

      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>Quantity</Text>
        <TextInput
          style={styles.input}
          value={billDetails.quantity}
          onChangeText={(text) => setBillDetails(prev => ({ ...prev, quantity: text }))}
          placeholder="Enter quantity"
          keyboardType="numeric"
        />
      </View>
       <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>Created Date and Time</Text>
        <TextInput
          style={styles.input}
          value={createdDate}
         onChangeText={(text) => setBillDetails(prev => ({ ...prev, createdDate: text }))}
        />
      </View>

      <View style={styles.fieldContainer}>
  <Text style={styles.fieldLabel}>Advance Paid (₹)</Text>
  <TextInput
    style={styles.input}
    value={billDetails.advancePaid ? billDetails.advancePaid.toString() : ''}
    onChangeText={(text) =>
      setBillDetails(prev => ({ ...prev, advancePaid: Number(text) || 0 }))
    }
    placeholder="Enter advance paid"
    keyboardType="numeric"
  />
</View>


      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>Discount (₹)</Text>
        <TextInput
          style={styles.input}
          value={discount}
          onChangeText={(text) => setDiscount(text)}
          placeholder="Enter discount"
          keyboardType="numeric"
        />
      </View>

      
      <Text style={styles.totalAmount}>Total Amount: ₹{totalAmount.toFixed(2)}</Text>
      <Text style={[styles.totalAmount, { color: '#047857' }]}>Advance Paid: ₹{advance.toFixed(2)}</Text>
      <Text style={[styles.totalAmount, { color: '#be123c' }]}>Discount: ₹{discountNum.toFixed(2)}</Text>
      <Text style={[styles.totalAmount, { fontWeight: 'bold', fontSize: 22 }]}>Final Amount: ₹{finalAmount.toFixed(2)}</Text>

<TouchableOpacity
  style={{
    marginTop: 20,
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  }}
  onPress={saveFinalAmountToFirestore}
>
  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>
    Save Bill
  </Text>
</TouchableOpacity>
<TouchableOpacity
  style={{
    marginTop: 10,
    backgroundColor: '#f44336',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center'
  }}
  onPress={() => navigation.navigate('Home')}
>
  <Icon name="arrow-back" size={20} color="#fff" style={{ marginRight: 6 }} />
  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Back to Home</Text>
</TouchableOpacity>
      
      <TouchableOpacity style={styles.button} onPress={() => askBillType(savePDF)}>
        <Text style={styles.buttonText}>Save as PDF</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => askBillType(printPDF)}>
        <Text style={styles.buttonText}>Print</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => askBillType(sharePDF)}>
        <Text style={styles.buttonText}>Share</Text>
      </TouchableOpacity>
    
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: '#fff',
    alignItems: 'stretch',
  },
  header: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f8f8f8',
    marginBottom: 4,
  },
  billDetailRow: {
    marginBottom: 7,
    flexDirection: 'row',
  },
  detailLabel: {
    flex: 1, fontWeight: '600', color: '#333',
  },
  detailValue: {
    flex: 2, color: '#111',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 4,
    alignSelf: 'center',
    color: '#222',
  },
  button: {
    backgroundColor: '#227fff',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  disabled: {
    backgroundColor: '#aaa',
  },
});

export default BillGenerationScreen;
