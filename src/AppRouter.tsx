import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ScrollToTop } from "./components/ScrollToTop";

import Index from "./pages/Index";
import { NIP19Page } from "./pages/NIP19Page";
import ProfilePage from "./pages/ProfilePage";
import LegacyOperatorRedirect from "./pages/LegacyOperatorRedirect";
import NotFound from "./pages/NotFound";

export function AppRouter() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Index />} />
        {/* Canonical profile route: /profile/npub1... or /profile/nprofile1... */}
        <Route path="/profile/:nip19Identifier" element={<ProfilePage />} />
        {/* Legacy redirect for /operator/:hex - converts hex to npub and redirects */}
        <Route path="/operator/:hexPubkey" element={<LegacyOperatorRedirect />} />
        {/* NIP-19 route for npub1, note1, naddr1, nevent1, nprofile1 */}
        <Route path="/:nip19" element={<NIP19Page />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
export default AppRouter;