import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native';
import { api } from '../services/api';

export default function AuthScreen({ onLoginSuccess }) {
  const [role, setRole] = useState('candidate');
  const [phone, setPhone] = useState('9876543210');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    try {
      setLoading(true);
      await api.sendOtp({ phone });
      setStep(2);
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    try {
      setLoading(true);
      const res = await api.verifyOtp({ phone, otp, role });
      if (res.access_token) {
        const user = await api.getMe();
        onLoginSuccess(user);
      }
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 justify-center px-6 bg-cream">
      <View className="items-center mb-8">
        <Image 
          source={require('../assets/logo.png')} 
          style={{ width: 64, height: 64, resizeMode: 'contain', borderRadius: 12, marginBottom: 8 }} 
        />
        <Text className="text-3xl font-bold text-navy text-center">MyCareerPath</Text>
        <Text className="text-xs text-gray-500 mt-1">Local Opportunities, Brighter Tomorrows</Text>
      </View>
      
      {step === 1 && (
        <View className="flex-row justify-between mb-6 bg-gray-200 rounded-lg p-1">
          {['candidate', 'recruiter', 'admin'].map(r => (
            <TouchableOpacity 
              key={r}
              onPress={() => setRole(r)}
              className={`flex-1 py-2 rounded-md items-center ${role === r ? 'bg-white shadow' : ''}`}
            >
              <Text className={`capitalize font-semibold ${role === r ? 'text-navy' : 'text-gray-500'}`}>{r}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <Text className="text-sm text-gray-600 mb-2">{step === 1 ? 'Mobile Number' : 'Enter OTP'}</Text>
      
      {step === 1 ? (
        <TextInput
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          className="border border-gray-300 rounded-lg p-4 bg-white mb-6 text-lg"
          placeholder="10-digit mobile number"
        />
      ) : (
        <TextInput
          value={otp}
          onChangeText={setOtp}
          keyboardType="number-pad"
          className="border border-gray-300 rounded-lg p-4 bg-white mb-6 text-lg text-center"
          placeholder="123456"
        />
      )}

      <TouchableOpacity 
        onPress={step === 1 ? handleSendOtp : handleVerifyOtp}
        disabled={loading}
        className="bg-orange rounded-lg p-4 items-center"
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold text-lg">{step === 1 ? 'Send OTP' : 'Verify & Login'}</Text>}
      </TouchableOpacity>
      
      {step === 2 && (
        <TouchableOpacity onPress={() => setStep(1)} className="mt-4">
          <Text className="text-center text-gray-500">Back to phone entry</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

