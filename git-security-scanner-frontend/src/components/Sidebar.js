import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import { Link } from 'react-router-dom';
import appIcon from '../assets/git-security-scanner-logo.svg'; // Path to your app icon
import dashboardIcon from '../assets/pie-chart-icon.svg';
import analyticsIcon from '../assets/bar-chart-icon.svg';

function Sidebar({ selectedTab, setSelectedTab }) {
  return (
    <Box
      sx={{
        width: 220,
        backgroundColor: "#ffffff",
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: 2,
        paddingLeft: 2, 
        paddingRight: 2
      }}
    >
      {/* App Icon at the top */}
      <Box sx={{ paddingBottom: 2, paddingLeft: 5, paddingRight: 5}}>
        <Link to="/"> {/* Use the Link component and set the destination path to home */}
          <img src={appIcon} alt="App Icon" style={{ width: 210, height: 200 }} />
        </Link>
      </Box>

      {/* Dashboard Tab */}
      <Button
        component={Link}
        to="/dashboard"
        onClick={() => setSelectedTab("Dashboard")}
        fullWidth
        style={{fontFamily: 'Futura, sans-serif'}}
        sx={{
          textTransform: 'none',
          backgroundColor: selectedTab === "Dashboard" ? "#3B68AD" : "transparent",
          color: selectedTab === "Dashboard" ? "#fff" : "#000",
          padding: 1,
          marginBottom: 1,
        }}
      >
        <img 
          src={dashboardIcon} 
          alt="Dashboard icon" 
          style={{ width: 25, height: 25, marginRight: 8 }} // Adjust size and margin as needed
        />
        <Typography>Dashboard</Typography>
      </Button>

      {/* Analytics Tab */}
      <Button
        component={Link}
        to="/analytics"
        onClick={() => setSelectedTab("Analytics")}
        fullWidth
        style={{fontFamily: 'Futura, sans-serif'}}
        sx={{
          textTransform: 'none',
          backgroundColor: selectedTab === "Analytics" ? "#3B68AD" : "transparent",
          color: selectedTab === "Analytics" ? "#fff" : "#000",
          padding: 1,
        }}
      >
        <img 
          src={analyticsIcon} 
          alt="Analytics icon" 
          style={{ width: 25, height: 25, marginRight: 8 }} // Adjust size and margin as needed
        />
        <Typography>Analytics</Typography>
      </Button>
    </Box>
  );
}

export default Sidebar;
