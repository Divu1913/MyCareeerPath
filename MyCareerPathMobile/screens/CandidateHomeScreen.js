import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, FlatList, ActivityIndicator, TouchableOpacity, Alert, Image } from 'react-native';
import { api } from '../services/api';

export default function CandidateHomeScreen() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locationFilter, setLocationFilter] = useState('');

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const data = await api.getPublicJobs();
      setJobs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (job) => {
    // Note: Quick apply would typically POST to /api/applications.
    // For scaffolding, we just show an alert.
    Alert.alert("Quick Apply", `Applied to ${job.title} at ${job.company_name || job.company?.name || 'Company'}`);
  };

  const renderItem = ({ item }) => (
    <View className="bg-white p-4 rounded-xl shadow mb-4 mx-4 border border-gray-100">
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1">
          <Text className="text-lg font-bold text-navy">{item.title}</Text>
          <Text className="text-sm text-gray-500">{item.company_name || item.company?.name || 'Unknown Company'}</Text>
        </View>
        <View className="bg-green-100 px-2 py-1 rounded">
          <Text className="text-xs text-green-800 font-bold">85% Match</Text>
        </View>
      </View>
      <Text className="text-gray-600 mb-4" numberOfLines={2}>{item.description}</Text>
      <TouchableOpacity onPress={() => handleApply(item)} className="bg-navy py-2 rounded-lg items-center">
        <Text className="text-white font-semibold">Quick Apply</Text>
      </TouchableOpacity>
    </View>
  );

  const filteredJobs = jobs.filter(j => !locationFilter || (j.location || "").toLowerCase().includes(locationFilter.toLowerCase()));

  return (
    <View className="flex-1 bg-cream pt-2">
      <View className="flex-row items-center px-4 py-2 border-b border-gray-200 mb-2 bg-white">
        <Image 
          source={require('../assets/logo.png')} 
          style={{ width: 36, height: 36, resizeMode: 'contain', borderRadius: 8, marginRight: 10 }} 
        />
        <View>
          <Text className="text-lg font-bold text-navy">MyCareerPath</Text>
          <Text className="text-[10px] text-gray-500">Candidate Portal</Text>
        </View>
      </View>
      <Text className="px-4 text-2xl font-bold text-navy mb-2">Recommended Jobs</Text>
      <View className="px-4 mb-4">
        <TextInput 
          className="bg-white border border-gray-200 rounded-lg p-3 text-gray-700 shadow-sm"
          placeholder="Filter by location (e.g. Remote, Bangalore)"
          value={locationFilter}
          onChangeText={setLocationFilter}
        />
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#FF6B00" />
      ) : (
        <FlatList
          data={filteredJobs}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={<Text className="text-center text-gray-500 mt-10">No jobs found.</Text>}
        />
      )}
    </View>
  );
}
