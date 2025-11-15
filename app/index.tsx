import { Ionicons } from '@expo/vector-icons'; // For the trash icon (if using Expo)
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing'; // ✅ add this import at the top
import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { Row, Table } from 'react-native-table-component';

export default function Index() {
  const [time, setTime] = useState(0);
  const [started, setStarted] = useState(false);
  const [startTimestamp, setStartTimestamp] = useState<Date | null>(null); // 🆕 store start time
  const [tableData, setTableData] = useState<string[][]>([]);
  const [modalVisible, setModalVisible] = useState(false); // ✅ modal state
  // --- Manual Add Modal ---
  const [manualVisible, setManualVisible] = useState(false);
  const [manualDate, setManualDate] = useState(new Date());
  const [manualStartTime, setManualStartTime] = useState(new Date());
  const [manualDuration, setManualDuration] = useState(""); // in minutes or HH:MM
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);


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
  
  useEffect(() => {
    const restoreTimer = async () => {
      const saved = await AsyncStorage.getItem('@timerState');
      if (saved) {
        const { started, startTimestamp } = JSON.parse(saved);
        if (started && startTimestamp) {
          setStarted(true);
          const restoredStart = new Date(startTimestamp);
          setStartTimestamp(restoredStart);
          const now = new Date();
          const elapsed = Math.floor((now.getTime() - restoredStart.getTime()) / 1000);
          setTime(elapsed);
        }
      }
    };
    restoreTimer();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
  
    if (started && startTimestamp) {
      interval = setInterval(() => {
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - startTimestamp.getTime()) / 1000);
        setTime(elapsed);
      }, 1000);
    }
  
    return () => clearInterval(interval);
  }, [started, startTimestamp]);
  


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

  const onPress = async () => {
    if (!started) {
      // 🕒 START TIMER
      const newStart = new Date();
      setStarted(true);
      setStartTimestamp(newStart);
      setTime(0);
  
      // Save timer state persistently
      await AsyncStorage.setItem('@timerState', JSON.stringify({
        started: true,
        startTimestamp: newStart.toISOString(),
      }));
  
    } else {
      // 🛑 STOP TIMER
      setStarted(false);
  
      // Clear persisted timer state
      await AsyncStorage.removeItem('@timerState');
  
      if (startTimestamp) {
        const now = new Date();
        const elapsedSeconds = Math.floor((now.getTime() - startTimestamp.getTime()) / 1000);
        const duration = formatTime(elapsedSeconds);
  
        // 🌙 Night driving check
        const startHour = startTimestamp.getHours();
        const startMinute = startTimestamp.getMinutes();
        let durationLabel = duration;
        if (startHour > 18 || startHour < 6 || (startHour === 18 && startMinute >= 30)) {
          durationLabel += ' 🌙';
        }
  
        const dateStr = startTimestamp.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
        const startTimeStr = startTimestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
        const newEntry = [dateStr, startTimeStr, durationLabel];
        setTableData(prev => {
          const updated = [newEntry, ...prev];
          saveTableData(updated);
          return updated;
        });
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

  /////////////////
  const handleManualAdd = () => {
    // Must have at least some time
    const h = Number(hours) || 0;
    const m = Number(minutes) || 0;
  
    if (h === 0 && m === 0) return; // prevent "0m" entries
  
    let duration = "";
    if (h > 0) duration += `${h}h `;
    duration += `${m}m`;
  
    // 🌙 Night check
    const hr = manualStartTime.getHours();
    const min = manualStartTime.getMinutes();
    if (hr > 18 || hr < 6 || (hr === 18 && min >= 30)) {
      duration += " 🌙";
    }
  
    const dateStr = manualDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  
    const startTimeStr = manualStartTime.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  
    const newEntry = [dateStr, startTimeStr, duration];
  
    setTableData(prev => {
      const updated = [newEntry, ...prev];
      saveTableData(updated);
      return updated;
    });
  
    // Reset
    setManualVisible(false);
    setHours(0);
    setMinutes(0);
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
      
      <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-evenly', width: '70%', alignItems: 'center', marginVertical: 10 }}>
        <TouchableOpacity style={styles.manualButton} onPress={() => setManualVisible(true)}>
          <Text style={styles.manualButtonText}>Manual Add</Text>
        </TouchableOpacity>
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
      {/* --- Manual Add Modal --- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={manualVisible}
        onRequestClose={() => setManualVisible(false)}
      >
        <KeyboardAvoidingView style={styles.modalBackground} behavior="padding">
          <View style={styles.modalContainer}>

            <Text style={{ fontSize: 18, marginBottom: 10, fontWeight: 'bold' }}>Add Driving Session</Text>

            {/* DATE PICKER */}
            <Text style={{ fontSize: 14, marginTop: 10 }}>Date</Text>
            <DateTimePicker
              mode="date"
              display="spinner"   // iOS wheel style
              value={manualDate}
              onChange={(e, d) => {
                if (d) setManualDate(d);
              }}
            />

            {/* START TIME PICKER */}
            <Text style={{ fontSize: 14, marginTop: 10 }}>Start Time</Text>
            <DateTimePicker
              mode="time"
              display="spinner"   // wheel style
              value={manualStartTime}
              onChange={(e, d) => {
                if (d) setManualStartTime(d);
              }}
            />

            {/* DURATION INPUT */}
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              {/* Hours Input */}
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text>Duration Hrs</Text>
                <TextInput
                  value={hours.toString()}
                  onChangeText={(text) => { const cleaned = text.replace(/[^0-9]/g, ""); setHours(cleaned ? Number(cleaned) : 0); }}
                  keyboardType="numeric"
                  placeholder="0"
                  style={{
                    borderWidth: 1,
                    borderColor: "#ccc",
                    padding: 10,
                    borderRadius: 6,
                  }}
                />
              </View>

              {/* Minutes Input */}
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text>Duration Mins</Text>
                <TextInput
                  value={minutes.toString()}
                  onChangeText={(text) => { const cleaned = text.replace(/[^0-9]/g, ""); setMinutes(cleaned ? Number(cleaned) : 0); }}
                  keyboardType="numeric"
                  placeholder="0"
                  style={{
                    borderWidth: 1,
                    borderColor: "#ccc",
                    padding: 10,
                    borderRadius: 6,
                  }}
                />
              </View>
            </View>

            {/* BUTTONS */}
            <View style={styles.modalButtonRow}>
              <TouchableOpacity style={styles.closeButton} onPress={() => setManualVisible(false)}>
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.exportButton} onPress={handleManualAdd}>
                <Text style={styles.exportButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>

          </View>
        </KeyboardAvoidingView>
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
    borderColor: '#233e90',
    borderWidth: 2,
    backgroundColor: '#233e90',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  manualButton: {
    borderColor: '#233e90',
    borderWidth: 2,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },

  doneButtonText: {
    color: 'white',
    fontSize: 8,
  },

  manualButtonText: {
    color: '#233e90',
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