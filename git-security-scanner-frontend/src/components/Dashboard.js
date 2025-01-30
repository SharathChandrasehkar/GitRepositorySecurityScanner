import React, { useState, useRef } from 'react';
import axios from 'axios';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, ArcElement } from 'chart.js';
import { Button, Form, Alert, Spinner, Container, Row, Col, Card } from 'react-bootstrap';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import 'jspdf-autotable';

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, ArcElement);

const Dashboard = () => {
  const [repoUrl, setRepoUrl] = useState('');
  const [scanResults, setScanResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const chartsRef = useRef(null); // Create a ref to capture the charts container
  const [isLoading, setIsLoading] = useState(false); // State to track loading

  const handleScan = async () => {
    setLoading(true);
    setError(null); // Reset error on new scan
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000'; // Use the backend API URL from environment variable or fallback to localhost
      const response = await axios.post(`${apiUrl}/scan`, { repoUrl });
      setScanResults(response.data);
    } catch (error) {
      setError('Error during scan. Please try again!');
      console.error('Error scanning repo:', error);
    } finally {
      setLoading(false);
    }
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

  // Prepare data for the bar chart
  const prepareBarChartData = () => {
    if (!scanResults) return {};

    return {
      labels: ['Secrets', 'Misconfigurations', 'Vulnerabilities', 'Unwanted Files'],
      datasets: [
        {
          label: 'Issues Count',
          data: [
            (scanResults.secrets?.length || 0),
            (scanResults.misconfigurations?.length || 0),
            (scanResults.vulnerabilities?.length || 0),
            (scanResults.unwantedFiles?.length || 0),
          ],
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
        },
      ],
    };
  };

  // Prepare data for the pie chart
  const preparePieChartData = () => {
    if (!scanResults) return {};

    const totalIssues =
      (scanResults.secrets?.length || 0) +
      (scanResults.misconfigurations?.length || 0) +
      (scanResults.vulnerabilities?.length || 0) +
      (scanResults.unwantedFiles?.length || 0);

    return {
      labels: ['Secrets', 'Misconfigurations', 'Vulnerabilities', 'Unwanted Files'],
      datasets: [
        {
          data: [
            ((scanResults.secrets?.length || 0) / totalIssues) * 100,
            ((scanResults.misconfigurations?.length || 0) / totalIssues) * 100,
            ((scanResults.vulnerabilities?.length || 0) / totalIssues) * 100,
            ((scanResults.unwantedFiles?.length || 0) / totalIssues) * 100,
          ],
          backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0'],
          hoverOffset: 4,
        },
      ],
    };
  };

  // Download PDF function
  const downloadPDF = () => {
    setIsLoading(true); // Set loading to true when the download starts
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
      const chartsElement = chartsRef.current;
  
      if (chartsElement) {
        const canvas = await html2canvas(chartsElement);
  
        // Add the chart image to the PDF
        doc.addImage(canvas.toDataURL('image/png'), 'PNG', 14, 60, 180, 100); // Adjust coordinates and size
  
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
            head: [['#', 'Secret']],
            body: scanResults.secrets.map((secret, index) => [index + 1, secret]),
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
            head: [['#', 'Misconfiguration']],
            body: scanResults.misconfigurations.map((misconfig, index) => [index + 1, misconfig]),
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
  
        // Add Vulnerabilities Table
        if (scanResults.vulnerabilities?.length > 0) {
          let currentY = startY;
          const tableHeight = scanResults.vulnerabilities.length * 10; // Estimate height per row
  
          // Check for page break
          currentY = checkPageBreak(doc, currentY, tableHeight);
  
          doc.autoTable({
            head: [['#', 'Vulnerability', 'Severity', 'Affected Version', 'Fix Available', 'Resolution Guidance']],
            body: scanResults.vulnerabilities.map((vuln, index) => [
              index + 1,
              vuln.name,
              vuln.severity,
              vuln.range,
              vuln.fixAvailable ? 'Yes' : 'No',
              vuln.resolutionGuidance,
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
  
        // Add Unwanted Files Table
        if (scanResults.unwantedFiles?.length > 0) {
          let currentY = startY;
          const tableHeight = scanResults.unwantedFiles.length * 10; // Estimate height per row
  
          // Check for page break
          currentY = checkPageBreak(doc, currentY, tableHeight);
  
          doc.autoTable({
            head: [['#', 'Unwanted File']],
            body: scanResults.unwantedFiles.map((file, index) => [index + 1, file]),
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
  
        // Save the PDF
        doc.save('security_scan_report.pdf');

        // Set loading state to false after PDF generation is completed
        setIsLoading(false);
      }
    };
  
    captureChart();
  };

  return (
    <Container className="mt-4">
      <h1 
        className="text-center"
        style={{ 
          backgroundColor: '#0d6efd',  // Your desired background color
          color: '#ffffff',            // White text color for contrast
          padding: '20px',             // Padding around the text
          borderRadius: '8px',         // Optional: Rounded corners for the header
        }}
      >
        Git Repository Security Scanner
      </h1>

      <Row className="justify-content-center mt-4">
        <Col xs={12} sm={8} md={6} lg={6}>
          <Form.Control
            type="text"
            placeholder="Enter GitHub Repo URL"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
          />
        </Col>
        <Col>
          <Button
            onClick={handleScan}
            variant="primary"
            className="mx-3"
            disabled={loading || !repoUrl}
          >
            {loading ? <Spinner animation="border" size="sm" /> : 'Scan Repo'}
          </Button>
        </Col>
        <Col>
          {/* Download Button */}
          <Button 
            onClick={downloadPDF} 
            variant="secondary" 
            disabled={isLoading} // Disable button while loading
          >
            {isLoading ? <Spinner animation="border" size="sm" /> : 'Download PDF'}
          </Button>
        </Col>
      </Row>

      

      {/* Error Handling */}
      {error && <Alert variant="danger" className="mt-3">{error}</Alert>}

      {/* Display Scan Results */}
      {scanResults && !loading && (
        <>
          <Row className="mt-5" ref={chartsRef}>
          <Col md={6}>
              <Card className="mb-4">
                <Card.Body>
                  <h5>Count of Issues</h5>
                  <Bar
                    data={prepareBarChartData()}
                    options={{
                      responsive: true,
                      plugins: {
                        title: {
                          display: true,
                          text: 'Count of Each Issue Type',
                        },
                        legend: {
                          position: 'top',
                        },
                      },
                      scales: {
                        x: {
                          title: {
                            display: true,
                            text: 'Issue Types',
                          },
                        },
                        y: {
                          title: {
                            display: true,
                            text: 'Count',
                          },
                          min: 0,
                        },
                      },
                    }}
                  />
                </Card.Body>
              </Card>
            </Col>

            <Col md={6}>
              <Card className="mb-4">
                <Card.Body>
                  <h5>Distribution of Issues</h5>
                  <Pie
                    data={preparePieChartData()}
                    options={{
                      responsive: true,
                      plugins: {
                        title: {
                          display: true,
                          text: 'Distribution of Issue Types',
                        },
                        legend: {
                          position: 'top',
                        },
                      },
                    }}
                  />
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row>
            {/* Display Secrets */}
            <Col md={4}>
              {(scanResults.secrets?.length || 0) > 0 && (
                <Card className="mb-3">
                  <Card.Body>
                    <h5>Secrets Found</h5>
                    <small>One of these secrets are exposed: API_KEY|SECRET_KEY|PASSWORD|TOKEN in these files </small>
                    <ul>
                      {scanResults.secrets.map((secret, index) => (
                        <li key={index}>
                          <strong>{secret}</strong><br/>
                        </li>
                      ))}
                    </ul>
                  </Card.Body>
                </Card>
              )}
            </Col>

            {/* Display Unwanted Files */}
            <Col md={4}>
              {(scanResults.unwantedFiles?.length || 0) > 0 ? (
                <Card className="mb-3">
                  <Card.Body>
                    <h5>Unwanted Files Found</h5>
                    {/* Small font note in a single line under the header */}
                    <small className="text-muted d-block mt-2">
                      Note: The application checks for files matching these patterns: 
                      {unwantedPatterns.join(', ')}.
                    </small>
                    <ul>
                      {scanResults.unwantedFiles.map((file, index) => (
                        <li key={index}>{file}</li>
                      ))}
                    </ul>
                  </Card.Body>
                </Card>
              ) : (
                <Card className="mb-3">
                  <Card.Body>
                    <h5>No unwanted Files found</h5>
                    {/* Small font note in a single line under the header */}
                    <small className="text-muted d-block mt-2">
                      Note: The application checks for files matching these patterns: 
                      {unwantedPatterns.join(', ')}.
                    </small>
                  </Card.Body>
                </Card>
              )}              
            </Col>

            {/* Display Misconfigurations */}
            <Col md={4}>
              {scanResults.misconfigurations?.length > 0 ? (
                <Card className="mb-3">
                  <Card.Body>
                    <h5>Misconfigurations Found</h5>
                    <ul>
                      {scanResults.misconfigurations.map((misconfig, index) => (
                        <li key={index}>
                          <strong>{misconfig}</strong>
                        </li>
                      ))}
                    </ul>
                  </Card.Body>
                </Card>
              ) : (
                <Card className="mb-3">
                  <Card.Body>
                    <h5>No Misconfigured Data Found</h5>
                  </Card.Body>
                </Card>
              )}
            </Col>
          </Row>

          <Row>
            <Col md={12}>
              {(scanResults.vulnerabilities?.length || 0) > 0 && (
                <Card className="mb-3">
                  <Card.Body>
                    <h5>Vulnerabilities Found</h5>
                    <ul>
                      {scanResults.vulnerabilities.map((vuln, index) => (
                        <li key={index}>
                          <strong>{vuln.name}</strong> (Severity: {vuln.severity})<br />
                          Affected Version Range: {vuln.range}<br />
                          Fix Available: {vuln.fixAvailable ? 'Yes' : 'No'}<br />
                          Resolution Guidance: {vuln.resolutionGuidance}<br />
                          {/* Display Git Blame if available */}
                          {vuln.blame ? (
                            <>
                              <br />
                              <strong>Git Blame:</strong> <pre>{vuln.blame}</pre>
                            </>
                          ) : (
                            <span>No Git Blame available for this vulnerability.</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </Card.Body>
                </Card>
              )}
            </Col>
          </Row>
        </>
      )}
    </Container>
  );
};

export default Dashboard;
