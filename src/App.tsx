import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { AppLayout } from './components/layout/AppLayout';
import { HomePage } from './pages/HomePage';
import { IndicatorConfigPage } from './pages/indicator/IndicatorConfigPage';
import { WarningRulePage } from './pages/warning/WarningRulePage';
import { AchievementEntryPage } from './pages/achievement/AchievementEntryPage';
import { AchievementApprovalPage } from './pages/achievement/AchievementApprovalPage';
import { IndicatorMonitoringPage } from './pages/monitoring/IndicatorMonitoringPage';
import { ArchiveCatalogPage } from './pages/archive/ArchiveCatalogPage';
import { MaterialUploadPage } from './pages/archive/MaterialUploadPage';
import { MaterialQueryPage } from './pages/archive/MaterialQueryPage';
import { ArchiveMonitoringPage } from './pages/archive/ArchiveMonitoringPage';

function App() {
  return (
    <ConfigProvider locale={zhCN} theme={{ algorithm: theme.defaultAlgorithm }}>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<HomePage />} />
            <Route path="indicator" element={<IndicatorConfigPage />} />
            <Route path="warning-rules" element={<WarningRulePage />} />
            <Route path="achievement-entry" element={<AchievementEntryPage />} />
            <Route path="achievement-approval" element={<AchievementApprovalPage />} />
            <Route path="monitoring" element={<IndicatorMonitoringPage />} />
            <Route path="archive/catalog" element={<ArchiveCatalogPage />} />
            <Route path="archive/upload" element={<MaterialUploadPage />} />
            <Route path="archive/query" element={<MaterialQueryPage />} />
            <Route path="archive/monitoring" element={<ArchiveMonitoringPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;
