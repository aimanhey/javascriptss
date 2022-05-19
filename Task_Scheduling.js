#!/usr/bin/env node

const axios = require("axios");
var moment = require("moment-timezone");
let url =
  "";
console.log(moment().tz("Asia/Kuala_Lumpur").format("YYYY-MM-DD hh:mm A"));
const qs = require("qs");
const sebelum = moment().tz("Asia/Kuala_Lumpur").format("2021-03-05 08:00 PM");
const selepas = moment().tz("Asia/Kuala_Lumpur").format("2021-03-05 08:59 PM");
let incrementGlobal;
var schedule = require("node-schedule");
var increments;
var modulus;
var job;
var tech;
var mysql = require("mysql");
const fs = require("fs");
const util = require("util");
var readFile = util.promisify(fs.readFile);
var writeFile = util.promisify(fs.writeFile);
const { deflateRaw } = require("zlib");
var b = () => {};

let rule = new schedule.RecurrenceRule();

rule.minute = [0, new schedule.Range(0, 59)];
rule.hour = [0, new schedule.Range(9, 22)];
//rule.hour=9-12
rule.tz = "Asia/Kuala_Lumpur";
var sy;

schedule.scheduleJob("*/2 1-13 * * *", async function () {
  //Database SQL Connection
  var con = mysql.createConnection({
    host: "",
    user: "",
    port: 3306,
    password: "",
    database: "",
  });

  //Read Incremental value
  async function readIncrement() {
    return readFile("increment.txt");
  }

  //First Step
  async function step1() {
    var tasks;
    var websitePurchaseCheck;
    //Call all open job in Task Database
    await axios({
      method: "get",
      url: url + `?filter[status]=Open`,
    }).then(async function (responsess) {
      tasks = responsess.data.taskDb;
    }).catch(async (err)=>{
      console.log(err.response.status);
      console.log(err.response.data);
    });
    //Loop for every open job in Task Database
    if (tasks.length !== 0) {
      console.log(
        "---------------------------------------------------------------------------------------------------------------------------------------------"
      );
      console.log(tasks.length);
      for (task of tasks) {
        if (
          task.taskType != "Walkin" &&
          task.taskType != "Walk-in" &&
          task.taskType != "Pickup" &&
          task.taskType != "Goods Receipt" &&
          task.taskType != "Wrapping" &&
          task.taskType != "Troubleshoot On-Site" &&
          task.taskType != "Daily Stock Count" &&
          task.taskType != "Warranty" &&
          task.taskType != "Web Purchase" &&
          task.taskType != "Weekly Stock Count" &&
          task.taskType != "Shopee Purchase"
        ) {
          console.log(
            "--------//-----//-------//---------//--------//-------//-------//--------//-------"
          );
          console.log(task.taskType, task.branch, task.soNumber);

          await axios({
            method: "get",
            url:
              url +
              `?filter[taskType]=Web%20Purchase&filter[soNumber]=${task.soNumber}`,
          }).then(async function (responsess) {
            websitePurchaseCheck = responsess.data.taskDb;
            console.log("/// TEST ///");
            if (websitePurchaseCheck[0]) {
              console.log("Website Purchase");
              console.log(websitePurchaseCheck[0].soNumber);
              console.log(websitePurchaseCheck[0].status);
            } else {
              console.log(!websitePurchaseCheck[0]);
            }
          }).catch(async (err)=>{
            console.log(err.response.status);
            console.log(err.response.data);
          });

          //Filter Job
          if (
            (task.taskType != "Installation" &&
              task.taskType != "Upgrade" &&
              !websitePurchaseCheck[0]) ||
            (task.taskType != "Installation" &&
              task.taskType != "Upgrade" &&
              websitePurchaseCheck[0] &&
              websitePurchaseCheck[0].status == "Completed")
          ) {
            var result;
            console.log(task);
            var holdtask = task;
            //call Step 2
            //     if(task.taskType!="Online Support"){
            branchh = task.branch;
            //   }else
            //    {
            //   branchh = "BANGI";
            //    }
            await step2(task.taskType, branchh, task).then(async (data) => {
              readIncrement = data;
              console.log(readIncrement);
              console.log("akhir");
              console.log(incrementGlobal);
              result = data;
            });
            if (!result) {
              console.log("tak ada");
              incrementGlobal++;
              
              if (incrementGlobal) {
                console.log("Isi file 1")
                await writeFile(
                  "increment.txt",
                  String(incrementGlobal),
                  function (err, isi) {
                    console.log("Saved!");
                    console.log("------------------------------");
                    if (err) throw err;
                    else if(isi){
                      console.log(isi);
                    }
                  }
                );
              }
              
            } else {
              console.log("masuk tak?");
              //Assign Job into Integromat
              async function sendData() {
                await axios
                  .post(
                    "https://hook",
                    {
                      technician: result,
                      SO: holdtask,
                    }
                  )
                  .then(async function (response) {
                    console.log(response.data);
                    console.log("masuk!");
                  })
                  .catch(async function (error) {
                    console.log(error);
                  });
              }
              await sendData();
              incrementGlobal++;

              if (incrementGlobal) {
                console.log("Isi file 2")
                await writeFile(
                  "increment.txt",
                  String(incrementGlobal),
                  function (err, isi) {
                    if (err) throw err;
                    console.log("Saved!");
                    console.log("------------------------------");
                  }
                );
              }
            }
          } else if (
            task.taskType == "Installation" ||
            task.taskType == "Upgrade"
          ) {
            var taskProduct;
            await axios({
              method: "get",
              url:
                url +
                `?filter[status]=Completed&filter[taskType]=Product%20Preparation&filter[soNumber]=${task.soNumber}`,
            }).then(async function (responsess) {
              taskProduct = JSON.stringify(responsess.data.taskDb);
              console.log("Product Preparation")
              console.log(taskProduct)
            });
            if (taskProduct != "[]") {
              var resultTech;
              console.log(task);
              var holdtaskTech = task;
              //call Step 2
              await step2(task.taskType, task.branch, task).then(
                async (data) => {
                  readIncrement = data;
                  console.log(readIncrement);
                  console.log("akhir");

                  resultTech = data;
                }
              );
              if (!resultTech) {
                console.log("tak ada");
                incrementGlobal++;

                if (incrementGlobal) {
                  await writeFile(
                    "increment.txt",
                    String(incrementGlobal),
                    function (err, isi) {
                      if (err) throw err;
                      console.log("Saved!");
                      console.log("------------------------------");
                    }
                  );
                }
              } else {
                console.log("masuk tak?");
                //Assign Job into Integromat
                async function sendData() {
                  await axios
                    .post(
                      "https://hook",
                      {
                        technician: resultTech,
                        SO: holdtaskTech,
                      }
                    )
                    .then(async function (response) {
                      console.log(response.data);
                    })
                    .catch(async function (error) {
                      console.log(error);
                      console.log(error);
                    });
                }
                await sendData();
                incrementGlobal++;

                if (incrementGlobal) {
                  await writeFile(
                    "increment.txt",
                    String(incrementGlobal),
                    function (err, isi) {
                      if (err) throw err;
                      console.log("Saved!");
                      console.log("------------------------------");
                    }
                  );
                }
              }
            } else {
              incrementGlobal++;

              if (incrementGlobal) {
                await writeFile(
                  "increment.txt",
                  String(incrementGlobal),
                  function (err, isi) {
                    if (err) throw err;
                    console.log("Saved!");
                    console.log("------------------------------");
                  }
                );
              }
            }
          }
        }
      }
      con.end();
    } else {
      console.log("No Open Task");
      con.end();
    }
  }

  //Step 2
  async function step2(task, branch, taskDetail) {
    var stringIncrement;
    var max;
    var pic;
    //Call Increment
    try {
      var increment;
      await readFile("increment.txt").then((data) => {
        incrementGlobal = data;
        increment = data;
      });
      console.log("Increment: " + increment);
    } catch (err) {
      increment = 0;
      incrementGlobal = 0;
    }
    //Call maximum
    await cariMaximum(branch, task).then((data) => {
      max = data[0].AYAM;
    });
    console.log("maximum: " + max);
    modulus = (increment % max) +1;
    console.log("modulus: " + modulus);
    if (!modulus) {
      modulus = 1;
    }

    //Call PIC
    await PIC(task, branch, modulus).then((data) => {
      pic = data[0];
    });
    return pic;
  }

  //Cari maximum
  async function cariMaximum(branch, task) {
    return new Promise((resolve, reject) => {
      con.query(
        `SELECT
      Count(modulus) AS AYAM
    FROM
      autoAssign
    WHERE
      current_branch = "${branch}" AND skill LIKE '%${task}%'`,
        (err, result) => {
          console.log(result);
          return resolve(result);
        }
      );
    });
  }

  //Cari PIC
  async function PIC(task, branch, modulus) {
    console.log(task);
    return new Promise((resolve, reject) => {
      con.query(
        `SELECT
            *
        FROM
            autoAssign
        WHERE
            current_branch='${branch}' AND modulus='${modulus}' AND skill LIKE '%${task}%'`,
        (err, result) => {
          console.log(`SELECT
          *
      FROM
          autoAssign
      WHERE
          current_branch='${branch}'  AND modulus='${modulus}' AND skill LIKE '%${task}%'`)
          if (result) {

            console.log("pe tahh")
            console.log(result)
            /*
            if(result.length>1){
              console.log(result[modulus])
              return resolve([result[modulus]]);
            }
            else{*/
              return resolve(result);
           // }
          }
          else if (err) {
            throw err;
          }
          else{
            return resolve(result);
          }
         
        }
      );
    });
  }

  step1();
});
