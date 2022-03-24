import React, { useCallback, useEffect, useState } from "react";
import {
  Button,
  Container,
  Grid,
  IconButton,
  Paper,
  TextField,
  Typography,
  Tooltip,
  FormControlLabel,
  Switch,
  Chip,
} from "@mui/material";
import {
  Delete as DeleteIcon,
  Replay as ReplayIcon,
  ContentCopy as ContentCopyIcon,
} from "@mui/icons-material";
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
  const [autoReconnect, setAutoReconnect] = useState<boolean>(
    JSON.parse(localStorage.getItem("reconnect") ?? "false")
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

  const handleSendMessage = useCallback(
    (msg: string) => {
      setSendedMessages((prev) => [
        { createdAt: new Date().toISOString(), message: msg },
        ...prev,
      ]);
      websocket?.send(msg);
      setMessage("");
    },
    [websocket]
  );

  useEffect(() => {
    const onOpen = () => {
      setConnected(true);
    };
    const onClose = () => {
      setConnected(false);
      if (autoReconnect) {
        setTimeout(() => {
          const wsUrl = localStorage.getItem("wsUrl");
          if (wsUrl) setWebsocket(new WebSocket(wsUrl));
        }, 3000);
      }
    };
    const onMessage = (ev: MessageEvent<any>) => {
      setReceivedMessages((prev) => [
        { createdAt: new Date().toISOString(), message: ev.data },
        ...prev,
      ]);
    };

    const url = localStorage.getItem("wsUrl");
    if (autoReconnect && !websocket && url) {
      setWebsocket(new WebSocket(url));
    }

    if (websocket) {
      websocket.onopen = onOpen;
      websocket.onclose = onClose;
      websocket.onmessage = onMessage;
    }

    return () => {
      websocket?.removeEventListener("open", onOpen);
      websocket?.removeEventListener("close", onClose);
      websocket?.removeEventListener("message", onMessage);
    };
  }, [websocket, autoReconnect]);

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

  useEffect(() => {
    localStorage.setItem("reconnect", JSON.stringify(autoReconnect));
  }, [autoReconnect]);

  return (
    <Container maxWidth="lg" style={{ padding: "32px 16px" }}>
      <form style={{ display: "contents" }} onSubmit={formik.handleSubmit}>
        <Grid container spacing={2} justifyContent="space-between">
          <Grid item>
            <Chip
              label={connected ? "Online" : "Offline"}
              color={connected ? "success" : "error"}
            ></Chip>
          </Grid>

          <Grid item>
            <FormControlLabel
              control={
                <Switch
                  checked={autoReconnect}
                  onChange={(_, checked) => setAutoReconnect(checked)}
                />
              }
              label="Reconectar automaticamente"
            />
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
              onClick={() => handleSendMessage(message)}
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
                    <Grid container spacing={2}>
                      <Grid item xs={12} spacing={2} container>
                        <Grid item xs={8}>
                          <Typography color="gray" variant="caption">
                            {format(
                              new Date(sended.createdAt),
                              "dd/MM/yyyy HH:mm:ss"
                            )}
                          </Typography>
                        </Grid>
                        <Grid
                          item
                          xs={4}
                          container
                          spacing={2}
                          justifyContent="flex-end"
                        >
                          <Grid item>
                            <Tooltip title="Mandar essa mensagem para a área de texto">
                              <IconButton
                                size="small"
                                onClick={() => setMessage(sended.message)}
                              >
                                <ContentCopyIcon />
                              </IconButton>
                            </Tooltip>
                          </Grid>
                          <Grid item>
                            <Tooltip title="Re-enviar esta mensagem">
                              <IconButton
                                size="small"
                                onClick={() =>
                                  handleSendMessage(sended.message)
                                }
                              >
                                <ReplayIcon />
                              </IconButton>
                            </Tooltip>
                          </Grid>
                          <Grid item>
                            <Tooltip title="Apagar esta mensagem">
                              <IconButton
                                size="small"
                                onClick={() =>
                                  setSendedMessages((prev) =>
                                    prev.filter((p) => p !== sended)
                                  )
                                }
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </Grid>
                        </Grid>
                      </Grid>
                      <Grid item xs={12}>
                        <ReactJson
                          src={JSON.parse(sended.message)}
                          theme="tomorrow"
                          iconStyle="square"
                          indentWidth={2}
                        />
                      </Grid>
                    </Grid>
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
                    <Grid container spacing={2}>
                      <Grid item xs={12} spacing={2} container>
                        <Grid item xs={8}>
                          <Typography color="gray" variant="caption">
                            {format(
                              new Date(received.createdAt),
                              "dd/MM/yyyy HH:mm:ss"
                            )}
                          </Typography>
                        </Grid>
                        <Grid
                          item
                          xs={4}
                          container
                          spacing={2}
                          justifyContent="flex-end"
                        >
                          <Grid item>
                            <Tooltip
                              title="Apagar esta mensagem"
                              onClick={() =>
                                setReceivedMessages((prev) =>
                                  prev.filter((p) => p !== received)
                                )
                              }
                            >
                              <IconButton size="small">
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </Grid>
                        </Grid>
                      </Grid>
                      <Grid item xs={12}>
                        <ReactJson
                          src={JSON.parse(received.message)}
                          theme="tomorrow"
                          iconStyle="square"
                          indentWidth={2}
                        />
                      </Grid>
                    </Grid>
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
