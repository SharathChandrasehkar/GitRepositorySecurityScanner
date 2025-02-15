import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import { Link } from 'react-router-dom';
import appIcon from '../assets/app-icon.png'; // Path to your app icon

function Sidebar({ selectedTab, setSelectedTab }) {
  return (
    <Box
      sx={{
        width: 200,
        backgroundColor: "#ffffff",
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: 2,
      }}
    >
      {/* App Icon at the top */}
      <Box sx={{ paddingBottom: 2 }}>
        <img src={appIcon} alt="App Icon" style={{ width: 200, height: 200 }} />
      </Box>

      {/* Dashboard Tab */}
      <Button
        component={Link}
        to="/dashboard"
        onClick={() => setSelectedTab("Dashboard")}
        fullWidth
        sx={{
          textTransform: 'none',
          backgroundColor: selectedTab === "Dashboard" ? "#3f51b5" : "transparent",
          color: selectedTab === "Dashboard" ? "#fff" : "#000",
          padding: 1,
          marginBottom: 1,
        }}
      >
        <Typography>Dashboard</Typography>
      </Button>

      {/* Analytics Tab */}
      <Button
        component={Link}
        to="/analytics"
        onClick={() => setSelectedTab("Analytics")}
        fullWidth
        sx={{
          textTransform: 'none',
          backgroundColor: selectedTab === "Analytics" ? "#3f51b5" : "transparent",
          color: selectedTab === "Analytics" ? "#fff" : "#000",
          padding: 1,
        }}
      >
        <Typography>Analytics</Typography>
      </Button>
    </Box>
  );
}

export default Sidebar;
