import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { MeetingProvider } from "./context/MeetingContext";
import { NavigationProvider } from "./context/NavigationContext";
import { WhatsAppProvider } from "./context/WhatsAppContext";
import { AppLayout } from "./components/shell/AppLayout";
import { CompanyPage } from "./pages/CompanyPage";
import { RestaurantAiPage } from "./pages/RestaurantAiPage";

export function App() {
  return (
    <BrowserRouter>
      <NavigationProvider>
        <WhatsAppProvider>
          <MeetingProvider>
            <Routes>
              <Route element={<AppLayout />}>
                <Route path="/" element={<CompanyPage />} />
                <Route path="/restaurant-ai" element={<RestaurantAiPage />} />
                <Route path="/index.html" element={<Navigate to="/" replace />} />
                <Route path="/restaurant-ai.html" element={<Navigate to="/restaurant-ai" replace />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </MeetingProvider>
        </WhatsAppProvider>
      </NavigationProvider>
    </BrowserRouter>
  );
}

export default App;
