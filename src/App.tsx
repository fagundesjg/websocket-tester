import React from "react";
import { ThemeProvider } from "@mui/system";
import { CssBaseline } from "@mui/material";

import { theme } from "./styles";
import { Home } from "./pages";

function App() {
  return (
    <>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Home />
      </ThemeProvider>
    </>
  );
}

export default App;
