import React, { useState, useRef} from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, ArcElement } from 'chart.js';
import { Button, Container, Spinner, Row, Col, Card } from "react-bootstrap"; // Include any other necessary imports
import { jsPDF } from "jspdf";
import html2canvas from 'html2canvas';
import 'jspdf-autotable';

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, ArcElement);

function Analytics({ scanResults }) {
  const [loading, setLoading] = useState(false);
  const analyticsRef = useRef(null); // Create a ref to capture the charts container

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
      const analyticsElement = analyticsRef.current;

      console.log("analyticsElement --",analyticsElement);
  
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
        setLoading(false);
      }
  };
  
  captureChart();
  };

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
              className="mx-1" style={{ backgroundColor: '#3f51b5', color: 'white' , whiteSpace: 'nowrap'}}
              disabled={loading || !scanResults}
            >
              {loading ? <Spinner animation="border" size="sm" /> : 'Export Analytics Report'}
            </Button>
          </Col>
        </Row>

        <Row className="mt-1" ref={analyticsRef}>
          <Col md={8}>
              <Card className="mb-1">
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
            <Col md={4}>
              <Card className="mb-1">
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
        </>
      )}
    </Container>
  );
}

export default Analytics;
