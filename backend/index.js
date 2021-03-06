const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const fs = require("fs");
const cors = require("cors");
const uuid = require("uuid");
const _ = require("lodash");

app.use(cors());
app.use(bodyParser.json());

let state = null;
try {
  const fileContent = fs.readFileSync("./state.json", "utf8");
  state = JSON.parse(fileContent);
} catch (err) {
  if (err.code === "ENOENT") {
    //File does not exists
    console.log("File ./state.json does not exist. Creating it...");
    let fd = fs.openSync("./state.json", "a+", 384);
    state = {};
    saveState(state, err => {
      if (err !== null) {
        console.log("Could not save state to file. Exiting");
        return;
      }
    });
  }
}

if (!state.questions) {
  state.questions = {};
}

if (!state.users) {
  state.users = {};
}

if (!state.answers) {
  state.answers = {};
}

app.get("/", (req, res) => {
  res.send("Hello World!");
});

const getUserFromReq = req => {
  return state.users[req.get("Authorization")];
};

const setAppMode = appMode => {
  state.appMode = appMode;
};

app.post("/answers", (req, res) => {
  if (state.appMode === APP_MODE_DONE) {
    res.status(403).json({ msg: "App in done mode, cannot post new answers" });
    return;
  }

  let body = req.body;
  let user = getUserFromReq(req);
  let questionId = body.id;

  if (user && questionId && state.questions[questionId] && body.answer) {
    question = state.answers[questionId] || {};
    question[user.id] = body.answer;

    state.answers[questionId] = question;

    saveState(state, function(err) {
      if (err) {
        res.status(404).send("Answer not saved");
        return;
      }
      res.json({ msg: "Answer saved" });
    });
  } else {
    res.status(400).json({ msg: "Invalid request" });
  }
});

const APP_MODE_NORMAL = "NORMAL";
const APP_MODE_DONE = "DONE";

app.post("/admin", (req, res) => {
  //const user = getUserFromReq(req);
  const body = req.body;
  console.log(req.body.appMode);
  if (req.get("Authorization") === "7D33C5433A54") {
    if (body.appMode === APP_MODE_NORMAL || body.appMode === APP_MODE_DONE) {
      setAppMode(body.appMode);
      res.json({ msg: "Success" });
    } else {
      res.status(400).json({ msg: "Bad app mode" });
    }
  } else {
    res.status(401).json({ msg: "Nu la du näsan i blôt." });
  }
});

app.get("/appmode", (req, res) => {
  res.json({ appMode: state.appMode });
});

app.get("/me", (req, res) => {
  const user = getUserFromReq(req);
  console.log("Trying to login", user, req.get("Authorization"));
  if (user) {
    console.log("Success");
    res.json(user);
  } else {
    res.status(401);
  }
});

app.get("/answers", (req, res) => {
  let answers = _.mapValues(state.answers, question => {
    let newQ = {};
    Object.keys(question).forEach(k => {
      newQ[state.users[k].nick] = question[k];
    });
    return newQ;
  });

  res.json(answers);
});

app.post("/users", (req, res) => {
  console.log("POST", req.body);
  let body = req.body;

  if (body.nick) {
    if (
      Object.values(state.users).filter(u => u.nick === body.nick).length > 0 &&
      body.id
    ) {
      res.status(400).json({ msg: "Det finns redan en tjomme som nickar så" });
      return;
    } else {
      const id = body.id;
      user = { nick: body.nick, id: id };

      state.users[id] = user;

      saveState(state, function(err) {
        if (err) {
          res.status(404).json({ msg: "Nu blev det änna fel nånstans" });
          return;
        }
        res.json(user);
      });
    }
  } else {
    res.status(400).json({ msg: "É du go, eller? Du måste la ha ett nick?" });
  }
});

app.get("/users", (req, res) => {
  res.json(Object.values(state.users).map(u => ({ nick: u.nick })));
});

app.get("/questions", (req, res) => {
  console.log("Someone is fetching questions");
  res.json(Object.values(state.questions));
});

app.post("/questions", (req, res) => {
  console.log("Posting question: ");
  let body = req.body;
  let user = getUserFromReq(req);
  console.log("questions", user, body);

  if (state.appMode === APP_MODE_DONE) {
    res
      .status(403)
      .json({ msg: "App in done mode, cannot post new questions" });
    return;
  }

  if (
    user &&
    body.question &&
    body.alternatives.length === 3 &&
    body.alternatives.every(x => x !== "")
  ) {
    id = uuid.v4();
    body.id = id;
    body.author = user.nick;
    state.questions[id] = body;

    saveState(state, function(err) {
      if (err) {
        res.status(404).send("Question not saved");
        return;
      }

      res.json({ msg: "Question saved" });
    });
  } else {
    res.status(400).json({ msg: "Invalid question format" });
  }
});

app.patch("/questions", (req, res) => {
  console.log("Patching question: ");
  let body = req.body;
  let user = getUserFromReq(req);

  if (state.appMode === APP_MODE_DONE) {
    res.status(403).json({ msg: "App in done mode, cannot update questions" });
    return;
  }

  if (
    user &&
    body.question &&
    body.alternatives.length === 3 &&
    body.alternatives.every(x => x !== "")
  ) {
    id = body.id;
    console.log(state.questions[id]);
    state.questions[id] = body;

    saveState(state, err => {
      if (err) {
        res.status(404).send("Question not saved");
        return;
      }

      res.json({ msg: "Question saved" });
    });
  } else {
    res.status(400).json({ msg: "Invalid question format" });
  }
});

app.listen(3001, function() {
  console.log("App listening on port 3001!");
});

function saveState(state, callback) {
  fs.writeFile("./state.json", JSON.stringify(state), callback);
}
