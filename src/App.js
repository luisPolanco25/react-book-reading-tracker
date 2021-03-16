import * as rs from 'reactstrap';

import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import * as store from './app/store.js';

function App() {
  return <ConnectedMain/>
}

const connectWithToken = fn => connect((state) => {return {token: state.token}})(fn);
const connectWithData = fn => connect((state) => {return {data: state.data}})(fn);

const ConnectedMain = connectWithToken(Main);

const setData = (dispatch, data) => {
  dispatch({
    type: store.TYPE_UPDATE_DATA,
    data: data
  });
}

function Main({token}) {

  return (
    <rs.Container>
      <ConnectedFormLogin/>
      {token && (
        <>
        <ConnectedFormAddEntry/>
        <ConnectedPastEntries/>
        </>
      )}
    </rs.Container>
  );
}

function useInput(placeholder) {
  const [value, setValue] = useState("")
  return [
    <rs.Input placeholder={placeholder} value={value} onChange={(e) => setValue(e.target.value)}/>,
    value,
    setValue,
  ]
}

const ConnectedFormAddEntry = connectWithData(connectWithToken(FormAddEntry));

function FormAddEntry({token, data, dispatch}) {

  const [livroInput, livroValue, setLivroValue] = useInput("Livro");
  const [inicioHorarioInput, inicioHorarioValue, setInicioHorarioValue] = useInput("Horário");
  const [inicioPaginaInput, inicioPaginaValue, setInicioPaginaValue] = useInput("Página");
  const [fimHorarioInput, fimHorarioValue, setFimHorarioValue] = useInput("Horário");
  const [fimPaginaInput, fimPaginaValue, setFimPaginaValue] = useInput("Página");

  const handleSubmit = (e) => {
    const entry = {
      book_id: livroValue,
      start_time: inicioHorarioValue,
      end_time: fimHorarioValue,
      start_location: parseInt(inicioPaginaValue, 10) || null,
      end_location: parseInt(fimPaginaValue, 10) || null
    }
    addEntry(token, entry, data, dispatch);

    setLivroValue("");
    setInicioHorarioValue("");
    setInicioPaginaValue("");
    setFimHorarioValue("");
    setFimPaginaValue("");

    e.preventDefault();
  };

  return (
    <rs.Form onSubmit={handleSubmit}>

      <rs.Card>
        <rs.CardBody>

          <rs.Row>
            <rs.Col sm={12}>
                {livroInput}
            </rs.Col>
          </rs.Row>

          <rs.Badge color="warning">Início</rs.Badge>

          <rs.Row>
            <rs.Col sm={6}>
              {inicioHorarioInput}
            </rs.Col>
            <rs.Col sm={6}>
              {inicioPaginaInput}
            </rs.Col>
          </rs.Row>


          <rs.Badge color="warning">Fim</rs.Badge>

          <rs.Row>
            <rs.Col sm={6}>
              {fimHorarioInput}
            </rs.Col>
            <rs.Col sm={6}>
              {fimPaginaInput}
            </rs.Col>
          </rs.Row>

          <rs.Button>Adicionar</rs.Button>

        </rs.CardBody>
      </rs.Card>

    </rs.Form>
  )
}

const ENTRIES_ENDPOINT = "https://ikhizussk2.execute-api.us-east-1.amazonaws.com/dev/entries";

const ConnectedPastEntries = connectWithData(connectWithToken(PastEntries));

function PastEntries({token, data, dispatch}) {

  const [shouldFetch, setShouldFetch] = useState(true);

  useEffect(() => {
    if (token) {
      if (!shouldFetch) {
        return;
      }
      setShouldFetch(false);
      fetchEntries(token, data, dispatch);
    }
  }, [token, data, shouldFetch, setShouldFetch, dispatch]);

  return (
    <>
    <rs.Table>
      <thead>
        <tr>
          <th>Livro</th>
          <th>Hora Início</th>
          <th>Hora Fim</th>
          <th>Pág. Início</th>
          <th>Pág. Fim</th>
          <th>Operações</th>
        </tr>
      </thead>
      {(data && data.length && (
        <tbody>
          {data.map(i => (
            <ConnectedEntry
              token={token}
              entry={i}
              key={i.id}
            />
          ))}
        </tbody>
      )) || (<tbody></tbody>)}
      </rs.Table>
    </>
  );

}

const ConnectedEntry = connectWithData(Entry);

function Entry({token, entry, data, dispatch}) {

  const handleClick = (e, id) => {
    if (id) {
      deleteEntry(token, id, data, dispatch);
    };
    e.preventDefault();
  };

  return (
    <tr>
      <td>{entry.book_id}</td>
      <td>{entry.start_time}</td>
      <td>{entry.end_time}</td>
      <td>{entry.start_location}</td>
      <td>{entry.end_location}</td>
      <td><rs.Button color="light" onClick={(e) => handleClick(e, entry.id)}>🗑️</rs.Button></td>
    </tr>
  );
}

export default App;

function addEntry(token, entry, data, dispatch) {

    const headers = new Headers();
    headers.append("Authorization", "Bearer " + token);

    const body = JSON.stringify(entry);

    const req = new Request(ENTRIES_ENDPOINT, {
      method: "POST",
      headers: headers,
      body: body
    }); 

  const onSuccess = d => {
    if (d.success) {
      const newData = [...data];
      entry.id = d.id;
      newData.push(entry);
      setData(dispatch, newData);
    }
  };

  fetch(req).then(resp => resp.json().then(d => onSuccess(d)));
}

function fetchEntries(token, data, dispatch) {

  const headers = new Headers();
  headers.append("Authorization", "Bearer " + token);

  const req = new Request(ENTRIES_ENDPOINT, {
    headers: headers
  }); 

  fetch(req).then(resp => resp.json().then(d => setData(dispatch, d)));
}

function deleteEntry(token, id, data, dispatch) {

  const headers = new Headers();
  headers.append("Authorization", "Bearer " + token);

  const req = new Request(ENTRIES_ENDPOINT + "/" + id, {
    method: "DELETE",
    headers: headers
  }); 

  const onSuccess = d => {
    if (d.success) {
      const newData = data.filter(i => i.id !== id);
      setData(dispatch, newData);
    }
  };

  fetch(req).then(resp => resp.json().then(d => onSuccess(d)));
}

const ConnectedFormLogin = connectWithToken(FormLogin);

const updateToken = token => {
  return {
    type: store.TYPE_UPDATE_TOKEN,
    token: token
  }
}

function FormLogin({token, dispatch}) {

  const [usernameInput, usernameValue, setUsernameValue] = useInput("Usuário");
  const [passwordInput, passwordValue, setPasswordValue] = useInput("Senha");

  const handleSubmit = (e) => {

    getToken(usernameValue, passwordValue).then(token => {
      dispatch(updateToken(token))
    });

    setUsernameValue("");
    setPasswordValue("");

    e.preventDefault();
  };

  if (!token) {
  return (
    <rs.Form onSubmit={handleSubmit}>

      <rs.Row>
        <rs.Col sm={5}>
          {usernameInput}
        </rs.Col>
        <rs.Col sm={5}>
          {passwordInput}
        </rs.Col>
        <rs.Col sm={2}>
          <rs.Button>Login</rs.Button>
        </rs.Col>
      </rs.Row>

    </rs.Form>
  );
  } else {

  return (
    <rs.Form onSubmit={handleSubmit}>

      <rs.Row>
        <rs.Col sm={12}>
          <rs.Button onClick={() => dispatch(updateToken("")) }>Logout</rs.Button>
        </rs.Col>
      </rs.Row>

    </rs.Form>
  );
  }
}

const LOGIN_ENDPOINT = "https://ikhizussk2.execute-api.us-east-1.amazonaws.com/dev/login";

async function getToken(username, password) {
  const resp = await fetch(LOGIN_ENDPOINT, {
    method: "POST",
    body: JSON.stringify({
      "username": username,
      "password": password
    }),
  });

  const data = await resp.json()
  return data.token
}
