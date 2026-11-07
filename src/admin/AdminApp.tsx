import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthGate } from "@/admin/auth/AuthGate";
import { AuthProvider } from "@/admin/auth/AuthProvider";
import { DraftProvider } from "@/admin/features/content/DraftProvider";
import { AdminLayout } from "@/admin/layout/AdminLayout";
import { AboutPage } from "@/admin/pages/AboutPage";
import { CareerPage } from "@/admin/pages/CareerPage";
import { OverviewPage } from "@/admin/pages/OverviewPage";
import { PreviewPage } from "@/admin/pages/PreviewPage";
import { ProjectsPage } from "@/admin/pages/ProjectsPage";
import { ResumePage } from "@/admin/pages/ResumePage";

const AdminApp = () => (
  <BrowserRouter>
    <AuthProvider>
      <AuthGate>
        <DraftProvider>
          <Routes>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<OverviewPage />} />
              <Route path="about" element={<AboutPage />} />
              <Route path="career" element={<CareerPage />} />
              <Route path="projects" element={<ProjectsPage />} />
              <Route path="resume" element={<ResumePage />} />
              <Route path="preview" element={<PreviewPage />} />
            </Route>
          </Routes>
        </DraftProvider>
      </AuthGate>
    </AuthProvider>
  </BrowserRouter>
);

export default AdminApp;
