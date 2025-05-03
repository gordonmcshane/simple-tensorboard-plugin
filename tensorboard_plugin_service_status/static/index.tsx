import * as React from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  AlertTitle
} from "@mui/material";
import { LazyLog } from "@melloware/react-logviewer";
import { createRoot } from "react-dom/client";

console.log("[service_status] status script loaded");

export async function render() {
  const container = document.createElement("div")
  document.body.insertBefore(container, document.body.firstChild);
  const root = createRoot(container);
  root.render(<StatusTab />);
}

type ServiceConfig = {
  env: Map<string, string>;
  cmd: string;
};

export function StatusTab() {

  const [config, setConfig] = React.useState<ServiceConfig>({ env: new Map(), cmd: ""});
  const [serviceStatus, setServiceStatus] = React.useState<string>("");

  React.useEffect(() => {
    fetch("/data/plugin/service_status/config")
      .then((res) => res.json())
      .then((data) => {
        if (data.config) setConfig(data.config);
      });
  }, []);

  React.useEffect(() => {
    let isMounted = true;

    const fetchStatus = async () => {
      try {
        const res = await fetch("/data/plugin/service_status/status");
        const data = await res.json();
        if (isMounted && data.message !== serviceStatus) {
          setServiceStatus(data.message); 
        }
      } catch (err) {
        console.error("Failed to fetch health status:", err);
      }
    };

    fetchStatus(); // initial call
    const interval = setInterval(fetchStatus, 30_000); // every 30s

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [serviceStatus]);

  console.log("status: " + serviceStatus)

  return (
    <Box sx={{ padding: 2 }}>
      {serviceStatus && (
        <Alert sx={{ my: 2}} severity="warning" variant="outlined">
          <AlertTitle>Service Status</AlertTitle>
          {serviceStatus}
        </Alert>
        )}
      <Paper elevation={3} sx={{ marginBottom: 4 }}>
      <Typography variant="h6" sx={{ p: 2 }}>
        Service Configuration
      </Typography>

      <TableContainer component={Paper}>
        <Table size="small" aria-label="environment">
          <TableHead>
            <TableRow>
              <TableCell><strong>Setting</strong></TableCell>
              <TableCell><strong>Value</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Object.entries(config.env as Object).map(([key, value], index) => (
              <TableRow key={index}>
                <TableCell>{key}</TableCell>
                <TableCell>{value}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      </Paper>

      <Paper elevation={3} sx={{ marginBottom: 4 }}>
        <Typography variant="h6" sx={{ p: 2 }}>
        Command Line
        </Typography>
        <Typography variant="body1" sx={{ p: 2 }}>
          {config.cmd}
        </Typography>
      </Paper>

      <Paper elevation={3} sx={{ marginBottom: 4 }}>
        <Typography variant="h6" sx={{ p: 2 }}>
          Sync Logs
        </Typography>
        <Box sx={{ px: 2, pb: 2, height: '800px' }}>
          <LazyLog
             url='/data/plugin/service_status/logs?max_lines=1000'
             enableLineNumbers={true}
             style={{
              width: '100%',
              height: '100%',
             }}
             />
        </Box>
      </Paper>
    </Box>
  );
}