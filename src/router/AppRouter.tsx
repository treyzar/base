// src/app/AppRouter.tsx (или где он у тебя лежит)
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { AssistantPage, NotFoundPage } from '@pages';
import LotteriesPage from '@/pages/lotteries/LotteriesPage';

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <Layout>
              <AssistantPage />
            </Layout>
          }
        />
        <Route
          path="/lotteries"
          element={
            <Layout>
              <LotteriesPage />
            </Layout>
          }
        />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
};
