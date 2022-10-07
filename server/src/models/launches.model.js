const axios = require("axios");
const launches = require("./launches.mongo");
const planets = require("./planets.mongo");

const SPACEX_API_URL = "https://api.spacexdata.com/v4/launches/query";

async function findLaunch(filter) {
  return await launches.findOne(filter);
}

async function existsLaunchWithId(launchId) {
  return await findLaunch({
    flightNumber: launchId,
  });
}

async function populateLaunches() {
  const response = await axios.post(SPACEX_API_URL, {
    query: {},
    options: {
      pagination: false,
      populate: [
        {
          path: "rocket",
          select: {
            name: 1,
          },
        },
        {
          path: "payloads",
          select: {
            customers: 1,
          },
        },
      ],
    },
  });

  if (response.status !== 200) {
    console.log("Problem donwloadinh launch data !!!");
    throw new Error("Launch Data Download failed!");
  }

  const launchDocs = response.data.docs;

  for (const launchDoc of launchDocs) {
    const payloads = launchDoc["payloads"];

    const customers = payloads.flatMap((payload) => {
      return payload["customers"];
    });

    const launch = {
      flightNumber: launchDoc["flight_number"],
      mission: launchDoc["name"],
      rocket: launchDoc["rocket"]["name"],
      launchDate: launchDoc["date_local"],
      customers: customers,
      upcoming: launchDoc["upcoming"],
      success: launchDoc["success"],
    };

    await saveLaunch(launch);
  }
}

async function loadLaunchesData() {
  const firstLaunch = await findLaunch({
    flightNumber: 1,
    rocket: "Falcon 1",
    mission: "FalconSat",
  });

  if (firstLaunch) {
    console.log("Launch Data already loaded");
  } else {
    await populateLaunches();
  }
}

async function getAllLaunches(skip, limit) {
  return await launches
    .find({}, { _id: 0, __v: 0 })
    .sort({ flightNumber: 1 })
    .skip(skip)
    .limit(limit);
}

async function schedualeNewLaunch(launch) {
  console.log("start schedualeNewLaunch");
  const planet = await planets.findOne({ keplerName: launch.target }).exec();
  console.log(planet);
  if (!planet) {
    console.log("throw error");

    throw new Error("No matching planet was Found");
  }

  const dbFlightNumber = (await getlatestFlightNumber()) + 1;

  Object.assign(launch, {
    customers: ["HAMZA", "NASA"],
    upcoming: true,
    success: true,
    flightNumber: dbFlightNumber,
  });

  console.log("start check planets done");

  await saveLaunch(launch);

  console.log("finish schedualeNewLaunch");

  return launch;
}

async function saveLaunch(launch) {
  console.log("start saveLaunch");
  await launches.findOneAndUpdate(
    {
      flightNumber: launch.flightNumber,
    },
    launch,
    { upsert: true }
  );
  console.log("finish saveLaunch");
}

async function getlatestFlightNumber() {
  const latestLaunch = await launches.findOne().sort("-flightNumber");

  if (latestLaunch) {
    return latestLaunch.flightNumber;
  }

  return 100;
}

async function abortLaunchById(LaunchId) {
  const aborted = await launches.updateOne(
    {
      flightNumber: LaunchId,
    },
    {
      upcoming: false,
      seccess: false,
    }
  );

  return aborted.ok === 1, aborted.nModified === 1;
}

module.exports = {
  getAllLaunches,
  schedualeNewLaunch,
  abortLaunchById,
  existsLaunchWithId,
  loadLaunchesData,
};
