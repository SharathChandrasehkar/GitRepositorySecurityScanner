import React, { useState } from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, ArcElement } from 'chart.js';
import { Container, Row, Col, Card } from "react-bootstrap"; // Include any other necessary imports
import 'jspdf-autotable';

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, ArcElement);

function Analytics({ scanResults }) {
    const [loading] = useState(false);


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
        </>
      )}
    </Container>
  );
}

export default Analytics;
