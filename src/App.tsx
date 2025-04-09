import { Suspense } from "react";
import React from "react";
import { Routes, Route, Outlet, Navigate } from "react-router-dom";
import "./App.less";
import RequireAuth from "./wrappers/RequireAuth";
import ApplicationBaseLayout from "@/layout/applicationBaseLayout";
import ASREdit from "./pages/ASREdit";
import { RecordStateProvider } from "@/state/record/recordContext";

// 使用懒加载
// const Login = lazy(() => import('@/pages/Login'));
// const ASRList = lazy(() => import('@/pages/ASRList'));
// const ASRDetail = lazy(() => import('@/pages/ASRDetail'));
// const MedicalRecordList = lazy(() => import('@/pages/MedicalRecordList'));
// const MedicalRecordDetail = lazy(() => import('@/pages/MedicalRecordDetail'));
// const CollectInfoList = lazy(() => import('@/pages/CollectInfoList'));
// const AudioList = lazy(() => import('@/pages/AudioList'));
// const RecordBoard = lazy(() => import('@/pages/RecordBoard'));
// const RecordDetail = lazy(() => import('@/pages/RecordDetail'));

import Login from "@/pages/Login";
// import Test from "@/pages/Test";
import ASRList from "@/pages/ASRList";
import ASRDetail from "@/pages/ASRDetail";
import MedicalRecordList from "@/pages/MedicalRecordList";
import MedicalRecordDetail from "@/pages/MedicalRecordDetail";
import CollectInfoList from "@/pages/CollectInfoList";
import AudioList from "@/pages/AudioList";
import RecordBoard from "@/pages/RecordBoard";
import RecordDetail from "@/pages/RecordDetail";

function Application() {
  return (
    <Suspense fallback={<div>正在加载...</div>}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/login/" replace />} />
          {/* <Route path="/test/" element={<Test />} /> */}
          <Route
            path="/login/"
            element={
              <RequireAuth componentName="Login">
                <Login />
              </RequireAuth>
            }
          />
          <Route path="/application" element={<ApplicationBaseLayout />}>
            <Route index element={<Navigate to="audioList/" replace />} />
            <Route
              path="audioList/"
              element={
                <RequireAuth componentName="AudioList">
                  <RecordStateProvider>
                    <AudioList />
                  </RecordStateProvider>
                </RequireAuth>
              }
            />
            <Route
              path="recordBoard/"
              element={
                <RequireAuth componentName="RecordBoard">
                  <RecordStateProvider>
                    <RecordBoard />
                  </RecordStateProvider>
                </RequireAuth>
              }
            />
            <Route
              path="recordDetail/"
              element={
                <RequireAuth componentName="RecordDetail">
                  <RecordStateProvider>
                    <RecordDetail />
                  </RecordStateProvider>
                </RequireAuth>
              }
            />
            <Route
              path="asrList/"
              element={
                <RequireAuth componentName="ASRList">
                  <ASRList />
                </RequireAuth>
              }
            />
            <Route
              path="asrEdit/"
              element={
                <RequireAuth componentName="ASREdit">
                  <ASREdit />
                </RequireAuth>
              }
            />
            <Route
              path="asrDetail/"
              element={
                <RequireAuth componentName="ASRDetail">
                  <ASRDetail />
                </RequireAuth>
              }
            />
            <Route
              path="collectInfoList/"
              element={
                <RequireAuth componentName="CollectInfoList">
                  <CollectInfoList />
                </RequireAuth>
              }
            />
            <Route
              path="medicalRecordList/"
              element={
                <RequireAuth componentName="MedicalRecordList">
                  <MedicalRecordList />
                </RequireAuth>
              }
            />
            <Route
              path="medicalRecordDetail/"
              element={
                <RequireAuth componentName="MedicalRecordDetail">
                  <MedicalRecordDetail />
                </RequireAuth>
              }
            />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
}

function Layout() {
  return <Outlet />;
}

export default Application;
