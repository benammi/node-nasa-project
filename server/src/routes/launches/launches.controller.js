const {
  getAllLaunches,
  schedualeNewLaunch,
  abortLaunchById,
  existsLaunchWithId,
} = require("../../models/launches.model");

const { getPagination } = require("../../services/query");

async function httpGetAllLaunches(req, res) {
  const { skip, limit } = getPagination(req.query);
  const launches = await getAllLaunches(skip, limit);
  return res.status(200).json(launches);
}

async function httpAddNewLaunch(req, res) {
  
  const launch = req.body;
  if (
    !launch.mission ||
    !launch.launchDate ||
    !launch.rocket ||
    !launch.target
  ) {
    return res.status(400).json({
      error: "missing required data!!!",
    });
  }
  launch.launchDate = new Date(launch.launchDate);
  if (isNaN(launch.launchDate)) {
    return res.status(400).json({
      error: "invalide launch date!!!",
    });
  }

  await schedualeNewLaunch(launch);
  return res.status(201).json(launch);
}

async function httpAbortLaunch(req, res) {
  const launchId = Number(req.params.id);
  if (launchId) {
    const exist = await existsLaunchWithId(launchId);
    if (!exist) {
      return res.status(400).json({
        error: "launch doesn't exist!!!",
      });
    }
    const aborted = abortLaunchById(launchId);
    if (!aborted) {
      return res.status(400).json({
        err: "not aborted",
      });
    }
    return res.status(200).json({
      err: "aborted",
    });
  } else {
    return res.status(404).json({
      error: "invalide launch ID!!!",
    });
  }
}

module.exports = {
  httpGetAllLaunches,
  httpAddNewLaunch,
  httpAbortLaunch,
};
