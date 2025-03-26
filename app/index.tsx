import React, { useState, useEffect } from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as tf from "@tensorflow/tfjs";
import * as mobilenet from "@tensorflow-models/mobilenet";
import axios from "axios";
import OpenAI from "openai";

const IndexScreen = () => {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [clothingInfo, setClothingInfo] = useState<string | null>(null);
  const [outfitSuggestion, setOutfitSuggestion] = useState<string | null>(null);
  const [weather, setWeather] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      await tf.ready();
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
    <View className="flex-1 items-center justify-center bg-gray-900">
      <TouchableOpacity className="px-4 py-2 bg-blue-500 rounded-2xl my-2 opacity-80" onPress={() => pickImage(false)}>
        <Text className="text-white text-lg">Şəkil seç</Text>
      </TouchableOpacity>
      <TouchableOpacity className="px-4 py-2 bg-green-500 rounded-2xl my-2 opacity-80" onPress={() => pickImage(true)}>
        <Text className="text-white text-lg">Kamera aç</Text>
      </TouchableOpacity>

      {imageUri ? (
        <Image source={{ uri: imageUri }} className="w-48 h-48 mt-4 rounded-lg border-2 border-gray-600" />
      ) : null}

      {clothingInfo && <Text className="text-lg text-white mt-2">Paltar tipi: {clothingInfo}</Text>}
      {weather && <Text className="text-lg text-white">Hava temperaturu: {weather}°C</Text>}
      {outfitSuggestion && <Text className="text-lg font-bold text-yellow-400 mt-2">{outfitSuggestion}</Text>}

      {feedback && (
        <View className="mt-4 p-4 bg-gray-800 rounded-lg w-4/5 border border-yellow-400">
          <Text className="text-lg font-bold text-yellow-400">Yapay Zəka Feedback:</Text>
          <Text className="text-lg text-white mt-2">{feedback}</Text>
        </View>
      )}
    </View>
  );
};

export default IndexScreen;
