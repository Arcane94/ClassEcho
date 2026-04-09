// Visualization model that reads SnapClass-backed trace and code data for playback.
const { visualizationDb: db } = require('../db/connections');
const config = require('../config/appConfig');

const userTable = config.visualizationDatabase.userTable;
const traceTable = config.visualizationDatabase.traceTable;
const emojiTable = config.visualizationDatabase.emojiTable;

exports.getUsersByUsernames = async function (usernames) {
  if (!Array.isArray(usernames) || usernames.length === 0) {
    return [];
  }

  return db(userTable)
    .select('id', 'username')
    .whereIn('username', usernames);
};

exports.getTraceEntriesByUserIdWithinWindow = async function (userId, start, end) {
  return db(traceTable)
    .select('id', 'serverTime', 'projectID', 'assignmentID', 'userID')
    .where('userID', userId)
    .andWhere('serverTime', '>=', start)
    .andWhere('serverTime', '<=', end)
    .whereNotNull('projectID')
    .where('projectID', '<>', '')
    .where('projectID', '<>', 'N/A')
    .whereNotNull('code')
    .where('code', '<>', '')
    .where('code', '<>', 'N/A')
    .orderBy('serverTime', 'asc')
    .orderBy('id', 'asc');
};

exports.getTraceEntryById = async function (rowId) {
  return db(traceTable)
    .select('id', 'serverTime', 'projectID', 'assignmentID', 'userID')
    .where('id', rowId)
    .first();
};

exports.getLatestCodeSnapshotForTarget = async function (projectId, serverTime, rowId) {
  return db(traceTable)
    .select('id', 'serverTime', 'projectID', 'assignmentID', 'userID', 'code')
    .where('projectID', projectId)
    .whereNotNull('code')
    .where('code', '<>', '')
    .where('code', '<>', 'N/A')
    .andWhere(function () {
      this.where('serverTime', '<', serverTime).orWhere(function () {
        this.where('serverTime', serverTime).andWhere('id', '<=', rowId);
      });
    })
    .orderBy('serverTime', 'desc')
    .orderBy('id', 'desc')
    .first();
};

exports.getLatestSelectedSpriteForTarget = async function (projectId, serverTime, rowId) {
  return db(traceTable)
    .select('id', 'serverTime', 'data')
    .where('projectID', projectId)
    .where('message', 'IDE.selectSprite')
    .whereNotNull('data')
    .where('data', '<>', '')
    .andWhere(function () {
      this.where('serverTime', '<', serverTime).orWhere(function () {
        this.where('serverTime', serverTime).andWhere('id', '<=', rowId);
      });
    })
    .orderBy('serverTime', 'desc')
    .orderBy('id', 'desc')
    .first();
};

exports.getLatestEmojiReactionBeforeStart = async function (userId, start) {
  return db(emojiTable)
    .select('id', 'user_id', 'section_id', 'assignment_id', 'emoji_key', 'created_at')
    .where('user_id', userId)
    .andWhere('created_at', '<', start)
    .whereNotNull('emoji_key')
    .where('emoji_key', '<>', '')
    .orderBy('created_at', 'desc')
    .orderBy('id', 'desc')
    .first();
};

exports.getEmojiReactionsByUserIdWithinWindow = async function (userId, start, end) {
  return db(emojiTable)
    .select('id', 'user_id', 'section_id', 'assignment_id', 'emoji_key', 'created_at')
    .where('user_id', userId)
    .andWhere('created_at', '>=', start)
    .andWhere('created_at', '<=', end)
    .whereNotNull('emoji_key')
    .where('emoji_key', '<>', '')
    .orderBy('created_at', 'asc')
    .orderBy('id', 'asc');
};
