import React, { useState } from 'react';
import { AdminLayout } from './AdminLayout';
import { AdminLoyaltyNav } from './components/AdminLoyaltyNav';
import { useAdminLoyalty } from './hooks/useAdminLoyalty';
import { formatDate } from '@/shared/utils/formatters';
import {
  Clock,
  Search,
  Filter,
  FileSpreadsheet,
  ArrowUpRight,
  TrendingUp,
  AlertTriangle,
  Layers,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminLoyaltyTransactionsPage: React.FC = () => {
  const { allTransactions, isLoading, error, refetch } = useAdminLoyalty();
  const [search, setSearch] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState<'ALL' | 'EARN' | 'REFUND_REVERSAL'>('ALL');

  const filteredTransactions = allTransactions.filter((tx) => {
    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchTxId = tx.id.toLowerCase().includes(q);
      const matchOrder = String(tx.orderCode || tx.orderId || '').toLowerCase().includes(q);
      const matchCust = String(tx.customerId || '').toLowerCase().includes(q);
      const matchReason = tx.reason.toLowerCase().includes(q);
      if (!matchTxId && !matchOrder && !matchCust && !matchReason) return false;
    }

    // Event type filter
    if (eventTypeFilter !== 'ALL' && tx.eventType !== eventTypeFilter) {
      return false;
    }

    return true;
  });

  return (
    <AdminLayout
      title="Sổ Cái Giao Dịch Điểm Toàn Hệ Thống"
      subtitle="Nhật ký giao dịch điểm thưởng độc lập, bảo đảm tính toàn vẹn và chống trùng lặp"
    >
      <div className="space-y-6">
        <AdminLoyaltyNav />

        {/* Toolbar */}
        <div className="p-4 rounded-xl bg-noir-900 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-platinum-dark absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo mã GD, mã đơn hàng, Patron ID hoặc lý do..."
              className="w-full bg-noir-950 border border-white/15 focus:border-champagne rounded-sm pl-10 pr-4 py-2 text-xs text-white placeholder-platinum-dark focus:outline-none transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-platinum-dark font-mono">Loại sự kiện:</span>
            <div className="flex items-center gap-1 p-1 rounded-lg bg-noir-950 border border-white/10">
              <button
                type="button"
                onClick={() => setEventTypeFilter('ALL')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  eventTypeFilter === 'ALL'
                    ? 'bg-champagne text-noir-950 font-semibold shadow-sm'
                    : 'text-platinum-light hover:text-white'
                }`}
              >
                Tất cả ({allTransactions.length})
              </button>
              <button
                type="button"
                onClick={() => setEventTypeFilter('EARN')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  eventTypeFilter === 'EARN'
                    ? 'bg-champagne text-noir-950 font-semibold shadow-sm'
                    : 'text-platinum-light hover:text-white'
                }`}
              >
                Cộng điểm ({allTransactions.filter((t) => t.eventType === 'EARN').length})
              </button>
              <button
                type="button"
                onClick={() => setEventTypeFilter('REFUND_REVERSAL')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  eventTypeFilter === 'REFUND_REVERSAL'
                    ? 'bg-champagne text-noir-950 font-semibold shadow-sm'
                    : 'text-platinum-light hover:text-white'
                }`}
              >
                Thu hồi ({allTransactions.filter((t) => t.eventType === 'REFUND_REVERSAL').length})
              </button>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="rounded-xl bg-noir-900 border border-white/10 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="border-b border-white/10 bg-noir-950/60 text-platinum-dark text-[10px] uppercase font-mono tracking-wider">
                  <th className="py-3.5 px-4">Thời Gian</th>
                  <th className="py-3.5 px-4">Mã Giao Dịch</th>
                  <th className="py-3.5 px-4">Loại Sự Kiện</th>
                  <th className="py-3.5 px-4">Patron ID</th>
                  <th className="py-3.5 px-4">Mã Đơn Hàng</th>
                  <th className="py-3.5 px-4">Lý Do Chi Tiết</th>
                  <th className="py-3.5 px-4 text-right">Biến Động</th>
                  <th className="py-3.5 px-4 text-right">Số Dư Sau GD</th>
                  <th className="py-3.5 px-4">Khóa Idempotency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-platinum-dark">
                      Đang xử lý sổ cái điểm từ các đơn hàng...
                    </td>
                  </tr>
                ) : filteredTransactions.length > 0 ? (
                  filteredTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4 font-mono text-[11px] text-platinum-dark whitespace-nowrap">
                        {formatDate(tx.createdAt)}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-champagne whitespace-nowrap font-medium">
                        {tx.id}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {tx.eventType === 'EARN' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            Tích Điểm
                          </span>
                        ) : tx.eventType === 'REFUND_REVERSAL' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase bg-amber-500/10 text-amber-400 border border-amber-500/30">
                            Thu Hồi
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase bg-blue-500/10 text-blue-400 border border-blue-500/30">
                            Admin
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-platinum-light whitespace-nowrap">
                        {tx.customerId.slice(-8).toUpperCase()}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-white whitespace-nowrap">
                        {tx.orderId ? (
                          <Link
                            to={`/orders/${tx.orderId}`}
                            className="hover:text-champagne underline flex items-center gap-1"
                          >
                            <span>#{String(tx.orderCode || tx.orderId).slice(-8)}</span>
                            <ArrowUpRight className="w-3 h-3 text-platinum-dark" />
                          </Link>
                        ) : (
                          <span className="text-platinum-dark">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-platinum-light max-w-xs truncate">
                        {tx.reason}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold whitespace-nowrap">
                        {tx.pointsDelta > 0 ? (
                          <span className="text-emerald-400">+{tx.pointsDelta.toLocaleString('vi-VN')}</span>
                        ) : (
                          <span className="text-amber-400">{tx.pointsDelta.toLocaleString('vi-VN')}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-white whitespace-nowrap">
                        {tx.newBalance.toLocaleString('vi-VN')} pts
                      </td>
                      <td className="py-3 px-4 font-mono text-[10px] text-platinum-dark max-w-[140px] truncate">
                        {tx.idempotencyKey}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-platinum-dark">
                      Không tìm thấy giao dịch nào phù hợp tiêu chí lọc.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
