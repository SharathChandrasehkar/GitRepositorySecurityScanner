import React, { useState, useRef } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Box } from "@mui/material";
import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";
import Dashboard from "./components/Dashboard";
import Analytics from "./components/Analytics";


const App = () => {
  const [selectedTab, setSelectedTab] = useState("Dashboard");
  const [scanResults, setScanResults] = useState(null);
  const dashboardChartsRef = useRef(null);
  const analyticsChartsRef = useRef(null);

  return (
    <Router>
      <Box display="flex" height="100vh">
        {/* Sidebar with app icon at the top */}
        <Sidebar selectedTab={selectedTab} setSelectedTab={setSelectedTab} />

        <Box component="main" flexGrow={1}>
        <TopBar setScanResults={setScanResults} scanResults={scanResults} dashboardChartsRef={dashboardChartsRef} analyticsChartsRef={analyticsChartsRef}/> {/* Pass setScanResults to TopBar */}
        
          {/* Routes for Dashboard and Analytics */}
          <Routes>
            <Route path="/dashboard" element={<Dashboard scanResults={scanResults} dashboardChartsRef={dashboardChartsRef}/>} />
            <Route path="/analytics" element={<Analytics scanResults={scanResults} analyticsChartsRef={analyticsChartsRef}/>} />
          </Routes>
        </Box>
      </Box>
    </Router>
  );
}

export default App;
