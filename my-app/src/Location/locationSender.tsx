// src/components/LocationSender.tsx
import React, { useEffect } from "react";
import { useGeolocation } from "../hooks/useGeolocation";
import api from "../API/TokenConfig"; // ← 네가 설정한 axios instance

const LocationSender: React.FC = () => {
  const { location, error } = useGeolocation();

  useEffect(() => {
    const sendLocation = async () => {
      try {
        if (!location) return;

        const response = await api.post("/api/location", location);
        console.log("✅ 위치 전송 성공:", response.data);
      } catch (err: any) {
        console.error("❌ 위치 전송 실패:", err.message);
      }
    };

    sendLocation();
  }, [location]);

  return (
    <div className="p-4">
      {error && <p className="text-red-500">❌ 위치 에러: {error}</p>}
      {!location && !error && <p>📡 위치를 가져오는 중...</p>}
      {location && <p>✅ 위치 전송 완료 (위도: {location.latitude}, 경도: {location.longitude})</p>}
    </div>
  );
};

export default LocationSender;
