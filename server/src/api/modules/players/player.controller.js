const jobs = require('../../jobs');
const service = require('./player.service');

async function get(req, res, next) {
  try {
    const { id, username } = req.query;

    const player = username ? await service.getData(username) : await service.getDataById(id);
    res.json(player);
  } catch (e) {
    next(e);
  }
}

async function search(req, res, next) {
  try {
    const { username } = req.query;

    const player = await service.search(username);
    res.json(player);
  } catch (e) {
    next(e);
  }
}

async function track(req, res, next) {
  try {
    const { username } = req.body;

    // Update the player, by creating a new snapshot
    const player = await service.update(username);

    // Run secondary jobs
    jobs.add('ConfirmPlayerType', { player });
    jobs.add('ImportPlayer', { player });

    // Send the http response back
    res.status(200).json(player);
  } catch (e) {
    next(e);
  }
}

async function assertType(req, res, next) {
  try {
    const { username } = req.body;

    const type = await service.assertType(username, true);
    res.status(200).json({ type });
  } catch (e) {
    next(e);
  }
}

async function importPlayer(req, res, next) {
  try {
    const { username } = req.body;

    const history = await service.importCML(username);
    const message = `${history.length} snapshots imported from CML`;

    res.status(200).json({ message });
  } catch (e) {
    next(e);
  }
}

exports.get = get;
exports.search = search;
exports.track = track;
exports.assertType = assertType;
exports.importPlayer = importPlayer;
