const axios = require("axios");
var moment = require("moment-timezone");
var schedule = require("node-schedule");
var sk;
var l;
var k;

let url =
  "";

const qs = require("qs");

//Server is using EDT time zone. So, -4 from Malaysai GMT timezone.
//Running from 8:00 AM - 10:00 PM (GMT+8)
schedule.scheduleJob("*/2 0-14 * * *", async function () {
  const sebelum = moment()
    .subtract(60, "m")
    .tz("Asia/Kuala_Lumpur")
    .format("YYYY-MM-DD hh:00 A");
  const selepas = moment()
    .add(60, "m")
    .tz("Asia/Kuala_Lumpur")
    .format("YYYY-MM-DD hh:00 A");
  console.log(moment().tz("Asia/Kuala_Lumpur").format("YYYY-MM-DD hh:mm A"));
  console.log(sebelum);
  console.log(selepas);
  console.log(
    `{"conditions": ["time_update >= '${sebelum}'","time_update <= '${selepas}'", "cust_source <> 'Quotation'", "cust_source <> ''", "cust_source <> 'Paid'"], "tablename": "","orderBy": "","offset": 0,"limit": 50,"page": 0,"count": -1 }`
  );
  async function a() {
    await axios({
      method: "POST",
      url: "",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      data: qs.stringify({
        userName: "",
        password: "",
        queryObject: `{"conditions": ["time_update >= '${sebelum}'","time_update <= '${selepas}'", "cust_source <> 'Quotation'", "cust_source <> ''", "cust_source <> 'Paid'"], "tablename": "","orderBy": "","offset": 0,"limit": 50,"page": 0,"count": -1 }`,
      }),
    })
      .then(async function (response) {
        // handle success
        //   console.log(response.data);
        sk = JSON.parse(response.data.resultJSON);
        console.log(
          "Got " + sk.length + " sales order from " + sebelum + " to " + selepas
        );
        // console.log(sk);
        l = response.data.resultJSON;
        console.log(
          "---------------------------------------------------------------------"
        );
      })
      .catch(async function (err) {
        console.log(err);
      });
  }
  async function b() {
    if (sk) {
      for (s of sk) {
        var mPkid = s.mPkid;
        console.log(s.mPkid);
        console.log(s.mLastUpdate);
        var mTotalAmt = s.mTotalAmt;
        var mUserIdUpdate = s.mUserIdUpdate;
        var mEntityKey = s.mEntityKey;
        var mEntityName = s.mEntityName;
        var custSource = s.custSource;
        var mLocationId = s.mLocationId;
        var mCustSvcCtrId = s.mCustSvcCtrId;
        var mRemarks = s.mRemarks;
        var receiverHandphone = s.receiverHandphone;
        var receiverCity = s.receiverCity;
        var receiverState = s.receiverState;
        var receiverZip = s.receiverZip;
        var billingCity = s.billingCity;
        var cAdd1 = s.receiverAdd1;
        var cAdd2 = s.receiverAdd2;
        var cAdd3 = s.receiverAdd3;
        var salesId = s.salesId;
        await axios({
          method: "get",
          url: url + `?filter[soNumber]=${mPkid}`,
          // headers:{
          //     'Authorization':'Basic YWltYW46YWltYW4='
          // }
        }).then(async function (response) {
          // handle success
          // console.log(response.data);
          k = String(response.data.taskDb);
          //  console.log(k + "tengok");
          if (!k) {
            if (!k && custSource != "Troubleshoot") {
              await axios
                .post(
                  "https://hook",
                  {
                    mPkid: mPkid,
                    mTotalAmt: mTotalAmt,
                    mUserIdUpdate: mUserIdUpdate,
                    mEntityKey: mEntityKey,
                    mEntityName: mEntityName,
                    mLocationId: mLocationId,
                    mCustSvcCtrId: mCustSvcCtrId,
                    custSource: custSource,
                    mRemarks: mRemarks,
                    receiverHandphone: receiverHandphone,
                    receiverCity: receiverCity,
                    receiverZip: receiverZip,
                    receiverState: receiverState,
                    billingCity: billingCity,
                    cAdd1: cAdd1,
                    cAdd2: cAdd2,
                    cAdd3: cAdd3,
                    salesId: salesId,
                  }
                )
                .then(function (response) {
                  console.log(response.data);
                  console.log(mPkid + " added");
                  console.log(
                    "---------------------------------------------------------------------"
                  );
                })
                .catch(function (error) {
                  console.log(error);
                });
            } else {
              console.log(`Already in database. Please check`);
              console.log(
                "---------------------------------------------------------------------"
              );
            }
          } else {
            if (
              response.data.taskDb[0].taskType == "Web Purchase" &&
              response.data.taskDb.length < 2 &&
              custSource != "Troubleshoot"
            ) {
              await axios
                .post(
                  "https://hook",
                  {
                    mPkid: mPkid,
                    mTotalAmt: mTotalAmt,
                    mUserIdUpdate: mUserIdUpdate,
                    mEntityKey: mEntityKey,
                    mEntityName: mEntityName,
                    mLocationId: mLocationId,
                    mCustSvcCtrId: mCustSvcCtrId,
                    custSource: custSource,
                    mRemarks: mRemarks,
                    receiverHandphone: receiverHandphone,
                    receiverCity: receiverCity,
                    receiverZip: receiverZip,
                    receiverState: receiverState,
                    billingCity: billingCity,
                    cAdd1: cAdd1,
                    cAdd2: cAdd2,
                    cAdd3: cAdd3,
                    salesId: salesId,
                  }
                )
                .then(function (response) {
                  console.log(response.data);
                  console.log(mPkid + " added");
                  console.log(
                    "---------------------------------------------------------------------"
                  );
                })
                .catch(function (error) {
                  console.log(error);
                });
            }  else {
              console.log(`Already in database. Please check`);
              console.log(
                "---------------------------------------------------------------------"
              );
            }
          }
        });
      }
    } else {
      console.log(`"No new job from wavelet from ${sebelum} to ${selepas}"`);
      console.log(
        "---------------------------------------------------------------------"
      );
    }
  }

  await a();
  b();
});
