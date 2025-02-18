import React, { useState, useEffect } from 'react';
import { Button, Form, Spinner, Container, Row, Col } from 'react-bootstrap';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import 'jspdf-autotable';

function TopBar({ setScanResults }) {
  const [repoUrl, setRepoUrl] = useState('');
  const [loading, setLoading] = useState(false);
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

  return (
    <Container className="mt-4">
      <Row className="justify-content-center mt-4">
        <Col xs={12} sm={8} md={6} lg={6}>
          <Form.Control
            type="text"
            style={{ fontFamily: 'Futura, sans-serif' , whiteSpace: 'nowrap'}}
            placeholder="Enter GitHub Repo URL"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
          />
        </Col>
        <Col>
          <Button
            onClick={handleScan}
            variant="primary"
            className="mx-3" style={{ backgroundColor: '#3B68AD', fontFamily: 'Futura, sans-serif' , whiteSpace: 'nowrap'}}
            disabled={loading || !repoUrl}
          >
            {loading ? <Spinner animation="border" size="sm" /> : 'Scan Repo'}
          </Button>
        </Col>
      </Row>
      {error && <div className="alert alert-danger mt-3">{error}</div>}
    </Container>
  );
}

export default TopBar;
