import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ScrollToTop } from "./components/ScrollToTop";
import { AppLayout } from "./components/AppLayout";

import HomePage from "./pages/HomePage";
import SearchPage from "./pages/SearchPage";
import DMsPage from "./pages/DMsPage";
import SettingsPage from "./pages/SettingsPage";
import { NIP19Page } from "./pages/NIP19Page";
import ProfilePage from "./pages/ProfilePage";
import LnPubPage from "./pages/LnPubPage";
import NodePage from "./pages/NodePage";
import RelayTest from "./pages/RelayTest";
import NotFound from "./pages/NotFound";

export function AppRouter() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/dms" element={<DMsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          {/* Diagnostic routes */}
          <Route path="/debug/relays" element={<RelayTest />} />
          {/* Profile routes: /profile/:nip19 or /p/:nip19 (both canonical) */}
          <Route path="/profile/:nip19Identifier" element={<ProfilePage />} />
          <Route path="/p/:nip19Identifier" element={<ProfilePage />} />
          {/* Lightning pubkey lookup - redirects to operator profile */}
          <Route path="/lightning/operator/:lightningPubkey" element={<LnPubPage />} />
          {/* Lightning node page by network and pubkey */}
          <Route path="/lightning/:network/node/:pubkey" element={<NodePage />} />
          {/* NIP-19 route for npub1, note1, naddr1, nevent1, nprofile1 */}
          <Route path="/:nip19" element={<NIP19Page />} />
        </Route>
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
export default AppRouter;