const ScheduleNode = require("../../adapter/scheduler/scheduleNode");
const db = require("../database");
const { BadRequestError } = require("../utils/errors");
const bcrypt = require("bcrypt");
require("dotenv").config();
require("colors");

class Favorites {
  // works with a sincle scheduleFlow ({an array of scheduleNodes, scheduleRating})
  static async #isValid(scheduleFlow) {
    /**
     * a valid schedule should have at least two required fields
     * schedule and scheduleRating
     * schedule rating schould be of type float or "N/A"
     * schedules schould be an array of scheduleNodes
     * each scheduleNode should have the following fields
     * days, startTime, endTime, coursePrefix, courseCode, nodeIndex, isLab, instructors
     * they should match the correct type
     */

    // check required fields
    if (!scheduleFlow.schedule || !scheduleFlow.scheduleRating)
      throw new BadRequestError("Invalid Schedule Flow: Missing Fields");

    // check field types
    if (
      !Array.isArray(scheduleFlow.schedule) ||
      typeof scheduleFlow.scheduleRating !== "string"
    )
      throw new BadRequestError("Invalid Schedule Flow: Wrong Types");

    // check that schedule rating is valid
    if (scheduleFlow.scheduleRating !== "N/A") {
      // now the rating should be a float if valid
      const rating = parseFloat(scheduleFlow.scheduleRating);
      if (rating < 0 || rating > 5)
        throw new BadRequestError("Invalid Schedule Flow: Wrong Values");
    }

    // handle the schedules now
    const days = new Set(["mon", "tue", "wed", "thu", "fri"]);
    const fields = [
      "days",
      "startTime",
      "endTime",
      "coursePrefix",
      "courseCode",
      "nodeIndex",
      "isLab",
      "instructors",
    ];
    if (
      !scheduleFlow.schedule.every((node) => {
        // check that all required fields are present
        if (fields.some((field) => node[field] === undefined)) return false;

        // check that each required field has the correct type and value
        if (
          !Array.isArray(node.days) ||
          !node.days.every((day) => days.has(day.toLowerCase()))
        )
          return false;

        // check for valid start and end times
        if (
          isNaN(Date.parse(node.startTime)) ||
          isNaN(Date.parse(node.endTime))
        )
          return false;

        if (
          !Array.isArray(node.instructors) ||
          !node.instructors.every(
            (instructor) => instructor.name && instructor.rating || instructor.rating === null
          )
        )
          return false;

        // if all are true
        return true;
      })
    )
      throw new BadRequestError("Invalid Schedule Flow: Invalid Schedules");
  }

  static async add(scheduleFlow, userId) {
    // would throw an error if not valid
    await this.#isValid(scheduleFlow);
    const name = scheduleFlow.name
    delete scheduleFlow.name // ensures uniqueness of the stringified json
    const query = "INSERT INTO favorites (userid, favorite_name, favorite_schedule) VALUES ($1, $2, $3) RETURNING *;"
    const result = await db.query(query, [userId, name, JSON.stringify(scheduleFlow)])
    result.rows[0].favorite_schedule = JSON.parse(result.rows[0].favorite_schedule)
    return {...result.rows[0], name}
  }

  static async getAllFavorites(userId){
    const query = "SELECT * FROM favorites WHERE userid = ($1) ORDER BY added_at DESC;"
    const result = await db.query(query, [userId])
    return result.rows.map(schedule => ({...schedule, favorite_schedule: {... JSON.parse(schedule.favorite_schedule), name: schedule.favorite_name}}))
  }

  static async deleteFavorite(name, userId){
    const query = "DELETE FROM favorites WHERE userid = $1 AND favorite_name = $2 RETURNING *;"
    const result = await db.query(query, [userId, name])
    const schedule = result.rows[0]
    return schedule ? ({...schedule, favorite_schedule: {... JSON.parse(schedule.favorite_schedule), name: schedule.favorite_name}}) : {}
  }
}

module.exports = Favorites;
