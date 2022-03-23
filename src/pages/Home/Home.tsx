import React, { useCallback, useEffect, useState } from "react";
import {
  Button,
  Container,
  Grid,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { useFormik } from "formik";
import { format } from "date-fns";
import * as Yup from "yup";
import Editor from "@monaco-editor/react";
import ReactJson from "react-json-view";

import { IWebsocketMessage } from "./types";
import { verifyUrlIsValid } from "../../utils";

const Home = () => {
  const [connected, setConnected] = useState<boolean>(false);
  const [sendedMessages, setSendedMessages] = useState<IWebsocketMessage[]>(
    JSON.parse(localStorage.getItem("sendedMessages") ?? "[]")
  );
  const [receivedMessages, setReceivedMessages] = useState<IWebsocketMessage[]>(
    JSON.parse(localStorage.getItem("receivedMessages") ?? "[]")
  );
  const [message, setMessage] = useState<string>("");
  const [websocket, setWebsocket] = useState<WebSocket>();
  const formik = useFormik<{ url: string }>({
    initialValues: {
      url: localStorage.getItem("wsUrl") ?? "",
    },
    validateOnBlur: false,
    validateOnChange: false,
    onSubmit: (values) => {
      localStorage.setItem("wsUrl", values.url);
      setWebsocket(new WebSocket(values.url));
    },
    validationSchema: Yup.object().shape({
      url: Yup.string()
        .required("Campo obrigatório")
        .test("verifyUrl", "Esse campo precisa ser uma URL válida", (value) => {
          return !!value && verifyUrlIsValid(value);
        }),
    }),
  });

  const { getFieldProps } = formik;

  const handleSendMessage = useCallback(() => {
    setSendedMessages((prev) => [
      { createdAt: new Date().toISOString(), message },
      ...prev,
    ]);
    websocket?.send(message);
    setMessage("");
  }, [message, websocket]);

  useEffect(() => {
    if (websocket) {
      websocket.onopen = (ev) => {
        setConnected(true);
      };

      websocket.onclose = (ev) => {
        setConnected(false);
        setTimeout(() => {
          const wsUrl = localStorage.getItem("wsUrl");
          if (wsUrl) setWebsocket(new WebSocket(wsUrl));
        }, 3000);
      };

      websocket.onmessage = (ev) => {
        setReceivedMessages((prev) => [
          { createdAt: new Date().toISOString(), message: ev.data },
          ...prev,
        ]);
      };
    }
  }, [websocket]);

  useEffect(() => {
    localStorage.setItem(
      "sendedMessages",
      JSON.stringify(sendedMessages.slice(-50))
    );
  }, [sendedMessages]);

  useEffect(() => {
    const wsUrl = localStorage.getItem("wsUrl");
    if (wsUrl) setWebsocket(new WebSocket(wsUrl));
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "receivedMessages",
      JSON.stringify(receivedMessages.slice(-50))
    );
  }, [receivedMessages]);

  return (
    <Container maxWidth="lg" style={{ padding: "32px 16px" }}>
      <form style={{ display: "contents" }} onSubmit={formik.handleSubmit}>
        <Grid container spacing={2}>
          <Grid
            container
            item
            xs={12}
            spacing={1}
            justifyContent="flex-end"
            alignItems="center"
          >
            <Grid item>
              <Typography variant="h6">Status</Typography>
            </Grid>
            <Grid item>
              <Typography variant="h6" color={connected ? "green" : "red"}>
                {connected ? "Online" : "Offline"}
              </Typography>
            </Grid>
          </Grid>

          <Grid item xs={12} md={10}>
            <TextField
              label="Informe a URL de conexão websocket"
              fullWidth
              placeholder="ws://localhost:3000"
              size="small"
              {...getFieldProps("url")}
              error={!!formik.errors.url}
              helperText={formik.errors.url}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              disabled={!verifyUrlIsValid(formik.values.url ?? "")}
              variant="contained"
              color="primary"
              fullWidth
              type="submit"
            >
              Conectar
            </Button>
          </Grid>
          <Grid item xs={12} md={10}>
            <Editor
              height="20vh"
              defaultLanguage="json"
              theme="vs-dark"
              value={message}
              onChange={(value) => setMessage(value ?? "")}
              options={{ fontSize: 14, fontWeight: "500" }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              onClick={handleSendMessage}
              variant="contained"
              color="primary"
              fullWidth
              disabled={!verifyUrlIsValid(formik.values.url ?? "")}
            >
              Enviar
            </Button>
          </Grid>
          <Grid container spacing={2} item xs={12}>
            <Grid
              container
              spacing={2}
              item
              xs={12}
              md={6}
              alignContent="flex-start"
            >
              <Grid item xs={12} container spacing={2}>
                <Grid item>
                  <Typography variant="h6">Envios</Typography>
                </Grid>
                <Grid item>
                  <Button onClick={() => setSendedMessages([])}>Limpar</Button>
                </Grid>
              </Grid>
              <Grid item xs={12} container direction="column">
                {sendedMessages.map((sended, index) => (
                  <Paper
                    variant="outlined"
                    style={{ width: "100%", padding: 12, marginBottom: 12 }}
                    key={"sended-" + index}
                  >
                    <Typography color="gray" variant="caption">
                      {format(
                        new Date(sended.createdAt),
                        "dd/MM/yyyy HH:mm:ss"
                      )}
                    </Typography>
                    <ReactJson
                      src={JSON.parse(sended.message)}
                      theme="tomorrow"
                      iconStyle="square"
                      indentWidth={2}
                    />
                  </Paper>
                ))}
              </Grid>
            </Grid>
            <Grid container spacing={2} item xs={12} md={6}>
              <Grid item xs={12} container spacing={2}>
                <Grid item>
                  <Typography variant="h6">Respostas</Typography>
                </Grid>
                <Grid item>
                  <Button onClick={() => setReceivedMessages([])}>
                    Limpar
                  </Button>
                </Grid>
              </Grid>
              <Grid item xs={12} container direction="column">
                {receivedMessages.map((received, index) => (
                  <Paper
                    variant="outlined"
                    style={{ width: "100%", padding: 12, marginBottom: 12 }}
                    key={"received-" + index}
                  >
                    <Typography color="gray" variant="caption">
                      {format(
                        new Date(received.createdAt),
                        "dd/MM/yyyy HH:mm:ss"
                      )}
                    </Typography>
                    <ReactJson
                      src={JSON.parse(received.message)}
                      theme="tomorrow"
                      iconStyle="square"
                      indentWidth={2}
                    />
                  </Paper>
                ))}
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </form>
    </Container>
  );
};

export { Home };
