import React, { useState } from 'react';
import axios from 'axios';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, ArcElement } from 'chart.js';
import { Button, Form, Alert, Spinner, Container, Row, Col, Card } from 'react-bootstrap';

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, ArcElement);

const Dashboard = () => {
  const [repoUrl, setRepoUrl] = useState('');
  const [scanResults, setScanResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleScan = async () => {
    setLoading(true);
    setError(null); // Reset error on new scan
    try {
      const response = await axios.post('http://localhost:5000/scan', { repoUrl });
      setScanResults(response.data);
    } catch (error) {
      setError('Error during scan. Please try again!');
      console.error('Error scanning repo:', error);
    } finally {
      setLoading(false);
    }
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
    <Container className="mt-4">
      <h1 className="text-center">Git Repository Security Scanner</h1>

      <Row className="justify-content-center mt-4">
        <Col xs={12} sm={8} md={6} lg={4}>
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
      </Row>

      {/* Error Handling */}
      {error && <Alert variant="danger" className="mt-3">{error}</Alert>}

      {/* Display Scan Results */}
      {scanResults && !loading && (
        <>
          <Row className="mt-5">
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
                    style={{ height: '300px', width: '100%' }} // Apply custom size
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
                    style={{ height: '200px', width: '100%' }} // Apply custom size
                  />
                </Card.Body>
              </Card>
            </Col>

          </Row>

          
          <Row>
            <Col md={6}>
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
            <Col md={6}>
              {(scanResults.unwantedFiles?.length || 0) > 0 && (
                <Card className="mb-3">
                  <Card.Body>
                    <h5>Unwanted Files Found</h5>
                    <ul>
                      {scanResults.unwantedFiles.map((file, index) => (
                        <li key={index}>{file}</li>
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
