const express = require("express");

const { open } = require("sqlite");

const sqlite3 = require("sqlite3");

const path = require("path");

const bcrypt = require("bcrypt");

const databasePath = path.join(__dirname, "userData.db");

const app = express();

app.use(express.json());

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({ filename: databasePath, driver: sqlite3.Database });

    app.listen(3000, () =>
      console.log("server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

// API - 1 //

app.post("/register", async (request, response) => {
  let { username, name, password, gender, location } = request.body; //Destructuring the data from the API call
  let hashedPassword = await bcrypt.hash(password, 10); //Hashing the given password
  let checkTheUsername = `
            SELECT *
            FROM user
            WHERE username = '${username}';`;
  let userData = await db.get(checkTheUsername); //Getting the user details from the database
  if (userData === undefined) {
    //checks the condition if user is already registered or not in the database
    /*If userData is not present in the database then this condition executes*/
    let postNewUserQuery = `
            INSERT INTO
            user (username,name,password,gender,location)
            VALUES (
                '${username}',
                '${name}',
                '${hashedPassword}',
                '${gender}',
                '${location}'
            );`;
    if (password.length < 5) {
      //checking the length of the password
      response.status(400);
      response.send("Password is too short");
    } else {
      /*If password length is greater than 5 then this block will execute*/
      let newUserDetails = await db.run(postNewUserQuery); //Updating data to the database
      response.status(200);
      response.send("User created successfully");
    }
  } else {
    /*If the userData is already registered in the database then this block will execute*/
    response.status(400);
    response.send("User already exists");
  }
});

// API - 2 //
app.post("/login", async (request, response) => {
  const { username, password } = request.body;

  const selectUserQuery = `select * from user where username = '${username}'`;

  const dbUser = await db.get(selectUserQuery);

  if (dbUser === undefined) {
    response.status(400);

    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);

    if (isPasswordMatched === true) {
      response.send("Login success!");
    } else {
      response.status(400);

      response.send("Invalid password");
    }
  }
});

// API - 3 //

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;

  const checkForUserQuery = `select * from user where username = '${username}'`;

  const dbUser = await db.get(checkForUserQuery);

  if (dbUser === undefined) {
    response.status(400);

    response.send("User not registered");
  } else {
    const isValidPassword = await bcrypt.compare(oldPassword, dbUser.password);

    if (isValidPassword === true) {
      const lengthOfNewPassword = newPassword.length;

      if (lengthOfNewPassword < 5) {
        response.status(400);

        response.send("Password is too short");
      } else {
        const encryptedPassword = await bcrypt.hash(newPassword, 10);

        const updatePasswordQuery = `update user set password = '${encryptedPassword}' where username = '${username}'`;

        await db.run(updatePasswordQuery);

        response.send("Password updated");
      }
    } else {
      response.status(400);

      response.send("Invalid current password");
    }
  }
});

module.exports = app;
