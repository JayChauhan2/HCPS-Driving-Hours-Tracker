import { Ionicons } from '@expo/vector-icons'; // For the trash icon (if using Expo)
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing'; // ✅ add this import at the top
import React, { useEffect, useState } from "react";
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { Row, Table } from 'react-native-table-component';

export default function Index() {
  const [time, setTime] = useState(0);
  const [started, setStarted] = useState(false);
  const [startTimestamp, setStartTimestamp] = useState<Date | null>(null); // 🆕 store start time
  const [tableData, setTableData] = useState<string[][]>([]);
  const [modalVisible, setModalVisible] = useState(false); // ✅ modal state

  const buttonBackgroundColor = started ? "#233e90" : "white";
  const buttonTextColor = started ? "white" : "#233e90";
  const tableHead = ['Date', 'Start Time', 'Duration'];

  // --- AsyncStorage functions ---
  const saveTableData = async (data: string[][]) => {
    try {
      await AsyncStorage.setItem('@tableData', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save table data', error);
    }
  };

  const loadTableData = async () => {
    try {
      const savedData = await AsyncStorage.getItem('@tableData');
      if (savedData !== null) {
        setTableData(JSON.parse(savedData));
      }
    } catch (error) {
      console.error('Failed to load table data', error);
    }
  };

  useEffect(() => {
    loadTableData();
  }, []);

  // --- Timer effect ---
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (started) {
      interval = setInterval(() => {
        setTime(prev => prev + 1);
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [started]);


  const formatTime = (t: number) => {
    const h = Math.floor(t / 3600);
    const m = Math.floor((t % 3600) / 60);
    const s = t % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const getTotalHours = () => {
    let totalSeconds = 0;

    tableData.forEach(row => {
      const durationStr = row[2]; // duration column
      const cleanStr = durationStr.replace('🌙', '').trim();
      const hMatch = cleanStr.match(/(\d+)h/);
      const mMatch = cleanStr.match(/(\d+)m/);
      const sMatch = cleanStr.match(/(\d+)s/);

      const h = hMatch ? parseInt(hMatch[1], 10) : 0;
      const m = mMatch ? parseInt(mMatch[1], 10) : 0;
      const s = sMatch ? parseInt(sMatch[1], 10) : 0;

      totalSeconds += h * 3600 + m * 60 + s;
    });

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${hours}h ${minutes}m ${seconds}s`;
  };

  // --- Calculate total night hours ---
  const getTotalNightTime = () => {
    let totalSeconds = 0;

    tableData.forEach(row => {
      const durationStr = row[2]; // duration column
      if (durationStr.includes('🌙')) {
        const cleanStr = durationStr.replace('🌙', '').trim();
        const hMatch = cleanStr.match(/(\d+)h/);
        const mMatch = cleanStr.match(/(\d+)m/);
        const sMatch = cleanStr.match(/(\d+)s/);

        const h = hMatch ? parseInt(hMatch[1], 10) : 0;
        const m = mMatch ? parseInt(mMatch[1], 10) : 0;
        const s = sMatch ? parseInt(sMatch[1], 10) : 0;

        totalSeconds += h * 3600 + m * 60 + s;
      }
    });

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${hours}h ${minutes}m ${seconds}s`;
  };

  const onPress = () => {
    if (!started) {
      // 🕒 Start tracking
      setStarted(true);
      setStartTimestamp(new Date());
      setTime(600); // test time HERE
    } else {
      // 🛑 Stop tracking — record the session
      setStarted(false);
      if (startTimestamp) {
        const duration = formatTime(time);

        // 🌙 Night driving check
        const startHour = startTimestamp.getHours(); // 0-23
        const startMinute = startTimestamp.getMinutes();
        if (startHour > 18 || startHour < 6 || (startHour === 18 && startMinute >= 30)) {
          duration += ' 🌙';
        }

        const dateStr = startTimestamp.toLocaleDateString('en-US', {
          month: 'short', // Oct
          day: 'numeric', // 8
          year: 'numeric' // 2025
        });
        const startTimeStr = startTimestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const newEntry = [dateStr, startTimeStr, duration]; // not verified yet
        setTableData(prev => {
          const updated = [newEntry, ...prev];
          saveTableData(updated);
          return updated;
        
        }); // add to top
      }
      setStartTimestamp(null);
    }
  };

  const exportHours = async () => {

    // Build table rows dynamically
    const tableRows = tableData.map((row, index) => {
      const [date, startTime, duration] = row;
      const isNight = duration.includes('🌙') ? 'Night 🌙' : 'Day';
      const cleanDuration = duration.replace('🌙', '').trim();
      return `
        <tr>
          <td>${index + 1}</td>
          <td>${date}</td>
          <td>${cleanDuration}</td>
          <td>${isNight}</td>
          <td></td>
        </tr>
      `;
    }).join('');

    const totalTime = getTotalHours();
    const totalNight = getTotalNightTime();

    const html = `
      <html>
      <head>
          <style>
            table {
              width: 80%;
              margin: 20px auto;
              border-collapse: collapse;
            }
            th, td {
              border: 1px solid #000;
              padding: 2px;
              text-align: center;
            }
            * {
              text-align: center;
            }
            h3 {
              font-weight: normal;
            }
            #bottom {
              width: 80%;
              display: flex;
              flex-direction: row;
              justify-content: space-evenly;
              justify-self: center;
              font-size: 0.9rem;
            }
            #bottom > div {
              flex: 1;
              margin: 0 10px; /* Add horizontal spacing */
            }
          </style>
      </head>
          <body>
          <h2 style="text-align: center;">This Driving Log should be completed and submitted to the student's in-car driver education teacher.</h1>
          <h1 style="text-align: center;">45-Hour Driving Log</h1>
          <table>
            <tr>
              <th>Session</th>
              <th style="width: 8rem;">Date</th>
              <th>Total Time Driven</th>
              <th>Day/Night</th>
              <th>Notes on driving conditions (if applicable)</th>
            </tr>
            ${tableRows}
            <tr>
              <td colspan="2" style="text-align:right"><b>Total Time</b></td>
              <td colspan="3"><b>${totalTime} (Night: ${totalNight})</b></td>
            </tr>
          </table>
          <br>
          <h3>I certify that _______________________________________ has completed 45 hours of guided practice, 15 of which were after sunset.</h3>
          <br>
          <div id="bottom">
              <div>
                  <h3>____________________________</h3>
                  <h3>Parent/Guardian's Signature</h3>
              </div>
              
              <div>
                  <h3>___________________________________</h3>
                  <h3>DMV Driver License OR ID Card No.</h3>
              </div>
              
              <div>
                  <h3>_________________</h3>
                  <h3>Date</h3>
              </div>
          </div>
      </body>
      </html>
    `;
    
    const { uri } = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(uri); // ✅ correct sharing method
    setModalVisible(false)
  };

  return (
    <GestureHandlerRootView style={{ flex: 1, marginTop: 40}}>
    
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Driving Hours Tracker</Text>
      
      <View style={styles.startHolder}>
        <TouchableOpacity style={[styles.start, { backgroundColor: buttonBackgroundColor, borderColor: buttonTextColor }]} onPress={onPress}>
          <Text style={[styles.startText, { color: buttonTextColor }]}>
              {started ? formatTime(time) : "Start"}
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.tableHeader}>My Activity</Text>
      
      <Text style={{paddingTop: 6, fontSize: 10, color: 'lightgrey', fontStyle: 'italic'}}>My total hours: {getTotalHours()} (45h required) </Text>
      <Text style={{paddingTop: 6, fontSize: 10, color: 'lightgrey', fontStyle: 'italic'}}>My total night 🌙 hours: {getTotalNightTime()} (15h required) </Text>
      
      <View style={{ display: 'flex', width: '100%', alignItems: 'center', marginVertical: 10 }}>
        <TouchableOpacity style={styles.doneButton} onPress={() => setModalVisible(true)}>
          <Text style={styles.doneButtonText}>Done with Hours?</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.tableContainer}>
        <Table>
          <Row data={tableHead} style={styles.head} textStyle={styles.headText} />
          {tableData.map((tableData, index) => {
            const handleDelete = () => {
              setTableData(prev => {
                const updated = prev.filter((_, i) => i !== index);
                saveTableData(updated);
                return updated;
              });
            };

            const renderRightActions = () => (
              <TouchableOpacity onPress={handleDelete}>
                <View style={styles.deleteContainer}>
                  <Ionicons name="trash" size={12} color="white" />
                </View>
              </TouchableOpacity>
            );

            return (
              <Swipeable key={index} renderRightActions={renderRightActions}>
                <Row
                  data={tableData}
                  style={[
                    { backgroundColor: index % 2 === 0 ? "#fff" : '#ecececff' },
                  ]}
                  textStyle={styles.text}
                />
              </Swipeable>
            );
          })}
        </Table>
        
      </View>

      
      {/* --- Modal --- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={{ fontSize: 18 }}>Congratulations! Begin exporting your hours to a PDF and get them signed.</Text>
            
            {/* Buttons in a row */}
            <View style={styles.modalButtonRow}>
              <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.exportButton} onPress={() => exportHours()}>
                <Text style={styles.exportButtonText}>Export</Text>
              </TouchableOpacity>
              </View>
            </View>
        </View>
      </Modal>
    <View style={styles.bottomSpacer}></View>
    </ScrollView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  bottomSpacer: {
    marginBottom: 5,
  },
  doneButton: {
    backgroundColor: '#233e90',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },

  doneButtonText: {
    color: 'white',
    fontSize: 8,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalButtonRow: {
    flexDirection: 'row',       // align buttons horizontally
    justifyContent: 'space-around', // space evenly
    width: '80%',              // take full width of modal container
  },
  modalContainer: {
    width: '80%',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: 'white',
    borderColor: "#233e90",
    borderWidth: 2,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  closeButtonText: { color: '#233e90', fontSize: 14 },
  exportButton: {
    marginTop: 20,
    backgroundColor: '#233e90',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  exportButtonText: { color: 'white', fontSize: 14 },
  deleteContainer: {
    backgroundColor: 'red',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    height: '100%',
  },
  tableHeader: {
    marginTop: 60,
    fontFamily: "Helvetica",
    fontSize: 21,
  },
  tableContainer: {
    padding: 8,
    backgroundColor: '#fff',
    width: '90%',
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  head: {
    height: 40,
    backgroundColor: '#233e90',
    borderRadius: 4,
  },
  headText: {
    color: 'white',
    margin: 6,
    textAlign: 'center',
    fontSize: 10,
  },
  text: {
    margin: 6,
    textAlign: 'center',
    fontSize: 8,
    paddingVertical: 2,
  },


  title: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 34,
    fontFamily: "Helvetica",
  },
  startHolder: {
    marginTop: 20,
    alignItems: "center",
  },
  start: {
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 200,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.32,
    shadowRadius: 5.46,
    elevation: 9,
    borderWidth: 4,
    height: 260,
    width: 260,
  },
  startText: {
    color: "#233e90",
    fontSize: 40,
    fontFamily: "Helvetica",
  },
  container: {
    justifyContent: "center",
    alignItems: "center",

  },

})