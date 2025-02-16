import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Box } from "@mui/material";
import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";
import Dashboard from "./components/Dashboard";
import Analytics from "./components/Analytics";


const App = () => {
  const [selectedTab, setSelectedTab] = useState("Dashboard");
  const [scanResults, setScanResults] = useState(null);

  return (
    <Router>
      <Box display="flex" height="100vh">
        {/* Sidebar with app icon at the top */}
        <Sidebar selectedTab={selectedTab} setSelectedTab={setSelectedTab} />

        <Box component="main" flexGrow={1}>
        <TopBar setScanResults={setScanResults} scanResults={scanResults}/> {/* Pass setScanResults to TopBar */}
        
          {/* Routes for Dashboard and Analytics */}
          <Routes>
            <Route path="/dashboard" element={<Dashboard scanResults={scanResults} />} />
            <Route path="/analytics" element={<Analytics scanResults={scanResults} />} />
          </Routes>
        </Box>
      </Box>
    </Router>
  );
}

export default App;
