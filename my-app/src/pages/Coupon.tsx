import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import CouponCreateModal from '../Coupon/CouponCreateModal';
import CouponEditModal, { CouponForm as CouponEditForm } from '../Coupon/CouponEditModal';
import CouponList, { Coupon } from '../Coupon/CouponList';
import api from '../API/TokenConfig';
import AlertModal from '../Coupon/AlertCoupon'; // 경로는 너 프로젝트에 맞게 수정

interface CouponCreateForm {
  couponName: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: string;
  discountLimit: string;
  minimumOrderAmount: string;
  expiryDate: string;
  expiryDays: string;
  issueStartTime: string;
  totalQuantity: string;
  applicableCategories: string;
}

export default function CouponPage() {
  const navigate = useNavigate();
  const { storeId } = useParams<{ storeId: string }>();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [isConfirmMode, setIsConfirmMode] = useState(false);

  const [createForm, setCreateForm] = useState<CouponCreateForm>({
    couponName: '',
    discountType: 'PERCENTAGE',
    discountValue: '',
    discountLimit: '',
    minimumOrderAmount: '',
    expiryDate: '',
    expiryDays: '',
    issueStartTime: '',
    totalQuantity: '',
    applicableCategories: '',
  });
  const [createExpiryType, setCreateExpiryType] = useState<'ABSOLUTE' | 'RELATIVE'>('ABSOLUTE');

  const fetchCoupons = useCallback(async () => {
    if (!storeId) return;
    try {
      const response = await api.get(`/api/store/coupons/my`);
      setCoupons(response.data);
    } catch (error) {
      console.error('❌ 쿠폰 목록 조회 오류:', error);
      setAlertMessage('쿠폰 목록을 불러오는 데 실패했습니다.');
      setIsConfirmMode(false);
    }
  }, [storeId]);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const handleCreateCoupon = async () => {
    const payload = {
      couponName: createForm.couponName,
      discountType: createForm.discountType,
      discountValue: Number(createForm.discountValue),
      discountLimit: createForm.discountLimit ? Number(createForm.discountLimit) : null,
      minimumOrderAmount: Number(createForm.minimumOrderAmount),
      expiryType: createExpiryType,
      expiryDate: createExpiryType === 'ABSOLUTE' ? createForm.expiryDate : null,
      expiryDays: createExpiryType === 'RELATIVE' ? Number(createForm.expiryDays) : null,
      issueStartTime: createForm.issueStartTime,
      totalQuantity: Number(createForm.totalQuantity),
      applicableCategories: createForm.applicableCategories
        .split(',')
        .map(cat => cat.trim())
        .filter(Boolean),
    };

    try {
      await api.post('/api/store/coupons', payload);
      setAlertMessage('✅ 쿠폰이 성공적으로 생성되었습니다.');
      setIsConfirmMode(false);
      setShowCreateModal(false);
      fetchCoupons();
    } catch (error: any) {
      console.error('쿠폰 생성 오류:', error);
      const message = error.response?.data?.message || '네트워크 오류 또는 서버 내부 오류';
      setAlertMessage(`❌ 생성 실패: ${message}`);
      setIsConfirmMode(false);
    }
  };

  const handleEditClick = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setShowEditModal(true);
  };

  const handleUpdateCoupon = async (couponId: number, form: CouponEditForm, expiryType: 'ABSOLUTE' | 'RELATIVE') => {
    const payload = {
      couponName: form.couponName,
      discountType: form.discountType,
      discountValue: Number(form.discountValue),
      discountLimit: form.discountLimit ? Number(form.discountLimit) : null,
      minimumOrderAmount: Number(form.minimumOrderAmount),
      expiryType,
      expiryDate: expiryType === 'ABSOLUTE' ? form.expiryDate : null,
      expiryDays: expiryType === 'RELATIVE' ? Number(form.expiryDays) : null,
      issueStartTime: form.issueStartTime,
      totalQuantity: Number(form.totalQuantity),
      applicableCategories: form.applicableCategories
        .split(',')
        .map(cat => cat.trim())
        .filter(Boolean),
    };

    try {
      await api.put(`/api/store/coupons/${couponId}`, payload);
      setAlertMessage('✅ 쿠폰이 성공적으로 수정되었습니다.');
      setIsConfirmMode(false);
      setShowEditModal(false);
      setEditingCoupon(null);
      fetchCoupons();
    } catch (error: any) {
      console.error('쿠폰 수정 오류:', error);
      const message = error.response?.data?.message || '네트워크 오류 또는 서버 내부 오류';
      setAlertMessage(`❌ 수정 실패: ${message}`);
      setIsConfirmMode(false);
    }
  };

  const handleDeleteCoupon = (couponId: number) => {
    setAlertMessage('정말로 이 쿠폰을 삭제하시겠습니까? 발급된 쿠폰은 삭제할 수 없습니다.');
    setIsConfirmMode(true);
    setConfirmAction(() => async () => {
      try {
        await api.delete(`/api/store/coupons/${couponId}`);
        setAlertMessage('✅ 쿠폰이 삭제되었습니다.');
        setIsConfirmMode(false);
        fetchCoupons();
      } catch (error: any) {
        console.error('쿠폰 삭제 오류:', error);
        const message = error.response?.data?.message || '네트워크 오류 또는 서버 내부 오류';
        setAlertMessage(`❌ 삭제 실패: ${message}`);
        setIsConfirmMode(false);
      }
    });
  };

  const handleStatusChange = async (couponId: number, status: Coupon['status']) => {
    try {
      await api.patch(`/api/store/coupons/${couponId}/status`, { status });
      setAlertMessage(`✅ 쿠폰 상태가 ${status}(으)로 변경되었습니다.`);
      setIsConfirmMode(false);
      fetchCoupons();
    } catch (error: any) {
      console.error('쿠폰 상태 변경 오류:', error);
      const message = error.response?.data?.message || '네트워크 오류 또는 서버 내부 오류';
      setAlertMessage(`❌ 상태 변경 실패: ${message}`);
      setIsConfirmMode(false);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">🎟️ 쿠폰 관리</h1>

      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-pink-600 text-white rounded"
        >
          쿠폰 생성하기
        </button>
        <button
          onClick={() => navigate(`/owner/dashboard/${storeId}`)}
          className="px-4 py-2 bg-gray-300 text-black rounded"
        >
          ← 돌아가기
        </button>
      </div>

      {showCreateModal && (
        <CouponCreateModal
          form={createForm}
          setForm={setCreateForm}
          expiryType={createExpiryType}
          setExpiryType={setCreateExpiryType}
          onSubmit={handleCreateCoupon}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {showEditModal && editingCoupon && (
        <CouponEditModal
          coupon={editingCoupon}
          onSubmit={handleUpdateCoupon}
          onClose={() => {
            setShowEditModal(false);
            setEditingCoupon(null);
          }}
        />
      )}

      <CouponList
        coupons={coupons}
        onEdit={handleEditClick}
        onDelete={handleDeleteCoupon}
        onStatusChange={handleStatusChange}
      />

      {alertMessage && (
        <AlertModal
          message={alertMessage}
          onClose={() => {
            setAlertMessage(null);
            setConfirmAction(null);
          }}
          onConfirm={isConfirmMode ? confirmAction! : undefined}
          confirmText={isConfirmMode ? '확인' : '닫기'}
          cancelText="취소"
        />
      )}
    </div>
  );
}
