import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Row, Rows, Table } from 'react-native-table-component';

export default function Index() {
  const [time, setTime] = useState(0);
  const [started, setStarted] = useState(false);
  const buttonBackgroundColor = started ? "#233e90" : "white";
  const buttonTextColor = started ? "white" : "#233e90";
  const tableHead = ['Date', 'Start Time', 'Duration'];
  const tableData = [
    ['2025-10-08', '09:00', '1h 30m'],
    ['2025-10-07', '14:15', '45m'],
    ['2025-10-06', '17:00', '2h 10m'],
  ];

  const onPress = () => {
    if (!started) {
      setStarted(true);
    }
  };

  useEffect(() => {
    let interval: number;

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
    return `${h}h ${m}m ${s}s`;
  };

  return (
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
      <View style={styles.tableContainer}>
        <Table></Table>
        <Row data={tableHead} style={styles.head} textStyle={styles.headText} />
        <Rows data={tableData} textStyle={styles.text} />
      </View>
    <View style={styles.bottomSpacer}></View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  bottomSpacer: {
    marginBottom: 5,
  },
  tableHeader: {
    marginTop: 60,
    fontFamily: "Helvetica",
    fontSize: 21,
  },
  tableContainer: {
    marginTop: 15,
    padding: 16,
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
    fontSize: 16,
  },
  text: {
    margin: 6,
    textAlign: 'center',
    fontSize: 16,
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
    backgroundColor: "rgba(35, 62, 144, 0)",

  },

})