import React, { useState, useEffect, useMemo } from 'react';
import { AdminLayout } from './AdminLayout';
import { AdminLoyaltyNav } from './components/AdminLoyaltyNav';
import { useAdminLoyalty } from './hooks/useAdminLoyalty';
import { useAuthStore } from '@/shared/stores/useAuthStore';
import {
  TierDefinition,
  MEMBERSHIP_TIERS,
  VND_PER_POINT,
  validateTierThresholds,
  getTierForPoints,
  getActiveMembershipTiers,
  saveCustomMembershipTiers,
  resetCustomMembershipTiers,
  getLoyaltyRuleConfig,
  saveLoyaltyRuleConfig,
  saveManualAdjustment,
  removeManualAdjustment,
  getManualAdjustments,
  getLoyaltyAuditLogs,
  addLoyaltyAuditLog,
  LoyaltyAuditLog,
  LoyaltyRuleConfig,
  PointTransaction,
  EVENT_LOYALTY_SETTINGS_CHANGED,
  EVENT_LOYALTY_ADJUSTMENTS_CHANGED,
} from '@/shared/loyalty';
import { loyaltyApi } from '@/shared/api';
import { formatCurrency, formatDate } from '@/shared/utils/formatters';
import {
  Settings,
  ShieldCheck,
  CheckCircle2,
  Database,
  Layers,
  Sparkles,
  RefreshCw,
  AlertCircle,
  AlertTriangle,
  PlusCircle,
  MinusCircle,
  Sliders,
  RotateCcw,
  History,
  UserCheck,
  FileText,
  Save,
  Search,
  ArrowRight,
  Clock,
  Check,
  X,
  Award,
  Undo2,
  HelpCircle,
} from 'lucide-react';

export const AdminLoyaltySettingsPage: React.FC = () => {
  const { profiles, refetch } = useAdminLoyalty();
  const { user } = useAuthStore();
  const currentAdminName = (user as any)?.fullName || user?.name || 'Quản Trị Viên';
  const currentAdminEmail = user?.email || 'admin@atelierverite.com';

  // Active Tab
  const [activeTab, setActiveTab] = useState<'tiers' | 'adjust' | 'rules' | 'audit'>('tiers');

  // --- STATE FOR TAB 1: SỬA ĐIỂM NÂNG HẠNG (TIERS) ---
  const [editableTiers, setEditableTiers] = useState<TierDefinition[]>(() => getActiveMembershipTiers());
  const [tiersSavedSuccess, setTiersSavedSuccess] = useState(false);
  const [tierValidationError, setTierValidationError] = useState<string | null>(null);

  // Validate ascending order in real time
  const isHierarchyValid = useMemo(() => {
    if (!editableTiers || editableTiers.length !== 12) return false;
    for (let i = 1; i < editableTiers.length; i++) {
      if (editableTiers[i].minPoints <= editableTiers[i - 1].minPoints) {
        return false;
      }
    }
    return true;
  }, [editableTiers]);

  const handleTierPointChange = (index: number, valueStr: string) => {
    const val = parseInt(valueStr, 10);
    const num = isNaN(val) ? 0 : Math.max(0, val);
    setEditableTiers((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], minPoints: num };
      return copy;
    });
    setTiersSavedSuccess(false);
    setTierValidationError(null);
  };

  const handleSaveTiers = async () => {
    if (!isHierarchyValid) {
      // Find where conflict occurs
      for (let i = 1; i < editableTiers.length; i++) {
        if (editableTiers[i].minPoints <= editableTiers[i - 1].minPoints) {
          setTierValidationError(
            `Ngưỡng điểm cấp "${editableTiers[i].nameVi}" (${editableTiers[i].minPoints.toLocaleString('vi-VN')} điểm) phải lớn hơn cấp liền trước "${editableTiers[i - 1].nameVi}" (${editableTiers[i - 1].minPoints.toLocaleString('vi-VN')} điểm).`
          );
          return;
        }
      }
      setTierValidationError('Các ngưỡng điểm phải theo thứ tự tăng dần nghiêm ngặt.');
      return;
    }

    const ok = saveCustomMembershipTiers(editableTiers);
    if (ok) {
      try {
        await loyaltyApi.updateTierSettings({ tiers: editableTiers });
      } catch {
        // Backend fallback ignored
      }

      addLoyaltyAuditLog({
        adminName: currentAdminName,
        adminEmail: currentAdminEmail,
        actionType: 'UPDATE_TIERS',
        reason: 'Cập nhật lại ngưỡng điểm nâng hạng cho 12 cấp bậc thành viên',
      });

      setTiersSavedSuccess(true);
      setTierValidationError(null);
      setTimeout(() => setTiersSavedSuccess(false), 4000);
      refetch();
    }
  };

  const handleResetTiersToDefault = () => {
    if (window.confirm('Bạn có chắc chắn muốn khôi phục ngưỡng điểm 12 cấp bậc về cấu hình mặc định ban đầu của Maison?')) {
      resetCustomMembershipTiers();
      setEditableTiers(MEMBERSHIP_TIERS);
      addLoyaltyAuditLog({
        adminName: currentAdminName,
        adminEmail: currentAdminEmail,
        actionType: 'UPDATE_TIERS',
        reason: 'Khôi phục cấu hình ngưỡng điểm 12 cấp hạng về mặc định',
      });
      setTiersSavedSuccess(true);
      setTierValidationError(null);
      setTimeout(() => setTiersSavedSuccess(false), 4000);
      refetch();
    }
  };

  // --- STATE FOR TAB 2: THU HỒI & ĐIỀU CHỈNH ĐIỂM (ADJUST / REVOKE) ---
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [adjustmentAction, setAdjustmentAction] = useState<'REVOKE' | 'GRANT' | 'RESET'>('REVOKE');
  const [adjustPointsInput, setAdjustPointsInput] = useState<string>('');
  const [reasonCategory, setReasonCategory] = useState<string>('REFUND_OUTSIDE');
  const [customReason, setCustomReason] = useState<string>('');
  const [referenceCode, setReferenceCode] = useState<string>('');
  const [isConfirmingAdjustment, setIsConfirmingAdjustment] = useState(false);
  const [adjustmentSuccessMsg, setAdjustmentSuccessMsg] = useState<string | null>(null);
  const [adjustmentErrorMsg, setAdjustmentErrorMsg] = useState<string | null>(null);

  const selectedProfile = useMemo(() => {
    return profiles.find((p) => p.customerId === selectedCustomerId) || null;
  }, [profiles, selectedCustomerId]);

  const filteredCustomerList = useMemo(() => {
    if (!customerSearchQuery.trim()) return profiles.slice(0, 20);
    const q = customerSearchQuery.toLowerCase();
    return profiles.filter((p) => {
      const matchName = (p.customerName || '').toLowerCase().includes(q);
      const matchEmail = (p.customerEmail || '').toLowerCase().includes(q);
      const matchPhone = (p.customerPhone || '').toLowerCase().includes(q);
      const matchId = p.customerId.toLowerCase().includes(q);
      return matchName || matchEmail || matchPhone || matchId;
    });
  }, [profiles, customerSearchQuery]);

  // Projected Points & Tier
  const pointsDeltaNumber = useMemo(() => {
    const val = parseInt(adjustPointsInput, 10);
    return isNaN(val) ? 0 : Math.max(0, val);
  }, [adjustPointsInput]);

  const projectedBalance = useMemo(() => {
    const current = selectedProfile?.currentBalance || 0;
    if (adjustmentAction === 'REVOKE') {
      return Math.max(0, current - pointsDeltaNumber);
    }
    if (adjustmentAction === 'GRANT') {
      return current + pointsDeltaNumber;
    }
    if (adjustmentAction === 'RESET') {
      return pointsDeltaNumber;
    }
    return current;
  }, [selectedProfile, adjustmentAction, pointsDeltaNumber]);

  const projectedTier = useMemo(() => {
    return getTierForPoints(projectedBalance, editableTiers);
  }, [projectedBalance, editableTiers]);

  const handleExecuteAdjustment = async () => {
    if (!selectedProfile) {
      setAdjustmentErrorMsg('Vui lòng chọn khách hàng cần thực hiện thao tác.');
      return;
    }
    if (adjustmentAction !== 'RESET' && pointsDeltaNumber <= 0) {
      setAdjustmentErrorMsg('Vui lòng nhập số điểm hợp lệ lớn hơn 0.');
      return;
    }

    let finalReason = customReason.trim();
    if (!finalReason) {
      switch (reasonCategory) {
        case 'REFUND_OUTSIDE':
          finalReason = 'Thu hồi điểm do hoàn trả hàng/hủy đơn ngoài hệ thống';
          break;
        case 'FRAUD_PREVENTION':
          finalReason = 'Thu hồi điểm do phát hiện đơn trùng lặp hoặc vi phạm chính sách';
          break;
        case 'AUDIT_CORRECTION':
          finalReason = 'Điều chỉnh đối soát số dư điểm theo quyết định kiểm toán';
          break;
        case 'COMPENSATION':
          finalReason = 'Cộng bù điểm hỗ trợ chăm sóc dịch vụ khách hàng';
          break;
        case 'VIP_GIFT':
          finalReason = 'Tặng điểm thưởng đặc quyền nhân sự kiện tri ân khách hàng VIP';
          break;
        default:
          finalReason = 'Điều chỉnh số dư điểm theo quyết định của Quản trị viên';
      }
    }

    let delta = 0;
    const currentBal = selectedProfile.currentBalance || 0;
    if (adjustmentAction === 'REVOKE') {
      delta = -Math.min(currentBal, pointsDeltaNumber);
    } else if (adjustmentAction === 'GRANT') {
      delta = pointsDeltaNumber;
    } else if (adjustmentAction === 'RESET') {
      delta = pointsDeltaNumber - currentBal;
    }

    const txId = `TX-ADJ-${Date.now().toString(36).toUpperCase()}`;
    const newTx: PointTransaction = {
      id: txId,
      customerId: selectedProfile.customerId,
      orderCode: referenceCode.trim() || 'ADMIN-ADJUSTMENT',
      orderId: referenceCode.trim() || undefined,
      eventType: delta < 0 ? 'REFUND_REVERSAL' : 'ADMIN_ADJUSTMENT',
      pointsDelta: delta,
      previousBalance: currentBal,
      newBalance: projectedBalance,
      createdAt: new Date().toISOString(),
      reason: finalReason,
      idempotencyKey: `adj-${selectedProfile.customerId}-${Date.now()}`,
      ruleVersion: 'v1.0',
      metadata: {
        adminName: currentAdminName,
        adminEmail: currentAdminEmail,
        actionType: adjustmentAction,
        referenceCode: referenceCode.trim() || undefined,
      },
    };

    saveManualAdjustment(newTx);

    try {
      await loyaltyApi.adjustPoints({
        customerId: selectedProfile.customerId,
        pointsDelta: delta,
        reason: finalReason,
        referenceCode: referenceCode.trim(),
      });
    } catch {
      // Backend api fallback
    }

    addLoyaltyAuditLog({
      adminName: currentAdminName,
      adminEmail: currentAdminEmail,
      actionType: adjustmentAction === 'REVOKE' ? 'REVOKE_POINTS' : adjustmentAction === 'GRANT' ? 'GRANT_POINTS' : 'RESET_BALANCE',
      targetCustomerId: selectedProfile.customerId,
      targetCustomerName: selectedProfile.customerName,
      pointsDelta: delta,
      previousBalance: currentBal,
      newBalance: projectedBalance,
      reason: finalReason,
      referenceCode: referenceCode.trim() || undefined,
    });

    setIsConfirmingAdjustment(false);
    setAdjustmentSuccessMsg(
      `Đã ${delta < 0 ? `thu hồi ${Math.abs(delta).toLocaleString('vi-VN')}` : `cộng ${delta.toLocaleString('vi-VN')}`} điểm cho khách hàng ${selectedProfile.customerName || selectedProfile.customerId}. Số dư mới: ${projectedBalance.toLocaleString('vi-VN')} điểm.`
    );
    setAdjustmentErrorMsg(null);
    setAdjustPointsInput('');
    setCustomReason('');
    setReferenceCode('');
    refetch();

    setTimeout(() => {
      setAdjustmentSuccessMsg(null);
    }, 6000);
  };

  // --- STATE FOR TAB 3: QUY TẮC TÍCH LŨY & ĐỔI THƯỞNG (RULES) ---
  const [ruleConfig, setRuleConfig] = useState<LoyaltyRuleConfig>(() => getLoyaltyRuleConfig());
  const [ruleSaveSuccess, setRuleSaveSuccess] = useState(false);

  const handleSaveRuleConfig = () => {
    saveLoyaltyRuleConfig(ruleConfig);
    addLoyaltyAuditLog({
      adminName: currentAdminName,
      adminEmail: currentAdminEmail,
      actionType: 'UPDATE_RULES',
      reason: `Cập nhật quy tắc tỷ lệ: ${ruleConfig.vndPerPoint.toLocaleString('vi-VN')} ₫/điểm, giá trị 1 pt = ${ruleConfig.pointValueVnd} ₫`,
    });
    setRuleSaveSuccess(true);
    setTimeout(() => setRuleSaveSuccess(false), 4000);
  };

  // --- STATE FOR TAB 4: NHẬT KÝ THAO TÁC QUẢN TRỊ (AUDIT LOGS) ---
  const [auditLogs, setAuditLogs] = useState<LoyaltyAuditLog[]>(() => getLoyaltyAuditLogs());
  const [auditSearchQuery, setAuditSearchQuery] = useState('');

  const refreshAuditLogs = () => {
    setAuditLogs(getLoyaltyAuditLogs());
  };

  useEffect(() => {
    const handleSettingsUpdate = () => {
      setEditableTiers(getActiveMembershipTiers());
      setRuleConfig(getLoyaltyRuleConfig());
      setAuditLogs(getLoyaltyAuditLogs());
    };
    const handleAdjustmentsUpdate = () => {
      setAuditLogs(getLoyaltyAuditLogs());
    };

    window.addEventListener(EVENT_LOYALTY_SETTINGS_CHANGED, handleSettingsUpdate);
    window.addEventListener(EVENT_LOYALTY_ADJUSTMENTS_CHANGED, handleAdjustmentsUpdate);
    return () => {
      window.removeEventListener(EVENT_LOYALTY_SETTINGS_CHANGED, handleSettingsUpdate);
      window.removeEventListener(EVENT_LOYALTY_ADJUSTMENTS_CHANGED, handleAdjustmentsUpdate);
    };
  }, []);

  const handleUndoAdjustment = (log: LoyaltyAuditLog) => {
    if (!log.targetCustomerId || typeof log.pointsDelta !== 'number') return;
    if (window.confirm(`Bạn có chắc chắn muốn hoàn tác thao tác của mã "${log.id}" đối với khách hàng ${log.targetCustomerName}?`)) {
      // Find and remove from manual adjustments if present
      const adjustments = getManualAdjustments();
      const match = adjustments.find(
        (a) => a.customerId === log.targetCustomerId && a.pointsDelta === log.pointsDelta
      );
      if (match) {
        removeManualAdjustment(match.id);
      } else {
        // Reverse by adding inverse delta
        const reverseTx: PointTransaction = {
          id: `TX-LP-UNDO-${Date.now().toString(36).toUpperCase()}`,
          customerId: log.targetCustomerId,
          orderCode: 'HOÀN TÁC ĐIỀU CHỈNH',
          eventType: log.pointsDelta < 0 ? 'ADMIN_ADJUSTMENT' : 'REFUND_REVERSAL',
          pointsDelta: -log.pointsDelta,
          previousBalance: log.newBalance || 0,
          newBalance: log.previousBalance || 0,
          createdAt: new Date().toISOString(),
          reason: `Hoàn tác thao tác điều chỉnh [${log.id}] của ${log.adminName}`,
          idempotencyKey: `undo-${log.id}-${Date.now()}`,
          ruleVersion: 'v1.0',
        };
        saveManualAdjustment(reverseTx);
      }

      addLoyaltyAuditLog({
        adminName: currentAdminName,
        adminEmail: currentAdminEmail,
        actionType: log.pointsDelta < 0 ? 'GRANT_POINTS' : 'REVOKE_POINTS',
        targetCustomerId: log.targetCustomerId,
        targetCustomerName: log.targetCustomerName,
        pointsDelta: -log.pointsDelta,
        reason: `Hoàn tác thao tác quản trị ${log.id} (${log.reason})`,
      });

      refreshAuditLogs();
      refetch();
    }
  };

  const filteredAuditLogs = useMemo(() => {
    if (!auditSearchQuery.trim()) return auditLogs;
    const q = auditSearchQuery.toLowerCase();
    return auditLogs.filter((log) => {
      const matchAdmin = log.adminName.toLowerCase().includes(q);
      const matchTarget = (log.targetCustomerName || '').toLowerCase().includes(q) || (log.targetCustomerId || '').toLowerCase().includes(q);
      const matchReason = log.reason.toLowerCase().includes(q);
      const matchId = log.id.toLowerCase().includes(q);
      return matchAdmin || matchTarget || matchReason || matchId;
    });
  }, [auditLogs, auditSearchQuery]);

  return (
    <AdminLayout
      title="Cấu Hình Quy Tắc & Quản Trị Điểm Thưởng"
      subtitle="Điều chỉnh ngưỡng điểm nâng hạng 12 cấp bậc, thu hồi và cộng điểm thành viên, thiết lập quy tắc tích lũy"
    >
      <div className="space-y-6">
        <AdminLoyaltyNav />

        {/* Tab Navigation Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-2.5 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('tiers')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                activeTab === 'tiers'
                  ? 'admin-pill-tab-active'
                  : 'admin-pill-tab-inactive'
              }`}
            >
              <Layers className={`w-4 h-4 shrink-0 ${activeTab === 'tiers' ? 'text-[var(--accent)]' : 'opacity-70'}`} />
              <span>Sửa Điểm Nâng Hạng</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors ${
                  activeTab === 'tiers'
                    ? 'bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/40'
                    : 'bg-[var(--bg-card-muted)] text-[var(--text-muted)] border border-[var(--border)]'
                }`}
              >
                12 Cấp
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('adjust')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                activeTab === 'adjust'
                  ? 'admin-pill-tab-active'
                  : 'admin-pill-tab-inactive'
              }`}
            >
              <Sliders className={`w-4 h-4 shrink-0 ${activeTab === 'adjust' ? 'text-[var(--accent)]' : 'opacity-70'}`} />
              <span>Thu Hồi & Điều Chỉnh Điểm</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors ${
                  activeTab === 'adjust'
                    ? 'bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/40'
                    : 'bg-[var(--bg-card-muted)] text-[var(--text-muted)] border border-[var(--border)]'
                }`}
              >
                Thao Tác
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('rules')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                activeTab === 'rules'
                  ? 'admin-pill-tab-active'
                  : 'admin-pill-tab-inactive'
              }`}
            >
              <Database className={`w-4 h-4 shrink-0 ${activeTab === 'rules' ? 'text-[var(--accent)]' : 'opacity-70'}`} />
              <span>Quy Tắc Tích Lũy</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('audit')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                activeTab === 'audit'
                  ? 'admin-pill-tab-active'
                  : 'admin-pill-tab-inactive'
              }`}
            >
              <History className={`w-4 h-4 shrink-0 ${activeTab === 'audit' ? 'text-[var(--accent)]' : 'opacity-70'}`} />
              <span>Nhật Ký Thao Tác</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors ${
                  activeTab === 'audit'
                    ? 'bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/40'
                    : 'bg-[var(--bg-card-muted)] text-[var(--text-muted)] border border-[var(--border)]'
                }`}
              >
                {auditLogs.length}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2 px-3">
            <span className="text-[11px] text-[var(--text-muted)] font-mono flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Quản trị viên: {currentAdminName}</span>
            </span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: SỬA ĐIỂM NÂNG HẠNG (TIERS) */}
        {/* ========================================================================= */}
        {activeTab === 'tiers' && (
          <div className="space-y-6">
            {/* Action Bar & Notifications */}
            <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-sans font-semibold text-base text-[var(--text-primary)]">
                    Bảng Cấu Hình Ngưỡng Điểm 12 Cấp Hạng Thành Viên
                  </h3>
                  {isHierarchyValid ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Thứ tự tăng dần hợp lệ</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30">
                      <AlertTriangle className="w-3 h-3" />
                      <span>Lỗi thứ tự ngưỡng</span>
                    </span>
                  )}
                </div>
                <p className="text-xs text-[var(--text-muted)]">
                  Chỉnh sửa trực tiếp số điểm nâng hạng cho từng cấp bậc. Khách hàng khi tích lũy đủ điểm sẽ tự động được thăng hạng tương ứng.
                </p>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={handleResetTiersToDefault}
                  className="px-3.5 py-2 rounded-lg text-xs font-mono uppercase text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-card)] border border-[var(--border)] hover:border-[var(--accent)] transition-all shadow-xs hover:shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-[var(--accent)]" />
                  <span>Khôi phục mặc định</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveTiers}
                  className="px-4 py-2 rounded-lg text-xs font-mono uppercase font-bold text-[var(--accent-contrast)] bg-[var(--accent)] border border-[var(--accent)] hover:brightness-105 shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Lưu Ngưỡng Cấp Hạng</span>
                </button>
              </div>
            </div>

            {/* Validation Error Alert */}
            {tierValidationError && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-600 dark:text-red-300 flex items-start gap-3">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-bold">Lỗi xác thực cấu hình:</p>
                  <p>{tierValidationError}</p>
                </div>
              </div>
            )}

            {/* Success Alert */}
            {tiersSavedSuccess && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-600 dark:text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Cấu hình 12 cấp hạng thành viên đã được lưu và áp dụng thành công trên toàn hệ thống!</span>
              </div>
            )}

            {/* Editable Matrix Table */}
            <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-sans">
                  <thead>
                    <tr className="border-b border-[var(--border)] bg-[var(--bg-card-muted)] text-[var(--text-muted)] text-[10px] uppercase font-mono tracking-wider">
                      <th className="py-3.5 px-3 w-12 text-center">STT</th>
                      <th className="py-3.5 px-4">Nhóm Kim Loại / Ngọc</th>
                      <th className="py-3.5 px-4">Cấp Bậc</th>
                      <th className="py-3.5 px-4">Tên Tiếng Việt</th>
                      <th className="py-3.5 px-4 w-48">Ngưỡng Điểm Nâng Hạng (Sửa tại đây)</th>
                      <th className="py-3.5 px-4 text-right">Mua Sắm Tương Đương</th>
                      <th className="py-3.5 px-4 text-center">Kiểm Tra Thứ Tự</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)] font-mono">
                    {editableTiers.map((tier, idx) => {
                      const prevTier = idx > 0 ? editableTiers[idx - 1] : null;
                      const isOrderOk = idx === 0 ? tier.minPoints === 0 : tier.minPoints > (prevTier?.minPoints ?? 0);
                      const equivalentVnd = tier.minPoints * ruleConfig.vndPerPoint;

                      return (
                        <tr
                          key={tier.id}
                          className={`hover:bg-[var(--table-row-hover)] transition-colors ${
                            !isOrderOk ? 'bg-red-500/5' : ''
                          }`}
                        >
                          <td className="py-3 px-3 text-center text-xs text-[var(--text-muted)]">
                            {idx + 1}
                          </td>
                          <td className="py-3 px-4 uppercase text-[var(--text-muted)] font-serif text-xs">
                            {tier.family}
                          </td>
                          <td className="py-3 px-4 text-[var(--text-primary)]">
                            Cấp {tier.level}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2.5 py-1 rounded text-xs font-bold border ${tier.badgeColor}`}>
                              {tier.nameVi}
                            </span>
                          </td>
                          <td className="py-2.5 px-4">
                            <div className="relative flex items-center max-w-[170px]">
                              <input
                                type="number"
                                min={idx === 0 ? 0 : (prevTier?.minPoints || 0) + 1}
                                step="10"
                                value={tier.minPoints}
                                disabled={idx === 0}
                                onChange={(e) => handleTierPointChange(idx, e.target.value)}
                                className={`w-full bg-[var(--input-bg)] border rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-[var(--accent)] focus:outline-none transition-colors ${
                                  !isOrderOk
                                    ? 'border-red-500 focus:border-red-500 text-red-500'
                                    : 'border-[var(--border)] focus:border-[var(--accent)]'
                                } ${idx === 0 ? 'opacity-60 cursor-not-allowed bg-black/5 dark:bg-white/5' : ''}`}
                              />
                              <span className="absolute right-2.5 text-[10px] text-[var(--text-muted)] pointer-events-none">
                                điểm
                              </span>
                            </div>
                            {idx === 0 && (
                              <span className="text-[10px] text-[var(--text-muted)] mt-0.5 block font-sans">
                                (Cấp khởi đầu mặc định: 0 điểm)
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right text-[var(--text-secondary)] font-mono">
                            {equivalentVnd.toLocaleString('vi-VN')} ₫
                          </td>
                          <td className="py-3 px-4 text-center">
                            {isOrderOk ? (
                              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-sans">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Hợp lệ</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] text-red-500 font-sans font-semibold">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                <span>Phải &gt; {prevTier?.minPoints}</span>
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: THU HỒI & ĐIỀU CHỈNH ĐIỂM (ADJUST / REVOKE) */}
        {/* ========================================================================= */}
        {activeTab === 'adjust' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Form Column */}
            <div className="lg:col-span-7 space-y-6">
              <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] space-y-6 shadow-sm">
                <div className="flex items-center gap-2 border-b border-[var(--border)] pb-4">
                  <Sliders className="w-5 h-5 text-[var(--accent)]" />
                  <div>
                    <h3 className="font-sans font-semibold text-base text-[var(--text-primary)]">
                      Biểu Mẫu Thu Hồi & Điều Chỉnh Điểm Thành Viên
                    </h3>
                    <p className="text-xs text-[var(--text-muted)]">
                      Thực hiện thao tác thu hồi điểm vi phạm, hoàn trả hàng ngoài hệ thống hoặc cộng điểm tri ân có ghi nhận audit trail.
                    </p>
                  </div>
                </div>

                {/* Notifications */}
                {adjustmentSuccessMsg && (
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-600 dark:text-emerald-300 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{adjustmentSuccessMsg}</span>
                  </div>
                )}
                {adjustmentErrorMsg && (
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-600 dark:text-red-300 flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{adjustmentErrorMsg}</span>
                  </div>
                )}

                {/* Step 1: Select Customer */}
                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase tracking-wider text-[var(--text-secondary)] flex items-center justify-between">
                    <span>1. Chọn Khách Hàng:</span>
                    <span className="text-[10px] text-[var(--text-muted)] font-sans">
                      {profiles.length} thành viên khả dụng
                    </span>
                  </label>

                  <div className="relative">
                    <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={customerSearchQuery}
                      onChange={(e) => setCustomerSearchQuery(e.target.value)}
                      placeholder="Tìm kiếm khách hàng theo tên, email, số điện thoại hoặc mã ID..."
                      className="w-full bg-[var(--input-bg)] border border-[var(--border)] focus:border-[var(--accent)] rounded-xl pl-10 pr-4 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Customer Quick Selector Dropdown/List */}
                  <div className="max-h-48 overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--bg-card-muted)] divide-y divide-[var(--border)] text-xs">
                    {filteredCustomerList.length === 0 ? (
                      <div className="p-4 text-center text-xs text-[var(--text-muted)] font-sans">
                        Không tìm thấy khách hàng phù hợp với từ khóa tìm kiếm.
                      </div>
                    ) : (
                      filteredCustomerList.map((p) => {
                        const isSelected = selectedCustomerId === p.customerId;
                        return (
                          <div
                            key={p.customerId}
                            onClick={() => {
                              setSelectedCustomerId(p.customerId);
                              setAdjustmentErrorMsg(null);
                            }}
                            className={`p-3 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-[var(--accent)]/15 border-l-4 border-l-[var(--accent)]'
                                : 'hover:bg-[var(--table-row-hover)]'
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-[var(--text-primary)] truncate">
                                  {p.customerName || 'Khách hàng chưa đặt tên'}
                                </span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${p.currentTier.badgeColor}`}>
                                  {p.currentTier.nameVi}
                                </span>
                              </div>
                              <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-2 mt-0.5">
                                <span>{p.customerEmail || 'Chưa có email'}</span>
                                {p.customerPhone && <span>• {p.customerPhone}</span>}
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <span className="font-mono font-bold text-xs text-[var(--accent)] block">
                                {p.currentBalance.toLocaleString('vi-VN')} điểm
                              </span>
                              <span className="text-[10px] text-[var(--text-muted)]">
                                {p.eligibleOrdersCount} đơn
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Step 2: Action Type Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase tracking-wider text-[var(--text-secondary)]">
                    2. Loại Thao Tác Điểm Thưởng:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setAdjustmentAction('REVOKE')}
                      className={`p-3 rounded-xl border text-left transition-all flex items-center gap-3 ${
                        adjustmentAction === 'REVOKE'
                          ? 'border-red-500 bg-red-500/10 text-red-600 dark:text-red-300 font-bold shadow-sm'
                          : 'border-[var(--border)] bg-[var(--bg-card-muted)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      <MinusCircle className="w-5 h-5 shrink-0 text-red-500" />
                      <div>
                        <div className="text-xs font-semibold">Thu Hồi Điểm</div>
                        <div className="text-[10px] opacity-75 font-normal">Giảm trừ / hoàn lại</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAdjustmentAction('GRANT')}
                      className={`p-3 rounded-xl border text-left transition-all flex items-center gap-3 ${
                        adjustmentAction === 'GRANT'
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 font-bold shadow-sm'
                          : 'border-[var(--border)] bg-[var(--bg-card-muted)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      <PlusCircle className="w-5 h-5 shrink-0 text-emerald-500" />
                      <div>
                        <div className="text-xs font-semibold">Cộng Điểm Thưởng</div>
                        <div className="text-[10px] opacity-75 font-normal">Bù điểm / tri ân VIP</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAdjustmentAction('RESET')}
                      className={`p-3 rounded-xl border text-left transition-all flex items-center gap-3 ${
                        adjustmentAction === 'RESET'
                          ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-300 font-bold shadow-sm'
                          : 'border-[var(--border)] bg-[var(--bg-card-muted)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      <Sliders className="w-5 h-5 shrink-0 text-amber-500" />
                      <div>
                        <div className="text-xs font-semibold">Cân Bằng Số Dư</div>
                        <div className="text-[10px] opacity-75 font-normal">Đặt lại trực tiếp</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Step 3: Points Amount Input */}
                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase tracking-wider text-[var(--text-secondary)] flex items-center justify-between">
                    <span>
                      3. Số Điểm Cần {adjustmentAction === 'REVOKE' ? 'Thu Hồi' : adjustmentAction === 'GRANT' ? 'Cộng Thêm' : 'Thiết Lập'}:
                    </span>
                    {selectedProfile && (
                      <span className="text-[11px] font-mono text-[var(--text-muted)]">
                        Số dư hiện tại: <strong className="text-[var(--text-primary)]">{selectedProfile.currentBalance.toLocaleString('vi-VN')} điểm</strong>
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={adjustPointsInput}
                      onChange={(e) => setAdjustPointsInput(e.target.value)}
                      placeholder="Nhập số điểm nguyên dương (ví dụ: 100, 250, 500)..."
                      className="w-full bg-[var(--input-bg)] border border-[var(--border)] focus:border-[var(--accent)] rounded-xl px-4 py-2.5 text-sm font-mono text-[var(--text-primary)] focus:outline-none transition-colors"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-[var(--text-muted)]">
                      điểm thưởng
                    </span>
                  </div>
                </div>

                {/* Step 4: Reason Selection & Custom Details */}
                <div className="space-y-3">
                  <label className="text-xs font-mono uppercase tracking-wider text-[var(--text-secondary)]">
                    4. Lý Do Thu Hồi / Điều Chỉnh (Bắt buộc cho Nhật ký kiểm toán):
                  </label>

                  <select
                    value={reasonCategory}
                    onChange={(e) => setReasonCategory(e.target.value)}
                    className="w-full bg-[var(--input-bg)] border border-[var(--border)] focus:border-[var(--accent)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none"
                  >
                    <option value="REFUND_OUTSIDE">Thu hồi điểm do hoàn trả hàng / hủy đơn ngoài hệ thống</option>
                    <option value="FRAUD_PREVENTION">Thu hồi điểm do phát hiện đơn hàng trùng lặp hoặc vi phạm</option>
                    <option value="AUDIT_CORRECTION">Điều chỉnh đối soát số dư điểm theo quyết định tài chính</option>
                    <option value="COMPENSATION">Cộng bù điểm hỗ trợ chăm sóc & trải nghiệm khách hàng</option>
                    <option value="VIP_GIFT">Tặng điểm thưởng đặc quyền nhân sự kiện tri ân khách hàng VIP</option>
                    <option value="CUSTOM">Lý do khác (Nhập chi tiết bên dưới)</option>
                  </select>

                  <textarea
                    rows={2}
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Ghi chú chi tiết lý do điều chỉnh hoặc số biên bản xử lý nội bộ..."
                    className="w-full bg-[var(--input-bg)] border border-[var(--border)] focus:border-[var(--accent)] rounded-xl p-3 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none transition-colors resize-none"
                  />
                </div>

                {/* Step 5: Reference / Order Code */}
                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase tracking-wider text-[var(--text-secondary)]">
                    5. Mã Tham Chiếu / Số Đơn Hàng Liên Quan (Tùy chọn):
                  </label>
                  <input
                    type="text"
                    value={referenceCode}
                    onChange={(e) => setReferenceCode(e.target.value)}
                    placeholder="Ví dụ: ORD-202611-0982, REF-REV-001, COMP-CS-404..."
                    className="w-full bg-[var(--input-bg)] border border-[var(--border)] focus:border-[var(--accent)] rounded-xl px-4 py-2 text-xs font-mono text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none transition-colors"
                  />
                </div>

                {/* Submit Action Button */}
                <div className="pt-2">
                  <button
                    type="button"
                    disabled={!selectedProfile || pointsDeltaNumber <= 0}
                    onClick={() => setIsConfirmingAdjustment(true)}
                    className={`w-full py-3 rounded-lg text-xs font-mono uppercase tracking-wider font-bold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer ${
                      !selectedProfile || pointsDeltaNumber <= 0
                        ? 'bg-[var(--bg-card-muted)] text-[var(--text-muted)] cursor-not-allowed border border-[var(--border)] shadow-none'
                        : adjustmentAction === 'REVOKE'
                        ? 'bg-red-600 hover:bg-red-700 text-white border border-red-600'
                        : 'bg-[var(--accent)] hover:brightness-105 text-[var(--accent-contrast)] border border-[var(--accent)]'
                    }`}
                  >
                    {adjustmentAction === 'REVOKE' ? (
                      <>
                        <MinusCircle className="w-4 h-4" />
                        <span>Xác Nhận Thu Hồi Điểm</span>
                      </>
                    ) : adjustmentAction === 'GRANT' ? (
                      <>
                        <PlusCircle className="w-4 h-4" />
                        <span>Xác Nhận Cộng Điểm Thưởng</span>
                      </>
                    ) : (
                      <>
                        <Sliders className="w-4 h-4" />
                        <span>Xác Nhận Cân Bằng Số Dư</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Impact Preview Column */}
            <div className="lg:col-span-5 space-y-6">
              <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] space-y-6 shadow-sm sticky top-6">
                <div className="flex items-center gap-2 border-b border-[var(--border)] pb-3">
                  <Sparkles className="w-4 h-4 text-[var(--accent)]" />
                  <h4 className="font-sans font-semibold text-sm text-[var(--text-primary)]">
                    Mô Phỏng Tác Động Số Dư & Cấp Hạng
                  </h4>
                </div>

                {selectedProfile ? (
                  <div className="space-y-4">
                    {/* Selected Customer Identity Card */}
                    <div className="p-4 rounded-xl bg-[var(--bg-card-muted)] border border-[var(--border)] space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[var(--text-muted)]">Họ và tên:</span>
                        <span className="font-semibold text-[var(--text-primary)]">{selectedProfile.customerName}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[var(--text-muted)]">Mã thành viên:</span>
                        <span className="font-mono text-[var(--accent)]">#{selectedProfile.customerId.slice(-8)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[var(--text-muted)]">Email:</span>
                        <span className="text-[var(--text-secondary)]">{selectedProfile.customerEmail || 'N/A'}</span>
                      </div>
                    </div>

                    {/* Impact Cards */}
                    <div className="grid grid-cols-2 gap-3 text-center">
                      <div className="p-3.5 rounded-xl bg-[var(--bg-card-muted)] border border-[var(--border)] space-y-1">
                        <span className="text-[10px] uppercase font-mono text-[var(--text-muted)] block">
                          Số Dư Hiện Tại
                        </span>
                        <span className="font-mono text-lg font-bold text-[var(--text-primary)]">
                          {selectedProfile.currentBalance.toLocaleString('vi-VN')}
                        </span>
                        <div className="pt-1">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${selectedProfile.currentTier.badgeColor}`}>
                            {selectedProfile.currentTier.nameVi}
                          </span>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-[var(--bg-card-muted)] border border-[var(--border)] space-y-1">
                        <span className="text-[10px] uppercase font-mono text-[var(--text-muted)] block">
                          Sau Khi Thực Hiện
                        </span>
                        <span
                          className={`font-mono text-lg font-bold ${
                            projectedBalance > selectedProfile.currentBalance
                              ? 'text-emerald-500'
                              : projectedBalance < selectedProfile.currentBalance
                              ? 'text-red-500'
                              : 'text-[var(--text-primary)]'
                          }`}
                        >
                          {projectedBalance.toLocaleString('vi-VN')}
                        </span>
                        <div className="pt-1">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${projectedTier.badgeColor}`}>
                            {projectedTier.nameVi}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Tier Transition Indicator */}
                    <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg-card-muted)] text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[var(--text-muted)]">Biến động điểm số:</span>
                        <span
                          className={`font-mono font-bold ${
                            adjustmentAction === 'REVOKE'
                              ? 'text-red-500'
                              : adjustmentAction === 'GRANT'
                              ? 'text-emerald-500'
                              : 'text-amber-500'
                          }`}
                        >
                          {adjustmentAction === 'REVOKE'
                            ? `-${pointsDeltaNumber.toLocaleString('vi-VN')} điểm`
                            : adjustmentAction === 'GRANT'
                            ? `+${pointsDeltaNumber.toLocaleString('vi-VN')} điểm`
                            : `${(projectedBalance - selectedProfile.currentBalance > 0 ? '+' : '')}${(projectedBalance - selectedProfile.currentBalance).toLocaleString('vi-VN')} điểm`}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-[var(--text-muted)]">Chuyển biến cấp hạng:</span>
                        <div className="flex items-center gap-1.5 font-mono text-[11px]">
                          <span>{selectedProfile.currentTier.nameVi}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-[var(--accent)]" />
                          <span className="font-bold text-[var(--accent)]">{projectedTier.nameVi}</span>
                        </div>
                      </div>

                      {projectedTier.id !== selectedProfile.currentTier.id && (
                        <div className="p-2 rounded bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-600 dark:text-amber-300">
                          {adjustmentAction === 'REVOKE' ? (
                            <span>Lưu ý: Thao tác thu hồi điểm sẽ làm hạ cấp bậc của thành viên.</span>
                          ) : (
                            <span>Chúc mừng: Thao tác sẽ giúp thành viên thăng hạng mới ngay lập tức.</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-xs text-[var(--text-muted)] font-sans space-y-2">
                    <UserCheck className="w-8 h-8 text-[var(--text-muted)] mx-auto opacity-50" />
                    <p>Vui lòng tìm và chọn một khách hàng từ danh sách để xem mô phỏng biến động điểm và cấp hạng.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Confirmation Dialog / Modal */}
            {isConfirmingAdjustment && selectedProfile && (
              <div
                className="fixed inset-0 z-50 bg-[rgba(26,26,23,0.55)] backdrop-blur-sm flex items-center justify-center p-4 pointer-events-auto"
                role="dialog"
                aria-modal="true"
                aria-label={adjustmentAction === 'REVOKE' ? 'Xác Nhận Thu Hồi Điểm' : 'Xác Nhận Điều Chỉnh Điểm'}
              >
                <div className="bg-[var(--surface)] border border-[var(--border)] rounded-sm max-w-md w-full p-6 space-y-4 shadow-2xl text-[var(--text)]">
                  <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                    <div className="flex items-center gap-2">
                      {adjustmentAction === 'REVOKE' ? (
                        <MinusCircle className="w-5 h-5 text-red-500" />
                      ) : (
                        <PlusCircle className="w-5 h-5 text-emerald-500" />
                      )}
                      <h3 className="font-sans text-base font-semibold text-[var(--text)] uppercase tracking-wider">
                        Xác Nhận {adjustmentAction === 'REVOKE' ? 'Thu Hồi Điểm' : 'Điều Chỉnh Điểm'}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsConfirmingAdjustment(false)}
                      className="p-1 text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
                      aria-label="Đóng"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-3 text-xs text-[var(--text-secondary)]">
                    <p>
                      Bạn có chắc chắn muốn thực hiện thao tác sau đối với thành viên{' '}
                      <strong className="text-[var(--text)]">{selectedProfile.customerName}</strong>:
                    </p>

                    <div className="p-3.5 rounded-sm bg-[var(--bg-alt)] border border-[var(--border)] space-y-2 font-mono">
                      <div className="flex justify-between">
                        <span className="text-[var(--text-muted)]">Loại thao tác:</span>
                        <span className="font-bold text-[var(--text)]">
                          {adjustmentAction === 'REVOKE' ? 'Thu Hồi Điểm' : adjustmentAction === 'GRANT' ? 'Cộng Điểm Thưởng' : 'Đặt Lại Số Dư'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--text-muted)]">Biến động:</span>
                        <span className={`font-bold ${adjustmentAction === 'REVOKE' ? 'text-red-500' : 'text-emerald-500'}`}>
                          {adjustmentAction === 'REVOKE' ? `-${pointsDeltaNumber}` : `+${pointsDeltaNumber}`} điểm
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--text-muted)]">Số dư mới:</span>
                        <span className="font-bold text-[var(--accent)]">{projectedBalance} điểm ({projectedTier.nameVi})</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--text-muted)]">Lý do:</span>
                        <span className="text-right max-w-[200px] truncate text-[var(--text-secondary)] font-sans">
                          {customReason.trim() || reasonCategory}
                        </span>
                      </div>
                    </div>

                    <p className="text-[11px] text-[var(--text-muted)]">
                      Thao tác này sẽ được ghi nhận vào Sổ cái giao dịch điểm và Nhật ký kiểm toán quản trị (Audit Trail).
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[var(--border)]">
                    <button
                      type="button"
                      onClick={() => setIsConfirmingAdjustment(false)}
                      className="px-4 py-2 rounded-sm text-xs font-mono uppercase tracking-wider border border-[var(--border)] hover:bg-[var(--bg-alt)] text-[var(--text)] transition-colors"
                    >
                      Hủy Bỏ
                    </button>
                    <button
                      type="button"
                      onClick={handleExecuteAdjustment}
                      className={`px-5 py-2 rounded-sm text-xs font-mono uppercase tracking-wider font-semibold text-white transition-all shadow-sm ${
                        adjustmentAction === 'REVOKE' ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'
                      }`}
                    >
                      Xác Nhận Thực Hiện
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: QUY TẮC TÍCH LŨY & TỶ LỆ QUY ĐỔI (RULES) */}
        {/* ========================================================================= */}
        {activeTab === 'rules' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card 1: Point Earning & Conversion */}
              <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] space-y-5 shadow-sm">
                <div className="flex items-center gap-2 border-b border-[var(--border)] pb-3">
                  <Database className="w-5 h-5 text-[var(--accent)]" />
                  <h3 className="font-sans font-semibold text-base text-[var(--text-primary)]">
                    Tỷ Lệ Tích Lũy Điểm Mua Sắm
                  </h3>
                </div>

                <div className="space-y-4 text-xs font-sans">
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono uppercase text-[var(--text-secondary)]">
                      Tỷ lệ tích lũy điểm chuẩn (Số tiền tương đương 1 điểm):
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1000"
                        step="1000"
                        value={ruleConfig.vndPerPoint}
                        onChange={(e) =>
                          setRuleConfig({
                            ...ruleConfig,
                            vndPerPoint: Math.max(1000, parseInt(e.target.value, 10) || 10000),
                          })
                        }
                        className="w-full bg-[var(--input-bg)] border border-[var(--border)] focus:border-[var(--accent)] rounded-xl px-4 py-2 text-xs font-mono text-[var(--text-primary)] focus:outline-none"
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-mono text-xs text-[var(--accent)]">
                        ₫ = 1 điểm
                      </span>
                    </div>
                    <span className="text-[11px] text-[var(--text-muted)] block">
                      Ví dụ: 10.000 ₫ mua sắm hợp lệ tích lũy được 1 điểm thưởng thành viên.
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-mono uppercase text-[var(--text-secondary)]">
                      Giá trị quy đổi giảm trừ trực tiếp khi sử dụng điểm:
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="10"
                        step="10"
                        value={ruleConfig.pointValueVnd}
                        onChange={(e) =>
                          setRuleConfig({
                            ...ruleConfig,
                            pointValueVnd: Math.max(10, parseInt(e.target.value, 10) || 100),
                          })
                        }
                        className="w-full bg-[var(--input-bg)] border border-[var(--border)] focus:border-[var(--accent)] rounded-xl px-4 py-2 text-xs font-mono text-[var(--text-primary)] focus:outline-none"
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-mono text-xs text-emerald-500">
                        ₫ / 1 điểm
                      </span>
                    </div>
                    <span className="text-[11px] text-[var(--text-muted)] block">
                      Khi khách hàng thanh toán bằng điểm: 100 điểm = 10.000 ₫ giảm trừ hóa đơn.
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-mono uppercase text-[var(--text-secondary)]">
                      Điểm tối thiểu mỗi lần đổi thưởng:
                    </label>
                    <input
                      type="number"
                      min="10"
                      step="10"
                      value={ruleConfig.minRedeemPoints}
                      onChange={(e) =>
                        setRuleConfig({
                          ...ruleConfig,
                          minRedeemPoints: Math.max(0, parseInt(e.target.value, 10) || 50),
                        })
                      }
                      className="w-full bg-[var(--input-bg)] border border-[var(--border)] focus:border-[var(--accent)] rounded-xl px-4 py-2 text-xs font-mono text-[var(--text-primary)] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Card 2: Conditions & Policy */}
              <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] space-y-5 shadow-sm">
                <div className="flex items-center gap-2 border-b border-[var(--border)] pb-3">
                  <ShieldCheck className="w-5 h-5 text-[var(--accent)]" />
                  <h3 className="font-sans font-semibold text-base text-[var(--text-primary)]">
                    Điều Kiện Kích Hoạt & Toàn Vẹn
                  </h3>
                </div>

                <div className="space-y-3.5 text-xs font-sans">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-card-muted)] border border-[var(--border)]">
                    <div>
                      <div className="font-semibold text-[var(--text-primary)]">Đơn hàng hoàn tất (delivered)</div>
                      <div className="text-[11px] text-[var(--text-muted)]">Chỉ tích điểm khi đơn hàng đã giao thành công</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={ruleConfig.requireDelivered}
                      onChange={(e) => setRuleConfig({ ...ruleConfig, requireDelivered: e.target.checked })}
                      className="w-4 h-4 accent-[var(--accent)] rounded cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-card-muted)] border border-[var(--border)]">
                    <div>
                      <div className="font-semibold text-[var(--text-primary)]">Thanh toán hoàn tất (paid)</div>
                      <div className="text-[11px] text-[var(--text-muted)]">Đơn hàng phải được ghi nhận đã thanh toán</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={ruleConfig.requirePaid}
                      onChange={(e) => setRuleConfig({ ...ruleConfig, requirePaid: e.target.checked })}
                      className="w-4 h-4 accent-[var(--accent)] rounded cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-card-muted)] border border-[var(--border)]">
                    <div>
                      <div className="font-semibold text-[var(--text-primary)]">Tự động thu hồi điểm hoàn tiền</div>
                      <div className="text-[11px] text-[var(--text-muted)]">Tự động trừ điểm và hạ hạng khi có hoàn tiền</div>
                    </div>
                    <span className="font-mono text-emerald-500 font-bold text-[11px]">BẬT (Mặc định)</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-card-muted)] border border-[var(--border)]">
                    <div>
                      <div className="font-semibold text-[var(--text-primary)]">Khóa chống trùng lặp Idempotency</div>
                      <div className="text-[11px] text-[var(--text-muted)]">Ngăn chặn cộng điểm nhiều lần cho cùng một hóa đơn</div>
                    </div>
                    <span className="font-mono text-emerald-500 font-bold text-[11px]">BẬT (Bắt buộc)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Save Button & Feedback */}
            <div className="flex items-center justify-between p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] shadow-sm">
              <span className="text-xs text-[var(--text-muted)] font-sans">
                Mọi thay đổi quy tắc tích lũy sẽ được áp dụng ngay lập tức cho các giao dịch mới.
              </span>
              <div className="flex items-center gap-3">
                {ruleSaveSuccess && (
                  <span className="text-xs text-emerald-500 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Đã lưu quy tắc thành công!
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleSaveRuleConfig}
                  className="px-5 py-2.5 rounded-lg text-xs font-mono uppercase font-bold text-[var(--accent-contrast)] bg-[var(--accent)] border border-[var(--accent)] hover:brightness-105 transition-all flex items-center gap-2 shadow-md hover:shadow-lg cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Lưu Cấu Hình Quy Tắc</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: NHẬT KÝ THAO TÁC QUẢN TRỊ (AUDIT LOGS) */}
        {/* ========================================================================= */}
        {activeTab === 'audit' && (
          <div className="space-y-4">
            {/* Toolbar */}
            <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={auditSearchQuery}
                  onChange={(e) => setAuditSearchQuery(e.target.value)}
                  placeholder="Tìm theo người thực hiện, khách hàng, lý do hoặc mã log..."
                  className="w-full bg-[var(--input-bg)] border border-[var(--border)] focus:border-[var(--accent)] rounded-xl pl-10 pr-4 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none transition-colors"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={refreshAuditLogs}
                  className="px-3.5 py-2 rounded-xl text-xs font-mono uppercase border border-[var(--border)] hover:border-[var(--accent)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all flex items-center gap-1.5 bg-[var(--bg-card-muted)]"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-[var(--accent)]" />
                  <span>Làm mới nhật ký</span>
                </button>
              </div>
            </div>

            {/* Audit Log Table */}
            <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-sans">
                  <thead>
                    <tr className="border-b border-[var(--border)] bg-[var(--bg-card-muted)] text-[var(--text-muted)] text-[10px] uppercase font-mono tracking-wider">
                      <th className="py-3 px-3 w-12 text-center">STT</th>
                      <th className="py-3 px-4">Thời Gian</th>
                      <th className="py-3 px-4">Quản Trị Viên</th>
                      <th className="py-3 px-4">Khách Hàng Mục Tiêu</th>
                      <th className="py-3 px-4">Loại Hành Động</th>
                      <th className="py-3 px-4 text-right">Biến Động</th>
                      <th className="py-3 px-4">Lý Do / Diễn Giải</th>
                      <th className="py-3 px-4 text-center">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)] font-mono">
                    {filteredAuditLogs.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-[var(--text-muted)] font-sans">
                          Chưa có nhật ký thao tác nào được ghi nhận.
                        </td>
                      </tr>
                    ) : (
                      filteredAuditLogs.map((log, idx) => {
                        const isRevoke = log.actionType === 'REVOKE_POINTS';
                        const isGrant = log.actionType === 'GRANT_POINTS';
                        const isTiers = log.actionType === 'UPDATE_TIERS';
                        const isRules = log.actionType === 'UPDATE_RULES';

                        return (
                          <tr key={log.id} className="hover:bg-[var(--table-row-hover)] transition-colors">
                            <td className="py-3 px-3 text-center text-xs text-[var(--text-muted)]">
                              {idx + 1}
                            </td>
                            <td className="py-3 px-4 text-[var(--text-muted)] whitespace-nowrap text-[11px]">
                              {formatDate(log.timestamp)}
                            </td>
                            <td className="py-3 px-4 font-semibold text-[var(--text-primary)]">
                              {log.adminName}
                            </td>
                            <td className="py-3 px-4">
                              {log.targetCustomerName ? (
                                <div>
                                  <span className="text-[var(--text-primary)] font-semibold block">
                                    {log.targetCustomerName}
                                  </span>
                                  <span className="text-[10px] text-[var(--text-muted)] font-mono">
                                    #{log.targetCustomerId?.slice(-8)}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-[var(--text-muted)] font-sans">Toàn hệ thống</span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              {isRevoke ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30">
                                  Thu Hồi Điểm
                                </span>
                              ) : isGrant ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                  Cộng Điểm Thưởng
                                </span>
                              ) : isTiers ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                                  Sửa Ngưỡng Cấp Hạng
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                                  Cập Nhật Quy Tắc
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right font-bold">
                              {typeof log.pointsDelta === 'number' ? (
                                <span
                                  className={
                                    log.pointsDelta < 0
                                      ? 'text-red-500'
                                      : log.pointsDelta > 0
                                      ? 'text-emerald-500'
                                      : 'text-[var(--text-muted)]'
                                  }
                                >
                                  {log.pointsDelta > 0 ? `+${log.pointsDelta}` : log.pointsDelta} điểm
                                </span>
                              ) : (
                                <span className="text-[var(--text-muted)]">—</span>
                              )}
                            </td>
                            <td className="py-3 px-4 max-w-xs truncate text-[var(--text-secondary)] font-sans">
                              {log.reason}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {log.targetCustomerId && typeof log.pointsDelta === 'number' && (
                                <button
                                  type="button"
                                  onClick={() => handleUndoAdjustment(log)}
                                  title="Hoàn tác thao tác điều chỉnh này"
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-mono uppercase text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 transition-colors border border-[var(--border)]"
                                >
                                  <Undo2 className="w-3 h-3" />
                                  <span>Hoàn tác</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
