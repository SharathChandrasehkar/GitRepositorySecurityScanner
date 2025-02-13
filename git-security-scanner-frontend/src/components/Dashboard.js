import React, { useState } from 'react';
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, ArcElement } from 'chart.js';
import { Container, Row, Col, Card } from "react-bootstrap"; // Include any other necessary imports
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

function Dashboard({ scanResults }) {
  const [loading] = useState(false);
  if (!scanResults) {
    return <div>No scan results available.</div>; // Display a message if there are no scan results
  }
  
  return (
    <Container className="mt-4">      

      {/* Display Scan Results */}
      {scanResults && !loading && (
        <>
        <Row className="mt-5">
          <Card className="mb-3">
            <Card.Body>
              <h5>Overview of Issues</h5>
              <div className="row">
                <SeverityBox
                  title="Vulnerabilities"
                  count={scanResults.vulnerabilities?.length}
                  icon={<FaExclamationTriangle />}
                  bgColor="#dc3545" // Red for vulnerabilities
                />
                <SeverityBox
                  title="Misconfigurations"
                  count={scanResults.misconfigurations?.length}
                  icon={<FaExclamationCircle />}
                  bgColor="#ffc107" // Yellow for misconfigurations
                />
                <SeverityBox
                  title="Unwanted Files"
                  count={scanResults.unwantedFiles?.length}
                  icon={<FaFileAlt />}
                  bgColor="#17a2b8" // Blue for unwanted files
                />
                <SeverityBox
                  title="Secrets"
                  count={scanResults.secrets?.length}
                  icon={<FaLock />}
                  bgColor="#28a745" // Green for secrets
                />
              </div>
            </Card.Body>
          </Card>
        </Row>

        {/* Display Secrets */}
        <Row className="mt-5" >
          <Col md={4}>
          <Card className="mb-3">
            <Card.Body>
              <h5>Secrets</h5>
              
              <div style={{ maxHeight: '200px', overflowY: 'auto', overflowX: 'auto' }}>
                <table className="table table-striped">
                  <thead style={{ position: 'sticky', top: 0, zIndex: 1, backgroundColor: '#007bff',  color: 'white' }}>
                    <tr>
                      <th style={{ backgroundColor: '#007bff', color: 'white' }}>#</th>
                      <th style={{ backgroundColor: '#007bff', color: 'white' }}>Secret</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scanResults.secrets.map((secret, index) => (
                      <tr key={index}>
                        <td>{index + 1}</td>
                        <td>{secret}</td>
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
          <Card className="mb-3">
            <Card.Body>
              <h5>Misconfigurations</h5>
              
              <div style={{ maxHeight: '200px', overflowY: 'auto', overflowX: 'auto' }}>
                <table className="table table-striped">
                  <thead style={{ position: 'sticky', top: 0, zIndex: 1, backgroundColor: '#007bff',  color: 'white' }}>
                    <tr>
                      <th style={{ backgroundColor: '#007bff', color: 'white' , whiteSpace: 'nowrap'}}>#</th>
                      <th style={{ backgroundColor: '#007bff', color: 'white' , whiteSpace: 'nowrap'}}>Misconfiguration</th>
                      <th style={{ backgroundColor: '#007bff', color: 'white' , whiteSpace: 'nowrap'}}>Resolution Guidance</th>
                      <th style={{ backgroundColor: '#007bff', color: 'white' , whiteSpace: 'nowrap'}}>Git Blame</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scanResults.secrets.map((misconfig, index) => (
                      <tr key={index}>
                        <td>{index + 1}</td>
                        <td>{misconfig}</td>
                        <td>{misconfig.resolutionGuidance}</td>
                        <td>{misconfig.blame}</td>                        
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
          <Card className="mb-3">
            <Card.Body>
              <h5>Unwanted Files</h5>
              
              <div style={{ maxHeight: '200px', overflowY: 'auto', overflowX: 'auto' }}>
                <table className="table table-striped">
                  <thead style={{ position: 'sticky', top: 0, zIndex: 1, backgroundColor: '#007bff',  color: 'white' }}>
                    <tr>
                      <th style={{ backgroundColor: '#007bff', color: 'white' , whiteSpace: 'nowrap'}}>#</th>
                      <th style={{ backgroundColor: '#007bff', color: 'white' , whiteSpace: 'nowrap'}}>Unwanted File</th>
                      <th style={{ backgroundColor: '#007bff', color: 'white' , whiteSpace: 'nowrap'}}>Resolution Guidance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scanResults.unwantedFiles.map((unwantedFile, index) => (
                      <tr key={index}>
                        <td>{index + 1}</td>
                        <td>{unwantedFile}</td>
                        <td>{unwantedFile.resolutionGuidance}</td>                       
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
        <Row className="mt-5" >
          <Col md={12}>
          <Card className="mb-3">
            <Card.Body>
              <h5>Vulnerabilities</h5>
              
              <div style={{ maxHeight: '400px', overflowY: 'auto', overflowX: 'auto' }}>
                <table className="table table-striped">
                  <thead style={{ position: 'sticky', top: 0, zIndex: 1, wrappable:false, backgroundColor: 'white', color: 'blue'}}>
                    <tr>
                      <th style={{ backgroundColor: '#007bff', color: 'white' , whiteSpace: 'nowrap'}}>#</th>
                      <th style={{ backgroundColor: '#007bff', color: 'white' , whiteSpace: 'nowrap'}}>Vulnerability</th>
                      <th style={{ backgroundColor: '#007bff', color: 'white' , whiteSpace: 'nowrap'}}>Severity</th>
                      <th style={{ backgroundColor: '#007bff', color: 'white' , whiteSpace: 'nowrap'}}>Affected Version Range</th>
                      <th style={{ backgroundColor: '#007bff', color: 'white' , whiteSpace: 'nowrap'}}>Fix Available</th>
                      <th style={{ backgroundColor: '#007bff', color: 'white' , whiteSpace: 'nowrap'}}>Resolution Guidance</th>
                      <th style={{ backgroundColor: '#007bff', color: 'white' , whiteSpace: 'nowrap'}}>Git Blame</th>
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
                            style={{ padding: '5px 15px' }}
                          >
                            {vuln.severity}
                          </button>
                        </td>
                        <td>{vuln.range}</td>
                        <td>{vuln.fixAvailable ? 'Yes' : 'No'}</td>
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
