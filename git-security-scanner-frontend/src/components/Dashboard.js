import React, { useState, useRef } from 'react';
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, ArcElement } from 'chart.js';
import { Button, Container, Spinner, Row, Col, Card } from "react-bootstrap"; // Include any other necessary imports
import { jsPDF } from "jspdf";
import html2canvas from 'html2canvas';
import 'jspdf-autotable';
import { FaExclamationTriangle, FaExclamationCircle, FaLock, FaFileAlt } from 'react-icons/fa'; // FontAwesome icons

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, ArcElement);

const SeverityBox = ({ title, count, icon, bgColor }) => (
  <div className={`col-12 col-md-3 mb-4`}>
    <div className={`d-flex justify-content-center align-items-center p-3`} style={{ 
      backgroundColor: bgColor, 
      borderRadius: '10px', 
      height: '150px', 
      boxShadow: '0px 0px 15px rgba(0, 0, 0, 0.1)'
    }}>
      <div className="text-center">
        <div className="mb-3" style={{ fontSize: '50px' }}>
          {icon}
        </div>
        <h5 style={{ color: 'white' }}>{title}</h5>
        <p style={{ fontSize: '25px', fontWeight: 'bold', color: 'white' }}>{count}</p>
      </div>
    </div>
  </div>
);

const containerStyle = {
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-start', // Align content to the top
  height: '100vh', // Make the container take full height of the viewport
};

const messageContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center', // Center the content horizontally
  height: '75%', // Take up the top third of the page
  textAlign: 'center',
  padding: '20px',
  backgroundColor: 'white', // Optional: Background color for visibility
};

const headingStyle = {
  fontWeight: 'bold', // Makes the heading bold
  color: '#3B68AD'
};

const paragraphStyle = {
  fontWeight: 'bold', // Makes the paragraph bold
  color: 'grey'
};

const unwantedPatterns = [
  '.env',
  '.git/',
  '.log',
  'node_modules/',
  '.vscode/',
  '.idea/',
  '.DS_Store',
  'Thumbs.db',
  '*.bak',
  '*.swp',
  '*.sqlite3',
  '*.db',
  'dist/',
  'build/'
];

const misconfigPattern = [
  'debug=true',
  'password',
  'AWS_ACCESS_KEY_ID',
  'DATABASE_PASSWORD',
  'SECRET_KEY',
  'port=80',
  'allow_insecure=true',
  '.env & .git files with Insecure permissions'
];

function Dashboard({ scanResults }) {
  const [loading, setLoading] = useState(false);
  // State to control visibility of the note section
  const [showNoteMisConfig, setShowNoteMisConfig] = useState(false);
  const [showNoteSecrets, setShowNoteSecrets] = useState(false);
  const [showNoteUnwantedFiles, setShowNoteUnwantedFiles] = useState(false);
  const dashboardRef = useRef(null); // Create a ref to capture the charts container

  if (!scanResults) {
    return (
      <div style={containerStyle}>
        <div style={messageContainerStyle}>
          <h1 style={headingStyle}>Welcome to Git Repository Security Scanner</h1>
          <p style={paragraphStyle}>Enter Github URL to generate report!</p>
          <p style={paragraphStyle}> This application is designed to help developers, project managers, and teams monitor and secure their Git repositories by scanning for potential security risks, misconfigurations, and sensitive data exposure. The app provides a dashboard displaying detailed security findings and recommendations for improving the safety of your repositories.</p>
          <h3 style={headingStyle}>Key Features:</h3>
          <p style={paragraphStyle}>1. Sensitive Data Exposure Detection: Scans for secrets like API keys, passwords, certificates, and other sensitive information that may have been exposed in the source code.</p>
          <p style={paragraphStyle}>2. Misconfiguration Alerts: Identifies insecure settings within configuration files that could lead to security vulnerabilities.</p>
          <p style={paragraphStyle}>3. Vulnerability Scanning: Checks for known vulnerabilities in your repository's dependencies and suggests fixes.</p>
          <p style={paragraphStyle}>4. Git History Issues: Analyzes commit history to detect exposure of sensitive information that may have been included in past commits.</p>
          <p style={paragraphStyle}>5. Unwanted Files/Directories Detection: Flags files or directories like .env, .log, or .git that should not be tracked or pushed to the repository.</p>
        </div>
        {/* The rest of your content will go below */}
      </div>
    );
  }

  // Function to toggle the visibility
  const toggleNoteMisConfig = () => {
    setShowNoteMisConfig(!showNoteMisConfig);
  };
  const toggleNoteSecrets = () => {
    setShowNoteSecrets(!showNoteSecrets);
  };
  const toggleNoteUnwantedFiles = () => {
    setShowNoteUnwantedFiles(!showNoteUnwantedFiles);
  };

  // Download PDF function
  const generatePDF = () => {
    setLoading(true); // Set loading to true when the download starts
    const doc = new jsPDF();
    
    // Add Title to PDF
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold'); // Make the title bold
    doc.text('Git Repository Security Scanner Report', 14, 16);
    
    // Add Scan Summary (Secrets, Misconfigurations, etc.)
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold'); // Make the title bold
    doc.text('Scan Summary:', 14, 30);
    
    const scanSummary = `
        - Secrets: ${scanResults.secrets?.length || 0}
        - Misconfigurations: ${scanResults.misconfigurations?.length || 0}
        - Vulnerabilities: ${scanResults.vulnerabilities?.length || 0}
        - Unwanted Files: ${scanResults.unwantedFiles?.length || 0}
    `;
    doc.setFont('helvetica', 'normal'); // Make the title bold
    doc.text(scanSummary, 14, 30); // Add the scan summary text
    
    // Capture the chart and add to PDF
    const captureChart = async () => {
      const dashboardElement = dashboardRef.current;

      console.log("dashboardElement --",dashboardElement);
  
      if (dashboardElement) {
        const dashboardCanvas = await html2canvas(dashboardElement);
    
        // Add the chart image to the PDF
        doc.addImage(dashboardCanvas.toDataURL('image/png'), 'PNG', 14, 60, 180, 100); // Adjust coordinates and size
        
        // Set initial starting Y position for the tables
        let startY = 200; // Initial start Y position for the first table
    
        // Function to check if we need a page break
        const checkPageBreak = (doc, startY, height) => {
            const pageHeight = doc.internal.pageSize.height;
            if (startY + height > pageHeight) {
            doc.addPage();
            return 10; // Start a little below the top of the new page
            }
            return startY;
        };
    
        // Add Secrets Table
        if (scanResults.secrets?.length > 0) {
          let currentY = startY;
          const tableHeight = scanResults.secrets.length * 10; // Estimate height per row
  
          // Check for page break
          currentY = checkPageBreak(doc, currentY, tableHeight);
  
          doc.autoTable({
          head: [['#', 'File Name', 'File Path']],
          body: scanResults.secrets.map((secret, index) => [index + 1, secret.name, secret.fullPath]),
          startY: currentY,
          theme: 'striped',
          headStyles: { fillColor: [22, 160, 133] },
          didDrawPage: function (data) {
              doc.setFont('helvetica', 'bold'); // Make the title bold
              doc.text('Secrets Found:', 14, currentY - 5);
          },
          });
  
          // Update startY after the secrets table
          startY = doc.lastAutoTable.finalY + 10;
        }
    
        // Add Misconfigurations Table
        if (scanResults.misconfigurations?.length > 0) {
          let currentY = startY;
          const tableHeight = scanResults.misconfigurations.length * 10; // Estimate height per row
  
          // Check for page break
          currentY = checkPageBreak(doc, currentY, tableHeight);
  
          doc.autoTable({
          head: [['#', 'Issue Found', 'File Name']],
          body: scanResults.misconfigurations.map((misconfig, index) => [index + 1, misconfig.message, misconfig.name]),
          startY: currentY,
          theme: 'striped',
          headStyles: { fillColor: [22, 160, 133] },
          didDrawPage: function (data) {
              doc.setFont('helvetica', 'bold'); // Make the title bold
              doc.text('Misconfigurations Found:', 14, currentY - 5);
          },
          });
  
          // Update startY after the misconfigurations table
          startY = doc.lastAutoTable.finalY + 10;
        }

        // Add Unwanted Files Table
        if (scanResults.unwantedFiles?.length > 0) {
          let currentY = startY;
          const tableHeight = scanResults.unwantedFiles.length * 10; // Estimate height per row
  
          // Check for page break
          currentY = checkPageBreak(doc, currentY, tableHeight);
  
          doc.autoTable({
          head: [['#', 'Unwanted File']],
          body: scanResults.unwantedFiles.map((unwantedFile, index) => [index + 1, unwantedFile.name, unwantedFile.fullPath]),
          startY: currentY,
          theme: 'striped',
          headStyles: { fillColor: [22, 160, 133] },
          didDrawPage: function (data) {
              doc.setFont('helvetica', 'bold'); // Make the title bold
              doc.text('Unwanted Files Found:', 14, currentY - 5);
          },
          });
  
          // Update startY after the unwanted files table
          startY = doc.lastAutoTable.finalY + 10;
        }
    
        // Add Vulnerabilities Table
        if (scanResults.vulnerabilities?.length > 0) {
          let currentY = startY;
          const tableHeight = scanResults.vulnerabilities.length * 10; // Estimate height per row
  
          // Check for page break
          currentY = checkPageBreak(doc, currentY, tableHeight);
  
          doc.autoTable({
          head: [['#', 'Vulnerability', 'Severity', 'Affected Version', 'Fix Available', 'Resolution Guidance', 'Commit History']],
          body: scanResults.vulnerabilities.map((vuln, index) => [
              index + 1,
              vuln.name,
              vuln.severity,
              vuln.range,
              vuln.fixAvailable ? 'Yes' : 'No',
              vuln.resolutionGuidance,
              vuln.blame || 'No Git Blame', // Add the Git Blame info
          ]),
          startY: currentY,
          theme: 'striped',
          headStyles: { fillColor: [22, 160, 133] },
          didDrawPage: function (data) {
              doc.setFont('helvetica', 'bold'); // Make the title bold
              doc.text('Vulnerabilities Found:', 14, currentY - 5);
          },
          });
  
          // Update startY after the vulnerabilities table
          startY = doc.lastAutoTable.finalY + 10;
        }
    
        // Save the PDF
        doc.save('security_scan_report.pdf');

        // Set loading state to false after PDF generation is completed
        setLoading(false);
      }
    };
  
  captureChart();
  };
  
  return (
    
    <Container className="mt-1">      
    
      {/* Display Scan Results */}
      {scanResults && !loading && (
        <>
        <Row className="mt-1">
          <Col className="text-end">
            <Button
              onClick={generatePDF}
              variant="primary"
              className="mx-1" style={{ backgroundColor: '#3B68AD', fontFamily: 'Futura, sans-serif' , whiteSpace: 'nowrap'}}
              disabled={loading || !scanResults}
            >
              {loading ? <Spinner animation="border" size="sm" /> : 'Export Dashboard Report'}
            </Button>
          </Col>
        </Row>
        
        <Row className="mt-1" ref={dashboardRef}>
          <Col md={12}>
          <Card className="mb-1" style={{ borderRadius: '10px', transition: 'all 0.3s ease' }}>
            <Card.Body>
              <h5 className="mb-1" style={{ fontSize: '1.25rem', color: '#212529', fontFamily: 'Futura, sans-serif' }}>Overview of Issues</h5>
              <div className="row">
                <SeverityBox
                  title={<span style={{ color: '#212529', fontFamily: 'Futura, sans-serif' }}>Vulnerabilities</span>}
                  count={scanResults.vulnerabilities?.length}
                  icon={<FaExclamationTriangle style={{ color: '#C00000', fontFamily: 'Futura, sans-serif'}} />}
                  bgColor="rgba(255, 88, 85, 0.56)"
                />
                <SeverityBox
                  title={<span style={{ color: '#212529', fontFamily: 'Futura, sans-serif' }}>Misconfigurations</span>}
                  count={scanResults.misconfigurations?.length}
                  icon={<FaExclamationCircle style={{ color: '#E97132', fontFamily: 'Futura, sans-serif' }} />}
                  bgColor="rgba(255, 213, 61, 0.57)"
                />
                <SeverityBox
                  title={<span style={{ color: '#212529', fontFamily: 'Futura, sans-serif' }}>Unwanted Files</span>}
                  count={scanResults.unwantedFiles?.length}
                  icon={<FaFileAlt style={{ color: '#0070C0', fontFamily: 'Futura, sans-serif' }} />} 
                  bgColor="rgba(40, 190, 210, 0.53)"
                />
                <SeverityBox
                  title={<span style={{ color: '#212529', fontFamily: 'Futura, sans-serif' }}>Secrets</span>} 
                  count={scanResults.secrets?.length}
                  icon={<FaLock style={{ color: '#196B24', fontFamily: 'Futura, sans-serif' }} />}
                  bgColor="rgba(50, 210, 90, 0.53)"
                />
              </div>
            </Card.Body>
            {/* Button to generate PDF */}
          </Card>
          </Col>
        </Row>


        {/* Display Secrets */}
        <Row className="mt-1" >
          <Col md={4}>
          <Card className="mb-1">
            <Card.Body>
              <h5 style={{ fontSize: '1.25rem', color: '#212529', fontFamily: 'Futura, sans-serif' }}>Secrets</h5>
              {/* Button to toggle visibility of the note */}
              <button
                className="btn btn-link p-0 mt-2"
                style={{ fontSize: '0.9rem', color: '#3B68AD', textDecoration: 'underline' }}
                onClick={toggleNoteSecrets}
              >
                {showNoteSecrets ? 'Hide Note' : 'Show Note'}
              </button>

              {/* Conditionally render the note section */}
              {showNoteSecrets && (
                <small className="text-muted d-block mt-2">
                  One of these secrets are exposed: API_KEY|SECRET_KEY|PASSWORD|TOKEN in these files
                </small>
              )}
              <div style={{ maxHeight: '200px', overflowY: 'auto', overflowX: 'auto' }}>
                <table className="table table-striped">
                  <thead style={{ position: 'sticky', top: 0, zIndex: 1, backgroundColor: '#212529',  color: 'white', fontFamily: 'Futura, sans-serif' }}>
                    <tr>
                      <th style={{ backgroundColor: '#3B68AD', color: 'white', fontFamily: 'Futura, sans-serif' }}>#</th>
                      <th style={{ backgroundColor: '#3B68AD', color: 'white', fontFamily: 'Futura, sans-serif' }}>File Name</th>
                      <th style={{ backgroundColor: '#3B68AD', color: 'white', fontFamily: 'Futura, sans-serif' }}>File Path</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scanResults.secrets.map((secret, index) => (
                      <tr key={index}>
                        <td>{index + 1}</td>
                        <td>{secret.name}</td>
                        <td>{secret.fullPath}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card.Body>
          </Card>
          </Col>

          {/* Display Misconfigurations */}
          <Col md={4}>
          <Card className="mb-1">
            <Card.Body>
              <h5 style={{ fontSize: '1.25rem', color: '#212529', fontFamily: 'Futura, sans-serif' }}>Misconfigurations</h5>
              {/* Button to toggle visibility of the note */}
              <button
                className="btn btn-link p-0 mt-2"
                style={{ fontSize: '0.9rem', color: '#3B68AD', textDecoration: 'underline' }}
                onClick={toggleNoteMisConfig}
              >
                {showNoteMisConfig ? 'Hide Note' : 'Show Note'}
              </button>

              {/* Conditionally render the note section */}
              {showNoteMisConfig && (
                <small className="text-muted d-block mt-2">
                  Note: Misconfigurations found in '.env', 'config.json', 'settings.yml': 
                  {misconfigPattern && misconfigPattern.length > 0 ? misconfigPattern.join(', ') : "None"}
                </small>
              )}
              <div style={{ maxHeight: '200px', overflowY: 'auto', overflowX: 'auto' }}>
                <table className="table table-striped">
                  <thead style={{ position: 'sticky', top: 0, zIndex: 1, backgroundColor: '#212529',  color: 'white', fontFamily: 'Futura, sans-serif' }}>
                    <tr>
                      <th style={{ backgroundColor: '#3B68AD', color: 'white', fontFamily: 'Futura, sans-serif' , whiteSpace: 'nowrap'}}>#</th>
                      <th style={{ backgroundColor: '#3B68AD', color: 'white', fontFamily: 'Futura, sans-serif' , whiteSpace: 'nowrap'}}>Issue Found</th>
                      <th style={{ backgroundColor: '#3B68AD', color: 'white', fontFamily: 'Futura, sans-serif' , whiteSpace: 'nowrap'}}>File Name</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scanResults.misconfigurations.map((misconfig, index) => (
                      <tr key={index}>
                        <td>{index + 1}</td>
                        <td>{misconfig.message}</td>
                        <td>{misconfig.name}</td>                     
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card.Body>
          </Card>
          </Col>
          {/* Display Unwanted Files */}
          <Col md={4}>
          <Card className="mb-1">
            <Card.Body>
              <h5 style={{ fontSize: '1.25rem', color: '#212529', fontFamily: 'Futura, sans-serif' }}>Unwanted Files</h5>
              {/* Button to toggle visibility of the note */}
              <button
                className="btn btn-link p-0 mt-2"
                style={{ fontSize: '0.9rem', color: '#3B68AD', textDecoration: 'underline' }}
                onClick={toggleNoteUnwantedFiles}
              >
                {showNoteUnwantedFiles ? 'Hide Note' : 'Show Note'}
              </button>

              {/* Conditionally render the note section */}
              {showNoteUnwantedFiles && (
                <small className="text-muted d-block mt-2">
                  Note: The application checks for files matching these patterns: 
                  {unwantedPatterns.join(', ')}.
                </small>
              )}
              <div style={{ maxHeight: '200px', overflowY: 'auto', overflowX: 'auto' }}>
                <table className="table table-striped">
                  <thead style={{ position: 'sticky', top: 0, zIndex: 1, backgroundColor: '#212529',  color: 'white', fontFamily: 'Futura, sans-serif' }}>
                    <tr>
                      <th style={{ backgroundColor: '#3B68AD', color: 'white', fontFamily: 'Futura, sans-serif' , whiteSpace: 'nowrap'}}>#</th>
                      <th style={{ backgroundColor: '#3B68AD', color: 'white', fontFamily: 'Futura, sans-serif' , whiteSpace: 'nowrap'}}>File Name</th>
                      <th style={{ backgroundColor: '#3B68AD', color: 'white', fontFamily: 'Futura, sans-serif' , whiteSpace: 'nowrap'}}>File Path</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scanResults.unwantedFiles.map((unwantedFile, index) => (
                      <tr key={index}>
                        <td>{index + 1}</td>
                        <td>{unwantedFile.name}</td>
                        <td>{unwantedFile.fullPath}</td>                 
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card.Body>
          </Card>
          </Col>
        </Row>

        {/* Display Vulnerabilities */}
        <Row className="mt-1" >
          <Col md={12}>
          <Card className="mb-1">
            <Card.Body>
              <h5 style={{ fontSize: '1.25rem', color: '#212529', fontFamily: 'Futura, sans-serif' }}>Vulnerabilities</h5>
              
              <div style={{ maxHeight: '400px', overflowY: 'auto', overflowX: 'auto' }}>
                <table className="table table-striped">
                  <thead style={{ position: 'sticky', top: 0, zIndex: 1, wrappable:false, backgroundColor: '#212529', color: 'blue', fontFamily: 'Futura, sans-serif'}}>
                    <tr>
                      <th style={{ backgroundColor: '#3B68AD', color: 'white', fontFamily: 'Futura, sans-serif' , whiteSpace: 'nowrap'}}>#</th>
                      <th style={{ backgroundColor: '#3B68AD', color: 'white', fontFamily: 'Futura, sans-serif' , whiteSpace: 'nowrap'}}>Vulnerability</th>
                      <th style={{ backgroundColor: '#3B68AD', color: 'white', fontFamily: 'Futura, sans-serif' , whiteSpace: 'nowrap'}}>Severity</th>
                      <th style={{ backgroundColor: '#3B68AD', color: 'white', fontFamily: 'Futura, sans-serif' , whiteSpace: 'nowrap'}}>Affected Version Range</th>
                      <th style={{ backgroundColor: '#3B68AD', color: 'white', fontFamily: 'Futura, sans-serif' , whiteSpace: 'nowrap'}}>Fix Available</th>
                      <th style={{ backgroundColor: '#3B68AD', color: 'white', fontFamily: 'Futura, sans-serif' , whiteSpace: 'nowrap'}}>Resolution Guidance</th>
                      <th style={{ backgroundColor: '#3B68AD', color: 'white', fontFamily: 'Futura, sans-serif' , whiteSpace: 'nowrap'}}>Commit History</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scanResults.vulnerabilities.map((vuln, index) => (
                      <tr key={index}>
                        <td>{index + 1}</td>
                        <td>{vuln.name}</td>
                        {/* Severity as button */}
                        <td>
                          <button
                            className={`btn ${vuln.severity === 'high' ? 'btn-danger' : 
                                      vuln.severity === 'moderate' ? 'btn-warning' : 
                                      'btn-secondary'}`}
                            style={{ padding: '5px 15px', opacity: 0.5 }}
                          >
                            {vuln.severity}
                          </button>
                        </td>
                         {/* Range as a light transparent grey button */}
                        <td>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '5px 15px', opacity: 0.5 }}
                          >
                            {vuln.range}
                          </button>
                        </td>
                        {/* Fix Available as light transparent green or red button */}
                        <td>
                          <button
                            className={`btn ${vuln.fixAvailable ? 'btn-success' : 'btn-danger'}`}
                            style={{ padding: '5px 15px', opacity: 0.5 }}
                          >
                            {vuln.fixAvailable ? 'Yes' : 'No'}
                          </button>
                        </td>
                        <td>{vuln.resolutionGuidance}</td>
                        <td>{vuln.blame ? vuln.blame : 'No Git Blame available for this vulnerability.'}</td>                    
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card.Body>
          </Card>
          </Col>
          </Row>
        </>
      )}
    </Container>
  );
}

export default Dashboard;
