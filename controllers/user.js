const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("../services/jwt");
const User = require("../models/user");
// const salt = bcrypt.genSalt(10);
// var salt = bcrypt.genSaltSync(10);
var saltRounds = bcrypt.genSaltSync(10);

function signUp(req, res) {
  const user = new User();

  const { name, lastname, email, password, repeatPassword } = req.body;
  user.name = name;
  user.lastname = lastname;
  user.email = email.toLowerCase();
  user.role = "admin";
  user.active = false;

  if (!password || !repeatPassword) {
    res.status(404).send({
      message: "Las constraseñas son obligatorias",
    });
  } else {
    if (password !== repeatPassword) {
      res.status(404).send({
        message: "Las constraseñas deben de ser iguales",
      });
    } else {
      bcrypt.hash(password, 8, function (err, hash) {
        if (err) {
          res.status(500).send({
            message: "erro",
          });
        } else {
          user.password = hash;

          user.save((err, userStored) => {
            if (err) {
              res.status(500).send({
                message: "el usuario ya existe",
              });
            } else {
              if (!userStored) {
                res.status(404).send({
                  message: "error al crear usuario",
                });
              } else {
                res.status(200).send({
                  user: userStored,
                });
              }
            }
          });
        }
      });
    }
  }
}

function signIn(req, res) {
  const params = req.body;
  const email = params.email.toLowerCase();
  const password = params.password;

  User.findOne({ email }, (err, userStored) => {
    if (err) {
      res.status(500).send({ message: "Error del servidor" });
    } else {
      if (!userStored) {
        res.status(404).send({ message: "Usuario no encontrado." });
      } else {
        // console.log(userStored);
        bcrypt.compare(password, userStored.password, (err, check) => {
          if (err) {
            res.status(500).send({ message: "Error del servidor" });
          } else if (!check) {
            res.status(404).send({ message: "LA contraseña es incorrecta" });
          } else {
            if (!userStored.active) {
              res
                .status(200)
                .send({ code: 200, message: "El usuario no se ha activado" });
            } else {
              res.status(200).send({
                accessToken: jwt.createAccessToekn(userStored),
                refreshToken: jwt.createRefreshToken(userStored),
              });
            }
          }
        });
        // ---
      }
    }
  });
}

function getUsers(req, res) {
  User.find().then((users) => {
    if (!users) {
      res.status(404).send({ message: "no se ha encontrado ningun usuario" });
    } else {
      res.status(200).send({ users });
    }
  });
}

function getUsersActive(req, res) {
  console.log(req);

  const query = req.query;

  User.find({ active: query.active }).then((users) => {
    if (!users) {
      res.status(404).send({ message: "no se ha encontrado ningun usuario" });
    } else {
      res.status(200).send({ users });
    }
  });
}

function uploadAvatar(req, res) {
  const params = req.params;

  User.findById({ _id: params.id }, (err, userData) => {
    if (err) {
      res.status(500).send({ message: "Error del servidor." });
    } else {
      if (!userData) {
        res.status(404).send({ message: "No se encontro ningun usuario." });
      } else {
        let user = userData;

        if (req.files) {
          let filePath = req.files.avatar.path;
          let fileSplit = filePath.split("\\");
          // let fileSplit = filePath.split("/") : mac o linux
          let fileName = fileSplit[2];

          let extSplit = fileName.split(".");
          let fileExt = extSplit[1];

          if (fileExt !== "png" && fileExt !== "jpg") {
            res.status(400).send({
              message:
                " La extension de la imagen no es valida. (extensiones perimitidas: .png .jpg",
            });
          } else {
            user.avatar = fileName;
            User.findByIdAndUpdate(
              { _id: params.id },
              user,
              (err, userResult) => {
                if (err) {
                  res.status(500).send({ message: "Error del servidor." });
                } else {
                  if (!userResult) {
                    res
                      .status(404)
                      .send({ message: "No se encontro ningun usuario." });
                  } else {
                    res.status(200).send({ avatarName: fileName });
                  }
                }
              }
            );
          }
        }
      }
    }
  });
}

function getAvatar(req, res) {
  const avatarName = req.params.avatarName;
  const filePath = "./uploads/avatar/" + avatarName;

  fs.exists(filePath, (exists) => {
    if (!exists) {
      res.status(404).send({ message: "El valor que buscas no existe" });
    } else {
      res.sendFile(path.resolve(filePath));
    }
  });
}

async function updateUser(req, res) {
  let userData = req.body;
  userData.email = req.body.email.toLowerCase();
  const params = req.params;

  if (userData.password) {
    await bcrypt.hash(userData.password, null, null, (err, hash) => {
      // await bcrypt.hash(userData.password, 8,  (err, hash) => {
        // await bcrypt.hash(userData.password, saltRounds, (err, hash) => {
      //  bcrypt.hash(userData.password, 8, function (err, hash) {
      if (err) {
        res.status(500).send({ message: "Error al encriptar la contraseña." });
      } else {
        userData.password = hash;
      }
    });
  }

  User.findByIdAndUpdate({ _id: params.id }, userData, (err, userUpdate) => {
    if (err) {
      res.status(500).send({ message: "error del servidor" });
    } else {
      if (!userUpdate) {
        res.status(404).send({ message: "usuario no encontrado" });
      } else {
        res.status(200).send({ message: "usuario actualizado correctamente" });
      }
    }
  });
}



module.exports = {
  signUp,
  signIn,
  getUsers,
  getUsersActive,
  uploadAvatar,
  getAvatar,
  updateUser,
};
