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
import * as Yup from "yup";

import { IWebsocketMessage } from "./types";
import { format } from "date-fns";

const Home = () => {
  const [connected, setConnected] = useState<boolean>(false);
  const [sendedMessages, setSendedMessages] = useState<IWebsocketMessage[]>([]);
  const [receivedMessages, setReceivedMessages] = useState<IWebsocketMessage[]>(
    []
  );
  const [message, setMessage] = useState<string>("");
  const [websocket, setWebsocket] = useState<WebSocket>();
  const formik = useFormik<{ url: string }>({
    initialValues: {
      url: "",
    },
    validateOnBlur: false,
    validateOnChange: false,
    onSubmit: (values) => {
      setWebsocket(new WebSocket(values.url));
    },
    validationSchema: Yup.object().shape({
      url: Yup.string()
        .required("Campo obrigatório")
        .test("verifyUrl", "Esse campo precisa ser uma URL válida", (value) => {
          return !!(
            value &&
            value.includes("://") &&
            (value.includes("http") ||
              value.includes("https") ||
              value.includes("ws") ||
              value.includes("wss"))
          );
        }),
    }),
  });

  const { getFieldProps } = formik;

  const getParsedMessage = (m: string) => {
    try {
      return JSON.stringify(JSON.parse(m), null, 2);
    } catch (err) {
      return m;
    }
  };

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
      };

      websocket.onmessage = (ev) => {
        setReceivedMessages((prev) => [
          { createdAt: new Date().toISOString(), message: ev.data },
          ...prev,
        ]);
      };
    }
  }, [websocket]);

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
            <Button variant="contained" color="primary" fullWidth type="submit">
              Conectar
            </Button>
          </Grid>
          <Grid item xs={12} md={10}>
            <TextField
              fullWidth
              multiline
              rows={4}
              placeholder='{ "foo": "bar" }'
              label="Informe o payload de envio"
              value={message}
              onChange={(ev) => setMessage(ev.target.value ?? "")}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              onClick={handleSendMessage}
              variant="contained"
              color="primary"
              fullWidth
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
              <Grid item xs={12}>
                <Typography variant="h6">Envios</Typography>
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
                    <pre>
                      <code>{getParsedMessage(sended.message)}</code>
                    </pre>
                  </Paper>
                ))}
              </Grid>
            </Grid>
            <Grid container spacing={2} item xs={12} md={6}>
              <Grid item xs={12}>
                <Typography variant="h6">Respostas</Typography>
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
                    <pre>
                      <code>{getParsedMessage(received.message)}</code>
                    </pre>
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
