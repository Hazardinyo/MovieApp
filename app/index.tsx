import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, SafeAreaView, StatusBar, Image } from "react-native";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as tf from "@tensorflow/tfjs";
import * as mobilenet from "@tensorflow-models/mobilenet";
import axios from "axios";
import OpenAI from "openai";
import { Stack } from 'expo-router';
import * as Location from 'expo-location';
import { MaterialIcons, Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import PantsIcon from './components/PantsIcon';

const Home = () => {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [clothingInfo, setClothingInfo] = useState<string | null>(null);
  const [outfitSuggestion, setOutfitSuggestion] = useState<string | null>(null);
  const [weather, setWeather] = useState<number | null>(25);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [location, setLocation] = useState('Loading...');

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocation('Permission denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation('Baku, Azerbaijan'); // Bu hissəni real API ilə əvəz edəcəyik
    })();
  }, []);

  const pickImage = async (fromCamera: boolean) => {
    let result;
    if (fromCamera) {
      result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images, // Corrected here
        allowsEditing: true,
        quality: 1,
      });
    } else {
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images, // Corrected here
        allowsEditing: true,
        quality: 1,
      });
    }
  
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      analyzeImage(result.assets[0].uri);
    }
  };
  

  const analyzeImage = async (uri: string) => {
    try {
      const model = await mobilenet.load();
      console.log("Model loaded successfully");

      const response = await fetch(uri);
      const blob = await response.blob();
      const image = await createImageBitmap(blob);

      const imageTensor = tf.browser.fromPixels(image);
      const predictions = await model.classify(imageTensor);

      if (predictions.length > 0) {
        const detectedClothing = predictions[0].className;
        console.log("Detected clothing:", detectedClothing);

        await AsyncStorage.setItem("clothingInfo", detectedClothing);
        setClothingInfo(detectedClothing);

        fetchWeather(detectedClothing);
      }
    } catch (error) {
      console.error("Error analyzing image:", error);
    }
  };

  const fetchWeather = async (clothing: string) => {
    const API_KEY = "SENİN_API_AÇARIN";
    try {
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=Baku&appid=${API_KEY}&units=metric`
      );
      const temp = response.data.main.temp;
      setWeather(temp);

      suggestOutfit(clothing, temp);
    } catch (error) {
      console.error("Weather API error:", error);
    }
  };

  const suggestOutfit = async (clothing: string, temp: number) => {
    try {
      const openai = new OpenAI({ apiKey: "SENİN_OPENAI_API_AÇARIN" });
  
      const prompt = `Mənim geyimim ${clothing}. Hava temperaturu ${temp}°C-dir. Hava şəraitinə uyğun hansı kombini geyinməliyəm?`;
  
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
      });
  
      const suggestion = response.choices[0].message.content;
      setOutfitSuggestion(suggestion);
  
      // **Yeni Feedback Məntiqi**
      if (temp < 10 && clothing.includes("light")) {
        setFeedback("Hava çox soyuqdur! Yüngül paltar geyinmək olmaz!");
      } else if (temp > 25 && (clothing.includes("coat") || clothing.includes("jacket"))) {
        setFeedback("Çox isti hava üçün bu paltar uyğun deyil!");
      } else {
        setFeedback("Paltar hava şəraitinə tam uyğundur! Geyinmək olar ✅");
      }
    } catch (error) {
      console.error("OpenAI error:", error);
    }
  };
  
  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />
      <View className="flex-1 px-4">
        {/* Header */}
        <View className="flex-row justify-between items-center py-4">
          <TouchableOpacity className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center">
            <Ionicons name="person" size={24} color="gray" />
          </TouchableOpacity>
          <Text className="text-base font-medium">{location}</Text>
        </View>

        {/* Qarderob Button */}
        <TouchableOpacity className="bg-gray-100 rounded-xl p-6 mt-3">
          <View className="flex-row items-center">
            <MaterialIcons name="door-front" size={30} color="black" />
            <Text className="text-2xl font-bold ml-2 fontSize-20 ">Qarderob</Text>
          </View>
        </TouchableOpacity>

        {/* Weather Info */}
        <View className="bg-blue-400 rounded-xl p-4 mt-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <MaterialIcons name="wb-sunny" size={24} color="white" />
              <Text className="text-white text-lg ml-2">Günəşli</Text>
            </View>
            <Text className="text-white text-xl font-bold">+{weather}°C</Text>
          </View>
        </View>

        {/* Outfit Combination */}
        <View className="flex-1 mt-4">
          <View className="flex-row justify-between items-center mb-4">
            <TouchableOpacity>
              <MaterialIcons name="refresh" size={30} color="black" />
            </TouchableOpacity>
            <TouchableOpacity>
              <MaterialIcons name="watch" size={30} color="black" />
            </TouchableOpacity>
          </View>

          {/* Clothes Display */}
          <View className="flex-1 items-center space-y-10">
            {/* Hat */}
            <View className="w-24 h-24 bg-gray-100 rounded-xl items-center justify-center">
              <Image 
                source={{uri: ''}}
                className="w-full h-full rounded-xl"
                style={{display: 'none'}}
              />
              <MaterialIcons name="face" size={40} color="gray" />
            </View>
            
            {/* Shirt */}
            <View className="w-40 h-40 mt-3 bg-gray-100 rounded-xl items-center justify-center">
              <Image 
                source={{uri: ''}}
                className="w-full h-full rounded-xl"
                style={{display: 'none'}}
              />
              <Ionicons name="shirt-outline" size={56} color="gray" />
            </View>

            {/* Pants */}
            <View className="w-40 h-40 bg-gray-100 rounded-xl items-center justify-center">
              <Image 
                source={{uri: ''}}
                className="w-full h-full rounded-xl"
                style={{display: 'none'}}
              />
              <PantsIcon size={56} color="gray" />
            </View>

            {/* Shoes */}
            <View className="w-24 h-24 mt-3 bg-gray-100 rounded-xl items-center justify-center">
              <Image 
                source={{uri: ''}}
                className="w-full h-full rounded-xl"
                style={{display: 'none'}}
              />
              <MaterialCommunityIcons name="shoe-sneaker" size={40} color="gray" />
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Home;
