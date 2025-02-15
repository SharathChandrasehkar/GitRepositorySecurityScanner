import React, { useState, useEffect } from 'react';
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

function Dashboard({ scanResults, dashboardChartsRef }) {
  const [loading] = useState(false);

  useEffect(() => {
    if (dashboardChartsRef.current) {
      console.log('Dashboard charts ref:', dashboardChartsRef.current);
    }
  }, [dashboardChartsRef]);

  if (!scanResults) {
    return <div>No scan results available.</div>; // Display a message if there are no scan results
  }
  
  return (
    
    <Container className="mt-5">      
    
      {/* Display Scan Results */}
      {scanResults && !loading && (
        <>
        <Row className="mt-3" ref={dashboardChartsRef}>
          <Col md={12}>
          <Card className="mb-3" style={{ borderRadius: '10px', transition: 'all 0.3s ease' }}>
            <Card.Body>
              <h5 className="fw-bold" style={{ fontSize: '1.25rem', color: '#212529' }}>Overview of Issues</h5>
              <div className="row">
                <SeverityBox
                  title={<span style={{ color: '#212529' }}>Vulnerabilities</span>}
                  count={scanResults.vulnerabilities?.length}
                  icon={<FaExclamationTriangle style={{ color: 'rgba(245, 12, 8, 0.56)' }} />}
                  bgColor="rgba(255, 88, 85, 0.56)"
                />
                <SeverityBox
                  title={<span style={{ color: '#212529' }}>Misconfigurations</span>}
                  count={scanResults.misconfigurations?.length}
                  icon={<FaExclamationCircle style={{ color: 'rgba(246, 194, 6, 0.88)' }} />}
                  bgColor="rgba(255, 213, 61, 0.57)"
                />
                <SeverityBox
                  title={<span style={{ color: '#212529' }}>Unwanted Files</span>}
                  count={scanResults.unwantedFiles?.length}
                  icon={<FaFileAlt style={{ color: 'rgb(10, 128, 247)' }} />} 
                  bgColor="rgba(40, 190, 210, 0.53)"
                />
                <SeverityBox
                  title={<span style={{ color: '#212529' }}>Secrets</span>} 
                  count={scanResults.secrets?.length}
                  icon={<FaLock style={{ color: 'rgba(17, 245, 9, 0.98)' }} />}
                  bgColor="rgba(50, 210, 90, 0.53)"
                />
              </div>
            </Card.Body>
          </Card>
          </Col>
        </Row>


        {/* Display Secrets */}
        <Row className="mt-5" >
          <Col md={4}>
          <Card className="mb-3">
            <Card.Body>
              <h5>Secrets</h5>
              
              <div style={{ maxHeight: '200px', overflowY: 'auto', overflowX: 'auto' }}>
                <table className="table table-striped">
                  <thead style={{ position: 'sticky', top: 0, zIndex: 1, backgroundColor: '#212529',  color: 'white' }}>
                    <tr>
                      <th style={{ backgroundColor: '#3f51b5', color: 'white' }}>#</th>
                      <th style={{ backgroundColor: '#3f51b5', color: 'white' }}>Secret</th>
                      <th style={{ backgroundColor: '#3f51b5', color: 'white' }}>Git Blame</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scanResults.secrets.map((secret, index) => (
                      <tr key={index}>
                        <td>{index + 1}</td>
                        <td>{secret.name}</td>
                        <td>{secret.blame}</td>
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
                  <thead style={{ position: 'sticky', top: 0, zIndex: 1, backgroundColor: '#212529',  color: 'white' }}>
                    <tr>
                      <th style={{ backgroundColor: '#3f51b5', color: 'white' , whiteSpace: 'nowrap'}}>#</th>
                      <th style={{ backgroundColor: '#3f51b5', color: 'white' , whiteSpace: 'nowrap'}}>Misconfiguration</th>
                      <th style={{ backgroundColor: '#3f51b5', color: 'white' , whiteSpace: 'nowrap'}}>Resolution Guidance</th>
                      <th style={{ backgroundColor: '#3f51b5', color: 'white' , whiteSpace: 'nowrap'}}>Git Blame</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scanResults.misconfigurations.map((misconfig, index) => (
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
                  <thead style={{ position: 'sticky', top: 0, zIndex: 1, backgroundColor: '#212529',  color: 'white' }}>
                    <tr>
                      <th style={{ backgroundColor: '#3f51b5', color: 'white' , whiteSpace: 'nowrap'}}>#</th>
                      <th style={{ backgroundColor: '#3f51b5', color: 'white' , whiteSpace: 'nowrap'}}>Unwanted File</th>
                      <th style={{ backgroundColor: '#3f51b5', color: 'white' , whiteSpace: 'nowrap'}}>Resolution Guidance</th>
                      <th style={{ backgroundColor: '#3f51b5', color: 'white' , whiteSpace: 'nowrap'}}>Git Blame</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scanResults.unwantedFiles.map((unwantedFile, index) => (
                      <tr key={index}>
                        <td>{index + 1}</td>
                        <td>{unwantedFile}</td>
                        <td>{unwantedFile.resolutionGuidance}</td>
                        <td>{unwantedFile.blame}</td>                  
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
                  <thead style={{ position: 'sticky', top: 0, zIndex: 1, wrappable:false, backgroundColor: '#212529', color: 'blue'}}>
                    <tr>
                      <th style={{ backgroundColor: '#3f51b5', color: 'white' , whiteSpace: 'nowrap'}}>#</th>
                      <th style={{ backgroundColor: '#3f51b5', color: 'white' , whiteSpace: 'nowrap'}}>Vulnerability</th>
                      <th style={{ backgroundColor: '#3f51b5', color: 'white' , whiteSpace: 'nowrap'}}>Severity</th>
                      <th style={{ backgroundColor: '#3f51b5', color: 'white' , whiteSpace: 'nowrap'}}>Affected Version Range</th>
                      <th style={{ backgroundColor: '#3f51b5', color: 'white' , whiteSpace: 'nowrap'}}>Fix Available</th>
                      <th style={{ backgroundColor: '#3f51b5', color: 'white' , whiteSpace: 'nowrap'}}>Resolution Guidance</th>
                      <th style={{ backgroundColor: '#3f51b5', color: 'white' , whiteSpace: 'nowrap'}}>Git Blame</th>
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
