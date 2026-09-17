import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, Modal, Alert } from 'react-native';
import { api } from '../services/api';

export default function RecruiterApplicationsScreen() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);

  useEffect(() => {
    fetchApps();
  }, []);

  const fetchApps = async () => {
    try {
      const data = await api.getApplications();
      setApps(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (status) => {
    if (!selectedApp) return;
    try {
      await api.updateApplicationStatus(selectedApp.id, status);
      setApps(apps.map(a => a.id === selectedApp.id ? { ...a, status } : a));
      setSelectedApp(null);
      Alert.alert("Success", `Status updated to ${status}`);
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity onPress={() => setSelectedApp(item)} className="bg-white p-4 rounded-xl shadow mb-3 mx-4 flex-row justify-between items-center border border-gray-100">
      <View>
        <Text className="text-lg font-bold text-navy">{item.candidate_name || 'Candidate'}</Text>
        <Text className="text-sm text-gray-500">Applied for: {item.job?.title || `Job #${item.job_id}`}</Text>
      </View>
      <View className="bg-gray-100 px-3 py-1 rounded-full">
        <Text className="text-xs text-gray-700 font-semibold uppercase">{item.status || 'pending'}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-cream pt-4">
      <Text className="px-4 text-2xl font-bold text-navy mb-4">Pipeline</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#FF6B00" />
      ) : (
        <FlatList
          data={apps}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          ListEmptyComponent={<Text className="text-center text-gray-500 mt-10">No applications yet.</Text>}
        />
      )}

      {/* Inspection Modal */}
      <Modal visible={!!selectedApp} animationType="slide" transparent={true}>
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6 h-2/3 shadow-xl">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-2xl font-bold text-navy">{selectedApp?.candidate_name || 'Candidate Profile'}</Text>
              <TouchableOpacity onPress={() => setSelectedApp(null)}>
                <Text className="text-gray-500 text-lg">✕</Text>
              </TouchableOpacity>
            </View>
            <Text className="text-gray-600 mb-2">Job: {selectedApp?.job?.title}</Text>
            <Text className="text-gray-600 mb-6">Current Status: <Text className="font-bold">{selectedApp?.status}</Text></Text>
            
            <Text className="font-bold text-gray-800 mb-2">Actions</Text>
            <TouchableOpacity onPress={() => handleUpdateStatus('shortlisted')} className="bg-green-600 p-3 rounded-lg mb-3 items-center">
              <Text className="text-white font-semibold">Shortlist</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleUpdateStatus('interview_scheduled')} className="bg-orange p-3 rounded-lg mb-3 items-center">
              <Text className="text-white font-semibold">Schedule Interview</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleUpdateStatus('rejected')} className="bg-red-600 p-3 rounded-lg items-center mb-6">
              <Text className="text-white font-semibold">Reject</Text>
            </TouchableOpacity>

            <TouchableOpacity className="border border-navy p-3 rounded-lg items-center flex-row justify-center mt-auto">
              <Text className="text-navy font-semibold">View Full Resume</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

