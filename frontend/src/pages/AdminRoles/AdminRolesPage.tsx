import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../Admin/AdminLayout';
import { rolesApi } from '@/shared/api';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Users,
  KeyRound,
  History,
  Plus,
  Save,
  Check,
  X,
  Lock,
  Unlock,
  Search,
  RefreshCw,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { useToastStore } from '@/shared/stores/useToastStore';
import { useAuthStore } from '@/shared/stores/useAuthStore';
import { useModal, ModalPortal } from '@/shared/context/ModalContext';
import { TablePagination } from '@/shared/components/TablePagination';
import { StatusToggle } from '@/shared/components/StatusToggle';
import { StatusBadge } from '@/shared/components/StatusBadge';
import {
  AdminActionGroup,
  LockActionButton,
  UnlockActionButton,
} from '@/shared/components';

interface RoleItem {
  _id: string;
  name: string;
  displayName: string;
  description?: string;
  permissions: string[];
  isSystem: boolean;
}

interface PermissionGroup {
  group: string;
  items: { key: string; label: string; description?: string }[];
}

interface RbacUserItem {
  _id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  permissionOverrides?: {
    allow?: string[];
    deny?: string[];
  };
  createdAt: string;
}

interface AuditLogItem {
  _id: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  targetId?: string;
  targetType?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  createdAt: string;
}

export const AdminRolesPage: React.FC = () => {
  const { addToast } = useToastStore();
  const { user: currentUser } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'matrix' | 'users' | 'audit'>('matrix');
  const [loading, setLoading] = useState(true);

  // Matrix State
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [permissionGroups, setPermissionGroups] = useState<PermissionGroup[]>([]);
  const [allPermissions, setAllPermissions] = useState<string[]>([]);
  const [matrixState, setMatrixState] = useState<Record<string, string[]>>({});
  const [isSavingMatrix, setIsSavingMatrix] = useState(false);

  // New Role Modal
  const [isCreateRoleModalOpen, setIsCreateRoleModalOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDisplayName, setNewRoleDisplayName] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');

  const { overlayZIndex: createRoleOverlayZ, contentZIndex: createRoleContentZ } = useModal({
    id: 'admin-create-role-modal',
    isOpen: isCreateRoleModalOpen,
    onClose: () => setIsCreateRoleModalOpen(false),
  });

  // Users Tab State
  const [users, setUsers] = useState<RbacUserItem[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [userStatusFilter, setUserStatusFilter] = useState('all');
  const [usersPage, setUsersPage] = useState(1);
  const [usersTotal, setUsersTotal] = useState(0);
  const [isUsersLoading, setIsUsersLoading] = useState(false);

  // Edit User Overrides Modal
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<RbacUserItem | null>(null);
  const [editUserRole, setEditUserRole] = useState('');
  const [editUserAllow, setEditUserAllow] = useState<string[]>([]);
  const [editUserDeny, setEditUserDeny] = useState<string[]>([]);
  const [isSavingUserOverrides, setIsSavingUserOverrides] = useState(false);

  const { overlayZIndex: userEditOverlayZ, contentZIndex: userEditContentZ } = useModal({
    id: 'admin-edit-user-overrides-modal',
    isOpen: Boolean(selectedUserForEdit),
    onClose: () => setSelectedUserForEdit(null),
  });

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [auditTotal, setAuditTotal] = useState(0);
  const [isAuditLoading, setIsAuditLoading] = useState(false);

  // Fetch initial roles & permissions
  const loadRolesAndPermissions = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const [rolesRes, permsRes] = await Promise.all([
        rolesApi.getRoles(),
        rolesApi.getStandardPermissions(),
      ]);

      const fetchedRoles = rolesRes.data || [];
      const groups = permsRes.data?.groups || [];
      const allPerms = permsRes.data?.allPermissions || [];

      setRoles(fetchedRoles);
      setPermissionGroups(groups);
      setAllPermissions(allPerms);

      // Build local editable matrix state: roleId -> permissions[]
      const matrix: Record<string, string[]> = {};
      fetchedRoles.forEach((r: RoleItem) => {
        matrix[r._id] = [...(r.permissions || [])];
      });
      setMatrixState(matrix);
    } catch (err: any) {
      addToast(err?.message || 'Không thể tải danh sách vai trò và quyền hạn', 'error');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    void loadRolesAndPermissions();
  }, []);

  // Fetch users when tab is active or filters change
  const loadUsers = async (silent = false) => {
    try {
      if (!silent) setIsUsersLoading(true);
      const res = await rolesApi.getUsers({
        page: usersPage,
        limit: 15,
        search: userSearch || undefined,
        role: userRoleFilter !== 'all' ? userRoleFilter : undefined,
        status: userStatusFilter !== 'all' ? userStatusFilter : undefined,
      });
      setUsers(res.data?.users || []);
      setUsersTotal(res.data?.total || 0);
    } catch (err: any) {
      addToast(err?.message || 'Không thể tải danh sách người dùng', 'error');
    } finally {
      if (!silent) setIsUsersLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'users') {
      void loadUsers();
    }
  }, [activeTab, usersPage, userRoleFilter, userStatusFilter]);

  // Fetch audit logs
  const loadAuditLogs = async () => {
    try {
      setIsAuditLoading(true);
      const res = await rolesApi.getAuditLogs({ page: 1, limit: 30 });
      setAuditLogs(res.data?.logs || []);
      setAuditTotal(res.data?.total || 0);
    } catch (err: any) {
      addToast(err?.message || 'Không thể tải nhật ký kiểm toán', 'error');
    } finally {
      setIsAuditLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'audit') {
      void loadAuditLogs();
    }
  }, [activeTab]);

  // Toggle permission in local matrix state
  const handleToggleMatrixPermission = (roleId: string, roleName: string, permKey: string) => {
    if (roleName === 'admin') return; // Admin has permanent full access

    setMatrixState((prev) => {
      const currentPerms = prev[roleId] || [];
      const hasPerm = currentPerms.includes(permKey);
      const nextPerms = hasPerm
        ? currentPerms.filter((p) => p !== permKey)
        : [...currentPerms, permKey];

      return {
        ...prev,
        [roleId]: nextPerms,
      };
    });
  };

  // Save Role Matrix changes
  const handleSaveMatrix = async () => {
    try {
      setIsSavingMatrix(true);
      const updatePromises = roles
        .filter((r) => r.name !== 'admin')
        .map((r) =>
          rolesApi.updateRole(r._id, {
            permissions: matrixState[r._id] || [],
          })
        );

      await Promise.all(updatePromises);
      // Cập nhật ma trận trực tiếp vào roles cục bộ, không reload lại toàn bộ trang
      setRoles((prev) =>
        prev.map((r) =>
          matrixState[r._id] ? { ...r, permissions: matrixState[r._id] } : r
        )
      );
      addToast('Cập nhật ma trận phân quyền thành công! Quyền mới có hiệu lực ngay.', 'success');
      void loadRolesAndPermissions(true);
    } catch (err: any) {
      addToast(err?.message || 'Lỗi khi cập nhật ma trận quyền', 'error');
    } finally {
      setIsSavingMatrix(false);
    }
  };

  // Create new Role
  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim() || !newRoleDisplayName.trim()) {
      addToast('Vui lòng điền đầy đủ Mã vai trò và Tên hiển thị', 'error');
      return;
    }

    try {
      const res: any = await rolesApi.createRole({
        name: newRoleName.trim().toLowerCase(),
        displayName: newRoleDisplayName.trim(),
        description: newRoleDescription.trim(),
        permissions: [],
      });
      const createdRole: RoleItem = res?.data || {
        _id: `role_${Date.now()}`,
        name: newRoleName.trim().toLowerCase(),
        displayName: newRoleDisplayName.trim(),
        description: newRoleDescription.trim(),
        permissions: [],
      };
      // Thêm vai trò mới trực tiếp vào state cục bộ
      setRoles((prev) => [...prev, createdRole]);
      setMatrixState((prev) => ({ ...prev, [createdRole._id]: [] }));
      addToast(`Đã tạo vai trò mới '${newRoleDisplayName}' thành công!`, 'success');
      setIsCreateRoleModalOpen(false);
      setNewRoleName('');
      setNewRoleDisplayName('');
      setNewRoleDescription('');
      void loadRolesAndPermissions(true);
    } catch (err: any) {
      addToast(err?.message || 'Lỗi khi tạo vai trò mới', 'error');
    }
  };

  // Open User Edit Modal
  const handleOpenUserEdit = (userItem: RbacUserItem) => {
    setSelectedUserForEdit(userItem);
    setEditUserRole(userItem.role || 'customer');
    setEditUserAllow([...(userItem.permissionOverrides?.allow || [])]);
    setEditUserDeny([...(userItem.permissionOverrides?.deny || [])]);
  };

  // Save User Role & Overrides
  const handleSaveUserOverrides = async () => {
    if (!selectedUserForEdit) return;

    try {
      setIsSavingUserOverrides(true);
      await rolesApi.updateUserRoleAndOverrides(selectedUserForEdit._id, {
        role: editUserRole,
        allow: editUserAllow,
        deny: editUserDeny,
      });

      // Cập nhật thông tin quyền hạn của người dùng trực tiếp trong bảng
      setUsers((prev) =>
        prev.map((u) =>
          u._id === selectedUserForEdit._id
            ? {
                ...u,
                role: editUserRole,
                permissionOverrides: { allow: editUserAllow, deny: editUserDeny },
              }
            : u
        )
      );

      addToast(
        `Đã cập nhật vai trò và quyền riêng cho tài khoản ${selectedUserForEdit.email}! Phiên cũ đã được thu hồi.`,
        'success'
      );
      setSelectedUserForEdit(null);
      void loadUsers(true);
    } catch (err: any) {
      addToast(err?.message || 'Lỗi khi cập nhật quyền tài khoản', 'error');
    } finally {
      setIsSavingUserOverrides(false);
    }
  };

  // Toggle User Status (Lock/Unlock)
  const handleToggleUserStatus = async (userItem: RbacUserItem) => {
    if (currentUser?.role !== 'admin') {
      addToast('Chỉ Quản trị viên (Admin) mới có quyền khóa hoặc mở khóa tài khoản.', 'error');
      return;
    }
    const isCurrentlyActive = userItem.status === 'active';
    const nextStatus = isCurrentlyActive ? 'locked' : 'active';
    const actionLabel = isCurrentlyActive ? 'khóa' : 'mở khóa';

    if (
      !window.confirm(
        `Quý khách có chắc chắn muốn ${actionLabel} tài khoản ${userItem.email}? ${
          isCurrentlyActive ? 'Tài khoản sẽ bị đăng xuất ngay lập tức!' : ''
        }`
      )
    ) {
      return;
    }

    try {
      // Cập nhật lạc quan trạng thái người dùng tại dòng tương ứng
      setUsers((prev) =>
        prev.map((u) => (u._id === userItem._id ? { ...u, status: nextStatus as any } : u))
      );
      await rolesApi.updateUserStatus(userItem._id, nextStatus as any);
      addToast(`Đã ${actionLabel} tài khoản ${userItem.email} thành công!`, 'success');
      void loadUsers(true);
    } catch (err: any) {
      // Hoàn tác nếu lỗi
      setUsers((prev) =>
        prev.map((u) => (u._id === userItem._id ? { ...u, status: userItem.status } : u))
      );
      addToast(err?.message || `Lỗi khi ${actionLabel} tài khoản`, 'error');
    }
  };

  return (
    <AdminLayout
      title="Phân Quyền & Quản Lý Vai Trò"
      subtitle="Hệ thống kiểm soát truy cập theo vai trò (RBAC) & Cấp quyền riêng lẻ (Overrides)"
    >
      <div className="space-y-6">
        {/* Navigation Tabs Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setActiveTab('matrix')}
              className={`px-4 py-2.5 text-xs font-mono uppercase tracking-wider rounded-lg transition-all duration-200 flex items-center gap-2 cursor-pointer ${
                activeTab === 'matrix'
                  ? 'admin-tab-active'
                  : 'admin-tab-inactive'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5 shrink-0" />
              <span>Ma Trận Vai Trò × Quyền</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2.5 text-xs font-mono uppercase tracking-wider rounded-lg transition-all duration-200 flex items-center gap-2 cursor-pointer ${
                activeTab === 'users'
                  ? 'admin-tab-active'
                  : 'admin-tab-inactive'
              }`}
            >
              <Users className="w-3.5 h-3.5 shrink-0" />
              <span>Tài Khoản & Overrides</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('audit')}
              className={`px-4 py-2.5 text-xs font-mono uppercase tracking-wider rounded-lg transition-all duration-200 flex items-center gap-2 cursor-pointer ${
                activeTab === 'audit'
                  ? 'admin-tab-active'
                  : 'admin-tab-inactive'
              }`}
            >
              <History className="w-3.5 h-3.5 shrink-0" />
              <span>Nhật Ký Kiểm Toán</span>
            </button>
          </div>

          {activeTab === 'matrix' && (
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setIsCreateRoleModalOpen(true)}
                className="px-4 py-2 text-xs font-mono uppercase tracking-wider border border-[var(--border)] hover:border-[var(--accent)] bg-[var(--bg-card)] text-[var(--text)] hover:text-[var(--accent)] rounded-lg shadow-xs hover:shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm Vai Trò Mới</span>
              </button>

              <button
                type="button"
                onClick={handleSaveMatrix}
                disabled={isSavingMatrix}
                className="px-5 py-2 text-xs font-mono uppercase tracking-wider bg-[var(--accent)] border border-[var(--accent)] hover:brightness-105 text-[var(--accent-contrast)] font-bold rounded-lg transition-all shadow-md hover:shadow-lg flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {isSavingMatrix ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>Lưu Thay Đổi Ma Trận</span>
              </button>
            </div>
          )}
        </div>

        {/* TAB 1: ROLES X PERMISSIONS MATRIX */}
        {activeTab === 'matrix' && (
          <div className="space-y-4">
            <div className="bg-[var(--surface)] border border-[var(--border)] p-4 rounded-sm flex items-start gap-3 text-xs text-[var(--text-muted)]">
              <Info className="w-4 h-4 text-[var(--accent)] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[var(--text)] font-semibold block uppercase font-mono tracking-wider text-[11px]">
                  CƠ CHẾ PHÂN QUYỀN RBAC MẠNG LƯỚI
                </strong>
                <span>
                  Admin mặc định có toàn bộ đặc quyền trong hệ thống. Quý khách có thể tích chọn để cấp
                  hoặc thu hồi quyền cho từng vai trò nghiệp vụ (Manager, Staff...). Thay đổi có hiệu lực
                  ngay lập tức khi bấm <em>Lưu Thay Đổi Ma Trận</em>.
                </span>
              </div>
            </div>

            {loading ? (
              <div className="w-full h-64 flex flex-col items-center justify-center bg-[var(--surface)] border border-[var(--border)] rounded-sm">
                <div className="w-8 h-8 rounded-full border border-[var(--accent)]/40 border-t-[var(--accent)] animate-spin mb-3" />
                <span className="text-[11px] font-mono text-[var(--accent)] uppercase tracking-widest">
                  Đang nạp ma trận phân quyền...
                </span>
              </div>
            ) : (
              <div className="border border-[var(--border)] bg-[var(--surface)] rounded-sm overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[var(--bg-alt)] border-b border-[var(--border)] text-[var(--text)] font-mono text-[11px] uppercase tracking-wider">
                        <th className="p-3.5 min-w-[260px] font-semibold sticky left-0 bg-[var(--bg-alt)] z-10 border-r border-[var(--border)]">
                          Danh Mục & Quyền Hạn
                        </th>
                        {roles.map((r) => (
                          <th
                            key={r._id}
                            className="p-3.5 text-center min-w-[130px] font-semibold border-r border-[var(--border)] last:border-r-0"
                          >
                            <span className="block text-[var(--text)] font-bold">{r.displayName}</span>
                            <span className="block text-[10px] text-[var(--accent)] font-mono lowercase">
                              @{r.name}
                            </span>
                            {r.isSystem && (
                              <span className="inline-block mt-1 px-1.5 py-0.2 text-[9px] rounded-xs bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 font-mono">
                                Hệ Thống
                              </span>
                            )}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {permissionGroups.map((group) => (
                        <React.Fragment key={group.group}>
                          {/* Group Section Header */}
                          <tr className="bg-[var(--bg-alt)]/60 font-semibold text-[var(--text)] text-[11px] font-mono uppercase tracking-wider">
                            <td
                              colSpan={roles.length + 1}
                              className="px-3.5 py-2 text-[var(--accent)] border-y border-[var(--border)]"
                            >
                              § {group.group}
                            </td>
                          </tr>

                          {/* Individual Permissions in Group */}
                          {group.items.map((perm) => (
                            <tr
                              key={perm.key}
                              className="hover:bg-[var(--bg-alt)]/40 transition-colors"
                            >
                              <td className="p-3.5 sticky left-0 bg-[var(--surface)] z-10 border-r border-[var(--border)]">
                                <span className="font-semibold text-[var(--text)] block">
                                  {perm.label}
                                </span>
                                <span className="text-[10px] font-mono text-[var(--accent)] block">
                                  {perm.key}
                                </span>
                                {perm.description && (
                                  <span className="text-[11px] text-[var(--text-muted)] block mt-0.5 leading-snug">
                                    {perm.description}
                                  </span>
                                )}
                              </td>

                              {roles.map((r) => {
                                const isPermChecked =
                                  r.name === 'admin'
                                    ? true
                                    : (matrixState[r._id] || []).includes(perm.key);

                                const isDisabled = r.name === 'admin';

                                return (
                                  <td
                                    key={`${r._id}-${perm.key}`}
                                    className="p-3 text-center border-r border-[var(--border)] last:border-r-0"
                                  >
                                    <div className="flex items-center justify-center">
                                      <StatusToggle
                                        checked={isPermChecked}
                                        disabled={isDisabled}
                                        onChange={() =>
                                          handleToggleMatrixPermission(r._id, r.name, perm.key)
                                        }
                                        ariaLabel={`Phân quyền ${perm.label} cho vai trò ${r.displayName || r.name}`}
                                      />
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: RBAC USER OVERRIDES & STATUS */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            {/* Filters bar */}
            <div className="bg-[var(--surface)] border border-[var(--border)] p-4 rounded-sm flex flex-col md:flex-row gap-3 items-center justify-between">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-[var(--text-muted)]" />
                <input
                  type="text"
                  placeholder="Tìm theo tên, email hoặc số điện thoại..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && void loadUsers()}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-[var(--bg-alt)] border border-[var(--border)] rounded-sm text-[var(--text)] focus:border-[var(--accent)] outline-none"
                />
              </div>

              <div className="flex items-center gap-2.5 w-full md:w-auto">
                <select
                  value={userRoleFilter}
                  onChange={(e) => {
                    setUserRoleFilter(e.target.value);
                    setUsersPage(1);
                  }}
                  className="px-3 py-2 text-xs bg-[var(--bg-alt)] border border-[var(--border)] rounded-sm text-[var(--text)] outline-none"
                >
                  <option value="all">Tất Cả Vai Trò</option>
                  <option value="admin">Quản Trị Viên (Admin)</option>
                  <option value="manager">Quản Lý Vận Hành</option>
                  <option value="staff">Nhân Viên CSKH</option>
                  <option value="customer">Thành Viên (Customer)</option>
                </select>

                <select
                  value={userStatusFilter}
                  onChange={(e) => {
                    setUserStatusFilter(e.target.value);
                    setUsersPage(1);
                  }}
                  className="px-3 py-2 text-xs bg-[var(--bg-alt)] border border-[var(--border)] rounded-sm text-[var(--text)] outline-none"
                >
                  <option value="all">Tất Cả Trạng Thái</option>
                  <option value="active">Đang Hoạt Động</option>
                  <option value="locked">Đã Bị Khóa</option>
                </select>

                <button
                  type="button"
                  onClick={() => loadUsers()}
                  className="p-2 border border-[var(--border)] hover:border-[var(--accent)] rounded-lg text-[var(--text-muted)] hover:text-[var(--accent)] shadow-xs hover:shadow-sm transition-all cursor-pointer"
                  title="Tải lại danh sách"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Users Table */}
            {isUsersLoading ? (
              <div className="w-full h-48 flex flex-col items-center justify-center bg-[var(--surface)] border border-[var(--border)] rounded-sm">
                <div className="w-6 h-6 rounded-full border border-[var(--accent)]/40 border-t-[var(--accent)] animate-spin mb-2" />
                <span className="text-[10px] font-mono text-[var(--accent)] uppercase tracking-widest">
                  Đang tải danh sách người dùng...
                </span>
              </div>
            ) : users.length === 0 ? (
              <div className="bg-[var(--surface)] border border-[var(--border)] p-12 text-center rounded-sm">
                <Users className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-2 opacity-50" />
                <p className="text-xs text-[var(--text-muted)]">Không tìm thấy tài khoản người dùng phù hợp.</p>
              </div>
            ) : (
              <div className="border border-[var(--border)] bg-[var(--surface)] rounded-sm overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-[var(--bg-alt)] border-b border-[var(--border)] text-[var(--text)] font-mono text-[11px] uppercase tracking-wider">
                        <th className="p-3.5 w-12 text-center">STT</th>
                        <th className="p-3.5">Họ Tên & Email</th>
                        <th className="p-3.5">Vai Trò Hiện Tại</th>
                        <th className="p-3.5">Quyền Riêng (Overrides)</th>
                        <th className="p-3.5">Trạng Thái</th>
                        <th className="p-3.5 text-right">Thao Tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {users.map((u, idx) => {
                        const allowCount = u.permissionOverrides?.allow?.length || 0;
                        const denyCount = u.permissionOverrides?.deny?.length || 0;
                        const isLocked = u.status === 'locked' || u.status === 'blocked';
                        const isSelf = String(u._id) === String(currentUser?.id);
                        const isTargetAdmin = u.role === 'admin';
                        const canToggleUser = currentUser?.role === 'admin' && !isSelf && (!isTargetAdmin || isLocked);

                        return (
                          <tr key={u._id} className="hover:bg-[var(--bg-alt)]/30 transition-colors">
                            <td className="p-3.5 text-center font-mono text-xs text-[var(--text-muted)]">
                              {(usersPage - 1) * 20 + idx + 1}
                            </td>
                            <td className="p-3.5">
                              <span className="font-semibold text-[var(--text)] block">{u.fullName}</span>
                              <span className="text-[11px] text-[var(--text-muted)] block">{u.email}</span>
                              {u.phone && (
                                <span className="text-[10px] font-mono text-[var(--text-muted)] block">
                                  {u.phone}
                                </span>
                              )}
                            </td>

                            <td className="p-3.5">
                              <span
                                className={`inline-block px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider rounded-xs font-semibold ${
                                  u.role === 'admin'
                                    ? 'bg-[var(--accent)] text-[var(--accent-contrast)]'
                                    : u.role === 'manager'
                                    ? 'bg-blue-100 text-blue-900 border border-blue-200'
                                    : u.role === 'staff'
                                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                                    : 'bg-[var(--bg-alt)] text-[var(--text-muted)] border border-[var(--border)]'
                                }`}
                              >
                                {u.role || 'customer'}
                              </span>
                            </td>

                            <td className="p-3.5">
                              {allowCount === 0 && denyCount === 0 ? (
                                <span className="text-[11px] text-[var(--text-muted)] font-mono italic">
                                  (Theo vai trò gốc)
                                </span>
                              ) : (
                                <div className="flex items-center gap-1.5 font-mono text-[10px]">
                                  {allowCount > 0 && (
                                    <span className="px-1.5 py-0.5 rounded-xs bg-emerald-100 text-emerald-800 border border-emerald-200">
                                      +{allowCount} cấp thêm
                                    </span>
                                  )}
                                  {denyCount > 0 && (
                                    <span className="px-1.5 py-0.5 rounded-xs bg-red-100 text-red-800 border border-red-200">
                                      -{denyCount} tước quyền
                                    </span>
                                  )}
                                </div>
                              )}
                            </td>

                            <td className="p-3.5 whitespace-nowrap">
                              <StatusToggle
                                checked={!isLocked}
                                disabled={!canToggleUser}
                                onChange={() => handleToggleUserStatus(u)}
                                activeLabel="Hoạt Động"
                                inactiveLabel="Đã Khóa"
                                ariaLabel="Bật / tắt trạng thái tài khoản"
                              />
                            </td>

                            <td className="p-3.5 text-right">
                              <AdminActionGroup>
                                <button
                                  type="button"
                                  onClick={() => handleOpenUserEdit(u)}
                                  className="px-2.5 py-1 text-xs border border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--accent)] rounded-sm shadow-xs hover:shadow-sm transition-all cursor-pointer font-mono"
                                >
                                  Phân Quyền
                                </button>
                                {!isLocked ? (
                                  <LockActionButton
                                    title={
                                      currentUser?.role !== 'admin'
                                        ? 'Chỉ Quản trị viên (Admin) mới có quyền khóa tài khoản nhân viên'
                                        : isTargetAdmin
                                        ? 'Không thể khóa tài khoản Quản trị viên cấp cao'
                                        : isSelf
                                        ? 'Bạn không thể tự khóa tài khoản của chính mình'
                                        : 'Khóa tài khoản này'
                                    }
                                    ariaLabel="Khóa tài khoản này"
                                    disabled={!canToggleUser}
                                    onClick={() => handleToggleUserStatus(u)}
                                  />
                                ) : (
                                  <UnlockActionButton
                                    title={
                                      currentUser?.role !== 'admin'
                                        ? 'Chỉ Quản trị viên (Admin) mới có quyền mở khóa tài khoản nhân viên'
                                        : 'Mở khóa tài khoản này'
                                    }
                                    ariaLabel="Mở khóa tài khoản này"
                                    disabled={currentUser?.role !== 'admin'}
                                    onClick={() => handleToggleUserStatus(u)}
                                  />
                                )}
                              </AdminActionGroup>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <TablePagination
                  currentPage={usersPage}
                  totalItems={usersTotal}
                  pageSize={20}
                  onPageChange={setUsersPage}
                  itemName="người dùng"
                />
              </div>
            )}
          </div>
        )}

        {/* TAB 3: AUDIT LOGS */}
        {activeTab === 'audit' && (
          <div className="space-y-4">
            <div className="bg-[var(--surface)] border border-[var(--border)] p-4 rounded-sm flex items-start gap-3 text-xs text-[var(--text-muted)]">
              <History className="w-4 h-4 text-[var(--accent)] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[var(--text)] font-semibold block uppercase font-mono tracking-wider text-[11px]">
                  NHẬT KÝ KIỂM TOÁN AN TOÀN HỆ THỐNG
                </strong>
                <span>
                  Ghi lại toàn bộ thao tác gán vai trò, cấp quyền riêng biệt, chỉnh sửa ma trận quyền và
                  khóa/mở khóa tài khoản cùng địa chỉ IP và dấu thời gian chính xác.
                </span>
              </div>
            </div>

            {isAuditLoading ? (
              <div className="w-full h-48 flex flex-col items-center justify-center bg-[var(--surface)] border border-[var(--border)] rounded-sm">
                <div className="w-6 h-6 rounded-full border border-[var(--accent)]/40 border-t-[var(--accent)] animate-spin mb-2" />
                <span className="text-[10px] font-mono text-[var(--accent)] uppercase tracking-widest">
                  Đang tải nhật ký kiểm toán...
                </span>
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="bg-[var(--surface)] border border-[var(--border)] p-12 text-center rounded-sm">
                <History className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-2 opacity-50" />
                <p className="text-xs text-[var(--text-muted)]">Chưa ghi nhận sự kiện kiểm toán nào.</p>
              </div>
            ) : (
              <div className="border border-[var(--border)] bg-[var(--surface)] rounded-sm overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-sans">
                    <thead>
                      <tr className="bg-[var(--bg-alt)] border-b border-[var(--border)] text-[var(--text)] font-mono text-[11px] uppercase tracking-wider">
                        <th className="p-3.5 w-12 text-center">STT</th>
                        <th className="p-3.5">Thời Gian</th>
                        <th className="p-3.5">Người Thực Hiện</th>
                        <th className="p-3.5">Hành Động</th>
                        <th className="p-3.5">Chi Tiết Thay Đổi</th>
                        <th className="p-3.5 text-right">Địa Chỉ IP</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {auditLogs.map((log, idx) => (
                        <tr key={log._id} className="hover:bg-[var(--bg-alt)]/20 font-sans">
                          <td className="p-3.5 text-center font-mono text-xs text-[var(--text-muted)]">
                            {idx + 1}
                          </td>
                          <td className="p-3.5 font-mono text-[11px] text-[var(--text-muted)] whitespace-nowrap">
                            {new Date(log.createdAt).toLocaleString('vi-VN')}
                          </td>
                          <td className="p-3.5">
                            <span className="font-semibold text-[var(--text)] block">{log.actorEmail}</span>
                            <span className="text-[10px] font-mono text-[var(--accent)] uppercase">
                              [{log.actorRole}]
                            </span>
                          </td>
                          <td className="p-3.5">
                            <StatusBadge variant="neutral" uppercase={true}>
                              {log.action}
                            </StatusBadge>
                          </td>
                          <td className="p-3.5 text-xs text-[var(--text-muted)] max-w-xs truncate">
                            <code className="text-[10px] font-mono text-[var(--text)]">
                              {JSON.stringify(log.details || {})}
                            </code>
                          </td>
                          <td className="p-3.5 text-right font-mono text-[10px] text-[var(--text-muted)]">
                            {log.ipAddress}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* MODAL 1: CREATE NEW ROLE */}
        {isCreateRoleModalOpen && (
          <ModalPortal>
            <div
              className="fixed inset-0 bg-[rgba(26,26,23,0.55)] backdrop-blur-sm flex items-center justify-center p-4 pointer-events-auto"
              style={{ zIndex: createRoleOverlayZ }}
              onClick={(e) => {
                if (e.target === e.currentTarget) setIsCreateRoleModalOpen(false);
              }}
              role="dialog"
              aria-modal="true"
              aria-label="Tạo Vai Trò Mới"
            >
              <div
                className="bg-[var(--surface)] border border-[var(--border)] w-full max-w-md p-6 rounded-sm shadow-2xl text-[var(--text)] space-y-5 text-xs max-h-[calc(100dvh-32px)] overflow-y-auto"
                style={{ zIndex: createRoleContentZ }}
              >
                <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-[var(--accent)]" />
                    <h3 className="font-display text-base text-[var(--text)] font-semibold uppercase tracking-wider">
                      Tạo Vai Trò Mới
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCreateRoleModalOpen(false)}
                    className="text-[var(--text-muted)] hover:text-[var(--text)]"
                    aria-label="Đóng"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleCreateRole} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-[var(--text)] mb-1">
                    Mã Vai Trò (System Key) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="vd: supervisor, auditor..."
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                    className="w-full px-3 py-2 bg-[var(--bg-alt)] border border-[var(--border)] rounded-sm text-xs font-mono text-[var(--text)] focus:border-[var(--accent)] outline-none"
                  />
                  <span className="text-[10px] text-[var(--text-muted)] block mt-0.5">
                    Chỉ dùng chữ cái thường và dấu gạch dưới, không khoảng trắng.
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-[var(--text)] mb-1">
                    Tên Hiển Thị (Display Name) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="vd: Giám Sát May Đo, Kiểm Toán Viên..."
                    value={newRoleDisplayName}
                    onChange={(e) => setNewRoleDisplayName(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--bg-alt)] border border-[var(--border)] rounded-sm text-xs text-[var(--text)] focus:border-[var(--accent)] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-[var(--text)] mb-1">
                    Mô Tả Nhiệm Vụ
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Ghi chú phạm vi trách nhiệm và quyền hạn của vai trò này..."
                    value={newRoleDescription}
                    onChange={(e) => setNewRoleDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--bg-alt)] border border-[var(--border)] rounded-sm text-xs text-[var(--text)] focus:border-[var(--accent)] outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
                  <button
                    type="button"
                    onClick={() => setIsCreateRoleModalOpen(false)}
                    className="px-4 py-2 border border-[var(--border)] hover:border-[var(--accent)] bg-[var(--bg-card)] text-[var(--text)] hover:text-[var(--accent)] rounded-lg text-xs font-mono uppercase tracking-wider transition-all shadow-xs hover:shadow-sm cursor-pointer"
                  >
                    Hủy Bỏ
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[var(--accent)] text-[var(--accent-contrast)] border border-[var(--accent)] font-bold rounded-lg text-xs font-mono uppercase tracking-wider hover:brightness-105 shadow-md hover:shadow-lg transition-all cursor-pointer"
                  >
                    Tạo Vai Trò
                  </button>
                </div>
              </form>
            </div>
          </div>
          </ModalPortal>
        )}

        {/* MODAL 2: EDIT USER ROLE & OVERRIDES */}
        {selectedUserForEdit && (
          <ModalPortal>
            <div
              className="fixed inset-0 bg-[rgba(26,26,23,0.55)] backdrop-blur-sm flex items-center justify-center p-4 pointer-events-auto"
              style={{ zIndex: userEditOverlayZ }}
              onClick={(e) => {
                if (e.target === e.currentTarget) setSelectedUserForEdit(null);
              }}
              role="dialog"
              aria-modal="true"
              aria-label="Phân Quyền & Overrides Tài Khoản"
            >
              <div
                className="bg-[var(--surface)] border border-[var(--border)] w-full max-w-2xl max-h-[calc(100dvh-32px)] flex flex-col p-6 rounded-sm shadow-2xl text-[var(--text)] space-y-4 text-xs"
                style={{ zIndex: userEditContentZ }}
              >
                <div className="flex items-center justify-between pb-3 border-b border-[var(--border)] shrink-0">
                  <div>
                    <h3 className="font-display text-base text-[var(--text)] font-semibold uppercase tracking-wider">
                      Phân Quyền & Overrides Tài Khoản
                    </h3>
                    <span className="text-[11px] text-[var(--text-muted)]">
                      Tài khoản: <strong>{selectedUserForEdit.fullName}</strong> ({selectedUserForEdit.email})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedUserForEdit(null)}
                    className="text-[var(--text-muted)] hover:text-[var(--text)]"
                    aria-label="Đóng"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                {/* Role Selection */}
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-[var(--text)] mb-1 font-semibold">
                    1. Gán Vai Trò (Role)
                  </label>
                  <select
                    value={editUserRole}
                    onChange={(e) => setEditUserRole(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--bg-alt)] border border-[var(--border)] rounded-sm text-xs font-mono text-[var(--text)] focus:border-[var(--accent)] outline-none"
                  >
                    {roles.map((r) => (
                      <option key={r.name} value={r.name}>
                        {r.displayName} (@{r.name})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Overrides Info */}
                <div className="p-3 bg-[var(--bg-alt)] border border-[var(--border)] rounded-sm text-[11px] text-[var(--text-muted)] space-y-1">
                  <span className="font-semibold text-[var(--text)] block uppercase tracking-wider text-[10px]">
                    CƠ CHẾ OVERRIDES (CẤP THÊM & TƯỚC QUYỀN RIÊNG)
                  </span>
                  <p>
                    Quyền hiệu lực = (Quyền vai trò + <strong>Allow</strong>) - <strong>Deny</strong>.
                    Cho phép quý khách mở rộng quyền hoặc giới hạn một số thao tác nhạy cảm đối với riêng tài
                    khoản này mà không làm ảnh hưởng các thành viên khác trong cùng vai trò.
                  </p>
                </div>

                {/* List of Permissions to Allow / Deny */}
                <div className="space-y-3">
                  <span className="block text-[11px] font-mono uppercase tracking-wider text-[var(--text)] font-semibold">
                    2. Cấu Hình Quyền Riêng Lẻ (Allow / Deny)
                  </span>

                  <div className="space-y-3 border border-[var(--border)] p-3 rounded-sm bg-[var(--surface)] max-h-64 overflow-y-auto">
                    {permissionGroups.map((group) => (
                      <div key={group.group} className="space-y-1.5">
                        <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--accent)] font-semibold block border-b border-[var(--border)] pb-1">
                          {group.group}
                        </span>

                        <div className="space-y-1 pt-1">
                          {group.items.map((perm) => {
                            const isAllowed = editUserAllow.includes(perm.key);
                            const isDenied = editUserDeny.includes(perm.key);

                            return (
                              <div
                                key={perm.key}
                                className="flex items-center justify-between py-1 px-2 rounded-xs hover:bg-[var(--bg-alt)] text-[11px]"
                              >
                                <div>
                                  <span className="text-[var(--text)] font-medium block">{perm.label}</span>
                                  <span className="text-[9px] font-mono text-[var(--text-muted)] block">
                                    {perm.key}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2">
                                  {/* Allow button */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (isAllowed) {
                                        setEditUserAllow((prev) => prev.filter((p) => p !== perm.key));
                                      } else {
                                        setEditUserAllow((prev) => [...prev, perm.key]);
                                        setEditUserDeny((prev) => prev.filter((p) => p !== perm.key));
                                      }
                                    }}
                                    className={`px-2 py-0.5 rounded-xs font-mono text-[10px] uppercase font-semibold transition-colors border ${
                                      isAllowed
                                        ? 'bg-emerald-600 text-white border-emerald-600'
                                        : 'bg-[var(--bg-alt)] text-[var(--text-muted)] border-[var(--border)] hover:border-emerald-500'
                                    }`}
                                  >
                                    + Cấp Thêm
                                  </button>

                                  {/* Deny button */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (isDenied) {
                                        setEditUserDeny((prev) => prev.filter((p) => p !== perm.key));
                                      } else {
                                        setEditUserDeny((prev) => [...prev, perm.key]);
                                        setEditUserAllow((prev) => prev.filter((p) => p !== perm.key));
                                      }
                                    }}
                                    className={`px-2 py-0.5 rounded-xs font-mono text-[10px] uppercase font-semibold transition-colors border ${
                                      isDenied
                                        ? 'bg-red-600 text-white border-red-600'
                                        : 'bg-[var(--bg-alt)] text-[var(--text-muted)] border-[var(--border)] hover:border-red-500'
                                    }`}
                                  >
                                    - Tước Quyền
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border)] shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedUserForEdit(null)}
                  className="px-4 py-2 border border-[var(--border)] hover:border-[var(--accent)] bg-[var(--bg-card)] text-[var(--text)] hover:text-[var(--accent)] rounded-lg text-xs font-mono uppercase tracking-wider transition-all shadow-xs hover:shadow-sm cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={handleSaveUserOverrides}
                  disabled={isSavingUserOverrides}
                  className="px-5 py-2 bg-[var(--accent)] text-[var(--accent-contrast)] border border-[var(--accent)] font-bold rounded-lg text-xs font-mono uppercase tracking-wider hover:brightness-105 shadow-md hover:shadow-lg flex items-center gap-1.5 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {isSavingUserOverrides ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  <span>Áp Dụng Phân Quyền</span>
                </button>
              </div>
            </div>
          </div>
          </ModalPortal>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminRolesPage;
