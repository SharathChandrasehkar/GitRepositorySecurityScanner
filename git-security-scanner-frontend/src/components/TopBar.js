import React, { useState, useEffect } from 'react';
import { Button, Form, Spinner, Container, Row, Col } from 'react-bootstrap';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import { jsPDF } from "jspdf";
import html2canvas from 'html2canvas';
import 'jspdf-autotable';

function TopBar({ setScanResults, scanResults, dashboardChartsRef, analyticsChartsRef }) {
  const [repoUrl, setRepoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // State to track loading
  const [error, setError] = useState(false);
  const navigate = useNavigate(); // Initialize navigate

  // Reset error when repoUrl changes
  useEffect(() => {
    if (repoUrl) {
      setError(null);  // Clear error when user starts typing
    }
  }, [repoUrl]);

  const handleScan = async () => {
    setLoading(true);
    setError(null); // Reset error on new scan
    try {
      const apiUrl = process.env.NODE_ENV === 'production'
        ? 'https://gitrepositorysecurityscannerbackend.onrender.com'  // Production URL
        : 'http://localhost:5000';  // Local URL for development
      const response = await axios.post(`${apiUrl}/scan`, { repoUrl });
      setScanResults(response.data);  // Set the scan results in the parent component state
      // Navigate to Dashboard after scan is complete
      navigate('/dashboard');
    } catch (error) {
      setError('Error during scan. Please try again!');
      console.error('Error scanning repo:', error);
    } finally {
      setLoading(false);
    }
  };

  // Download PDF function
const generatePDF = () => {
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
        const dashboardElement = dashboardChartsRef.current;
        const analyticsElement = analyticsChartsRef.current;

        console.log("dashboardElement --",dashboardElement);
        console.log("analyticsElement --",analyticsElement);
    
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

        if (analyticsElement) {
          const analyticsCanvas = await html2canvas(analyticsElement);
      
          // Add the chart image to the PDF
          doc.addImage(analyticsCanvas.toDataURL('image/png'), 'PNG', 14, 60, 180, 100); // Adjust coordinates and size
      
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
            className="mx-3" style={{ backgroundColor: '#3f51b5', color: 'white' , whiteSpace: 'nowrap'}}
            disabled={loading || !repoUrl}
          >
            {loading ? <Spinner animation="border" size="sm" /> : 'Scan Repo'}
          </Button>
          {/* Button to generate PDF */}
          <Button
            onClick={generatePDF}
            variant="secondary"
            className="mx-3"
            disabled={isLoading || !scanResults}
            style={{ whiteSpace: 'nowrap' }}
          >
            Generate PDF Report
          </Button>
        </Col>
      </Row>
      {error && <div className="alert alert-danger mt-3">{error}</div>}
    </Container>
  );
}

export default TopBar;
