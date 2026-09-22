import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Layout } from './components/common/Layout';
import { ProtectedRoute } from './components/common/ProtectedRoute';

import { LoginPage } from './pages/auth/LoginPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { ProfilePage } from './pages/profile/ProfilePage';
import { UsersPage } from './pages/users/UsersPage';
import { OrganizationPage } from './pages/organization/OrganizationPage';
import { ProductsPage } from './pages/products/ProductsPage';
import { PipelineConfigPage } from './pages/pipeline/PipelineConfigPage';
import { GeneralSettingsPage } from './pages/settings/GeneralSettingsPage';
import { AuditLogPage } from './pages/audit/AuditLogPage';
import { CustomerListPage } from './pages/CustomerListPage';
import { CustomerDetailPage } from './pages/CustomerDetailPage';
import { LeadListPage } from './pages/LeadListPage';
import { LeadDetailPage } from './pages/LeadDetailPage';
import { LeadConfigPage } from './pages/LeadConfigPage';
import { WebFormEmbedPage } from './pages/WebFormEmbedPage';
import { Error403Page } from './pages/errors/Error403Page';
import { Error404Page } from './pages/errors/Error404Page';
import { VaiTroEnum } from './types';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Protected Application Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="profile" element={<ProfilePage />} />

            {/* SPRINT 2: KHÁCH HÀNG & CUSTOMER 360 */}
            <Route path="customers" element={<CustomerListPage />} />
            <Route path="customers/:id" element={<CustomerDetailPage />} />

            {/* SPRINT 2: LEAD & PHÂN BỔ */}
            <Route path="leads" element={<LeadListPage />} />
            <Route path="leads/:id" element={<LeadDetailPage />} />
            <Route
              path="leads-config"
              element={
                <ProtectedRoute roles={[VaiTroEnum.ADMIN, VaiTroEnum.DIRECTOR]}>
                  <LeadConfigPage />
                </ProtectedRoute>
              }
            />
            <Route path="leads-webform" element={<WebFormEmbedPage />} />

            {/* Quản trị Người dùng (Admin, Director, Team Lead) */}
            <Route
              path="users"
              element={
                <ProtectedRoute roles={[VaiTroEnum.ADMIN, VaiTroEnum.DIRECTOR, VaiTroEnum.TEAM_LEAD]}>
                  <UsersPage />
                </ProtectedRoute>
              }
            />

            {/* Cơ cấu Tổ chức (Admin, Director, Team Lead) */}
            <Route
              path="organization"
              element={
                <ProtectedRoute roles={[VaiTroEnum.ADMIN, VaiTroEnum.DIRECTOR, VaiTroEnum.TEAM_LEAD]}>
                  <OrganizationPage />
                </ProtectedRoute>
              }
            />

            {/* Danh mục Sản phẩm & Bảng giá (Mọi người dùng xem, giá vốn phân quyền tại BE) */}
            <Route path="products" element={<ProductsPage />} />

            {/* Cấu hình Pipeline (Admin, Director) */}
            <Route
              path="pipeline"
              element={
                <ProtectedRoute roles={[VaiTroEnum.ADMIN, VaiTroEnum.DIRECTOR]}>
                  <PipelineConfigPage />
                </ProtectedRoute>
              }
            />

            {/* Danh mục Dùng chung (Admin, Director) */}
            <Route
              path="settings/catalogs"
              element={
                <ProtectedRoute roles={[VaiTroEnum.ADMIN, VaiTroEnum.DIRECTOR]}>
                  <GeneralSettingsPage />
                </ProtectedRoute>
              }
            />

            {/* Nhật ký Thay đổi Audit Log (Admin, Director) */}
            <Route
              path="audit-logs"
              element={
                <ProtectedRoute roles={[VaiTroEnum.ADMIN, VaiTroEnum.DIRECTOR]}>
                  <AuditLogPage />
                </ProtectedRoute>
              }
            />

            {/* Error 403 route */}
            <Route path="403" element={<Error403Page />} />
          </Route>

          {/* 404 Catch-all */}
          <Route path="*" element={<Error404Page />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};
