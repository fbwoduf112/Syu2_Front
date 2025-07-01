import React, { useEffect, useState, useRef } from 'react';
import SockJS from 'sockjs-client';
import { Stomp, CompatClient } from '@stomp/stompjs';
import api from '../API/TokenConfig';

interface OrdersModalProps {
  storeId: number;
  onClose: () => void;
}

const OrdersModal: React.FC<OrdersModalProps> = ({ storeId, onClose }) => {
  const [orderData, setOrderData] = useState<any>(null);
  const [completedIds, setCompletedIds] = useState<number[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const hasLoadedInitialOrders = useRef(false); // 최초 API 요청 방지용

  useEffect(() => {
    const socket = new SockJS(`${process.env.REACT_APP_API_URL}/ws`);
    const client: CompatClient = Stomp.over(socket);

    client.connect(
      {},
      () => {
        client.subscribe(`/topic/orders/${storeId}`, (message) => {
          try {
            let payload = JSON.parse(message.body);

            // ✅ JSON이 한 번 더 감싸진 문자열일 경우 처리
            if (typeof payload === 'string') {
              payload = JSON.parse(payload);
            }

            console.log('📨 실시간 메시지 수신:', payload);

            if (payload.groups && Array.isArray(payload.groups)) {
              setOrderData(payload);
            } else if (Array.isArray(payload)) {
              setOrderData({ groups: payload });
            } else {
              console.warn('⚠️ 예상치 못한 메시지 구조:', payload);
            }
          } catch (err) {
            console.error('❌ 메시지 파싱 실패:', err);
          }
        });

        setIsConnected(true);

        // ✅ 최초 1회만 API 요청
        (async () => {
          if (hasLoadedInitialOrders.current) return;
          hasLoadedInitialOrders.current = true;

          try {
            const res = await api.get(`/api/orders/getMenu`);
            console.log('✅ 초기 주문 데이터 수신:', res.data);

            if (res.data.groups && Array.isArray(res.data.groups)) {
              setOrderData(res.data);
            } else if (Array.isArray(res.data)) {
              setOrderData({ groups: res.data });
            } else {
              console.warn('⚠️ API 데이터 구조가 이상함:', res.data);
            }
          } catch (err) {
            console.error('❌ 주문 목록 불러오기 실패:', err);
          }
        })();
      },
      (error: unknown) => {
        console.error('❌ WebSocket 연결 실패:', error);
      }
    );

    return () => {
      if (client.connected) {
        client.disconnect(() => {
          console.log('❌ WebSocket 연결 종료');
        });
      }
    };
  }, [storeId]);

  console.log('🧪 orderData 상태:', orderData);

  const markOrderAsCompleted = async (orderGroupId: number) => {
    try {
      await api.post(`/api/orders/${orderGroupId}/complete`, { active: true });
      setCompletedIds((prev) => [...prev, orderGroupId]);
      console.log(`✅ 주문 그룹 ${orderGroupId} 완료 처리됨`);
    } catch (err) {
      console.error('❌ 오류 발생:', err);
      alert('주문 완료 처리 중 오류 발생');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded shadow w-[500px] max-h-[80vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">📦 실시간 주문 현황</h2>

        {!isConnected ? (
          <p>🕐 서버 연결 중...</p>
        ) : orderData?.groups?.length > 0 ? (
          orderData.groups.map((group: any) => {
            const orderGroupId = group.orderGroupId ?? Math.random();
            const isCompleted = completedIds.includes(group.orderGroupId);

            return (
              <div
                key={orderGroupId}
                className={`border rounded p-3 mb-4 ${isCompleted ? 'opacity-50' : ''}`}
              >
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold">🧾 주문 그룹 #{group.orderGroupId ?? '미지정'}</h3>
                  <button
                    onClick={() =>
                      group.orderGroupId && markOrderAsCompleted(group.orderGroupId)
                    }
                    className="text-sm px-2 py-1 bg-green-500 text-white rounded disabled:opacity-50"
                    disabled={isCompleted || !group.orderGroupId}
                  >
                    ✅ 완료
                  </button>
                </div>
                <ul className="space-y-1">
                  {group.items?.length > 0 ? (
                    group.items.map((item: any, idx: number) => (
                      <li key={idx} className="flex justify-between border-b py-1">
                        <span>{item.menuName} × {item.quantity}</span>
                        <span>₩{(item.price * item.quantity).toLocaleString()}</span>
                      </li>
                    ))
                  ) : (
                    <li>❌ 주문 항목 없음</li>
                  )}
                </ul>
              </div>
            );
          })
        ) : (
          <p>📭 아직 주문 없음</p>
        )}

        <div className="flex justify-end mt-4">
          <button onClick={onClose} className="px-4 py-2 bg-blue-500 text-white rounded">
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrdersModal;
