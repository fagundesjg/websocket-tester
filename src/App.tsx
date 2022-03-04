import React from "react";
import { ThemeProvider } from "@mui/system";

import { theme } from "./styles";
import { Home } from "./pages";
import { CssBaseline } from "@mui/material";

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
