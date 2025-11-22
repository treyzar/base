import { BrowserRouter, Routes, Route } from 'react-router-dom';
import React from 'react';
import { Layout } from '@/components/Layout';

import { HomePage } from '@pages';
import { Assistant } from '@/components/assistant/Assistants';


export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <Layout>
              <HomePage />
            </Layout>
          }
        />
        <Route
          path="/assistant"
          element={
            <Layout>
              <Assistant />
            </Layout>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};